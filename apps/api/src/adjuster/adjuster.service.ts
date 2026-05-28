import { Injectable, NotFoundException } from '@nestjs/common';
import { AdjusterStatus, IncidentType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAdjusterRequestDto {
  incidentType: IncidentType;
  address: string;
  lat?: number;
  lng?: number;
  comment?: string;
  policyId?: string;
}

export interface UpdateAdjusterStatusDto {
  status: AdjusterStatus;
  adjusterNote?: string;
  assignedAdjusterId?: string;
  adjusterName?: string;
  adjusterPhone?: string;
}

const POLICY_SELECT = {
  id: true,
  type: true,
  policyNumber: true,
  vehicle: { select: { brand: true, model: true, plate: true } },
} as const;

const ADJUSTER_USER_SELECT = {
  id: true, name: true, surname: true, phone: true,
} as const;

// Enrich items: attach policy + assignedAdjuster objects and compute display fields.
async function enrichItems(prisma: PrismaService, items: any[]) {
  // Batch fetch policies
  const policyIds = [...new Set(items.map(i => i.policyId).filter(Boolean) as string[])];
  const policyMap = new Map<string, any>();
  if (policyIds.length > 0) {
    const policies = await prisma.policy.findMany({
      where: { id: { in: policyIds } },
      select: POLICY_SELECT,
    });
    policies.forEach(p => policyMap.set(p.id, p));
  }

  // Batch fetch assigned adjusters
  const adjusterIds = [...new Set(items.map(i => i.assignedAdjusterId).filter(Boolean) as string[])];
  const adjusterMap = new Map<string, any>();
  if (adjusterIds.length > 0) {
    const adjusters = await prisma.user.findMany({
      where: { id: { in: adjusterIds } },
      select: ADJUSTER_USER_SELECT,
    });
    adjusters.forEach(a => adjusterMap.set(a.id, a));
  }

  return items.map(item => {
    const systemAdjuster = item.assignedAdjusterId ? adjusterMap.get(item.assignedAdjusterId) ?? null : null;
    const adjusterDisplayName = systemAdjuster
      ? [systemAdjuster.surname, systemAdjuster.name].filter(Boolean).join(' ') || systemAdjuster.name
      : item.adjusterName ?? null;
    const adjusterDisplayPhone = systemAdjuster?.phone ?? item.adjusterPhone ?? null;

    return {
      ...item,
      policy: item.policyId ? policyMap.get(item.policyId) ?? null : null,
      assignedAdjuster: systemAdjuster,
      adjusterDisplayName,
      adjusterDisplayPhone,
    };
  });
}

@Injectable()
export class AdjusterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAdjusterRequestDto) {
    return this.prisma.adjusterRequest.create({
      data: { userId, ...dto },
      include: { user: { select: { id: true, name: true, surname: true, phone: true } } },
    });
  }

  async findByUser(userId: string) {
    const items = await this.prisma.adjusterRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return enrichItems(this.prisma, items);
  }

  async findAll(status?: AdjusterStatus, page = 1, limit = 20) {
    const where = status ? { status } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adjusterRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, surname: true, phone: true } },
        },
      }),
      this.prisma.adjusterRequest.count({ where }),
    ]);
    const enriched = await enrichItems(this.prisma, items);
    return { items: enriched, total };
  }

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [newCount, accepted, enRoute, completedToday, cancelledToday] = await Promise.all([
      this.prisma.adjusterRequest.count({ where: { status: 'NEW' } }),
      this.prisma.adjusterRequest.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.adjusterRequest.count({ where: { status: 'EN_ROUTE' } }),
      this.prisma.adjusterRequest.count({ where: { status: 'COMPLETED', updatedAt: { gte: todayStart } } }),
      this.prisma.adjusterRequest.count({ where: { status: 'CANCELLED', updatedAt: { gte: todayStart } } }),
    ]);

    return { new: newCount, inProgress: accepted + enRoute, completedToday, cancelledToday };
  }

  async updateStatus(id: string, dto: UpdateAdjusterStatusDto) {
    const req = await this.prisma.adjusterRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Adjuster request not found');

    const updated = await this.prisma.adjusterRequest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.adjusterNote !== undefined && { adjusterNote: dto.adjusterNote }),
        ...(dto.assignedAdjusterId !== undefined && { assignedAdjusterId: dto.assignedAdjusterId }),
        ...(dto.adjusterName !== undefined && { adjusterName: dto.adjusterName }),
        ...(dto.adjusterPhone !== undefined && { adjusterPhone: dto.adjusterPhone }),
      },
      include: { user: { select: { id: true, name: true, surname: true, phone: true } } },
    });

    const [enriched] = await enrichItems(this.prisma, [updated]);
    return enriched;
  }

  // List system adjusters (users with role=ADJUSTER)
  async findAdjusterUsers() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADJUSTER },
      select: { id: true, name: true, surname: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Create a new adjuster user
  async createAdjusterUser(data: { name: string; surname?: string; phone: string }) {
    const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      // Upgrade existing user to ADJUSTER role
      return this.prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADJUSTER, name: data.name, surname: data.surname },
        select: { id: true, name: true, surname: true, phone: true, role: true },
      });
    }
    return this.prisma.user.create({
      data: { phone: data.phone, name: data.name, surname: data.surname, role: UserRole.ADJUSTER },
      select: { id: true, name: true, surname: true, phone: true, role: true },
    });
  }
}
