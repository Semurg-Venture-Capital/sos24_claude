import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NappService, TechPassportInfo } from '../napp/napp.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly napp: NappService,
  ) {}

  async list(userId: string): Promise<Vehicle[]> {
    return this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Vehicle> {
    const v = await this.prisma.vehicle.findFirst({ where: { id, userId } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async create(userId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    const { techPassportSeria, techPassportNumber, ...base } = dto;

    // Если есть серия+номер техпаспорта — подтягиваем полные данные из НАПП.
    const nappData = await this.enrichFromNapp(base.plate, techPassportSeria, techPassportNumber);

    try {
      return await this.prisma.vehicle.create({
        data: {
          userId,
          ...base,
          techPassportSeria: techPassportSeria ?? null,
          techPassportNumber: techPassportNumber ?? null,
          ...nappData,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Авто с таким номером уже добавлено');
      }
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    await this.findOne(userId, id);
    // techPassportSeria/Number не маппим в апдейт напрямую как lookup — обновляем как обычные поля.
    const { techPassportSeria, techPassportNumber, ...rest } = dto;
    const data: Prisma.VehicleUpdateInput = {
      ...rest,
      ...(techPassportSeria !== undefined && { techPassportSeria }),
      ...(techPassportNumber !== undefined && { techPassportNumber }),
    };
    try {
      return await this.prisma.vehicle.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Авто с таким номером уже добавлено');
      }
      throw e;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.vehicle.delete({ where: { id } });
  }

  /**
   * Дозагружает данные ТС из НАПП по техпаспорту + госномеру и собирает промо-поля
   * + nappRaw. Если владелец — юрлицо, тянет карточку организации по ИНН (nappOrgRaw).
   * При любой ошибке возвращает пустой объект — создание авто не блокируется.
   */
  private async enrichFromNapp(
    plate: string,
    seria?: string,
    number?: string,
  ): Promise<Record<string, unknown>> {
    if (!seria?.trim() || !number?.trim()) return {};

    const gov = plate.replace(/\s+/g, '').toUpperCase();
    try {
      const env = await this.napp.getVehicleByTechPassport(seria, number, gov);
      if (env.error !== 0 || !env.result) {
        this.logger.warn(`НАПП не вернул данные ТС для ${gov}: ${env.error_message}`);
        return {};
      }
      const info: TechPassportInfo = env.result;

      // Если владелец — юрлицо (есть ИНН), подтягиваем карточку организации.
      let nappOrgRaw: unknown = null;
      if (info.inn?.trim()) {
        const org = await this.napp.getOrganizationByInn(info.inn);
        if (org.error === 0 && org.result) nappOrgRaw = org.result;
      }

      return {
        vehicleTypeId: info.vehicleTypeId ?? null,
        bodyNumber: info.bodyNumber || null,
        engineNumber: info.engineNumber || null,
        fuelType: info.fuelType || null,
        seats: this.toInt(info.seats),
        stands: this.toInt(info.stands),
        fullWeight: info.fullWeight || null,
        emptyWeight: info.emptyWeight || null,
        division: info.division || null,
        pVehicleId: info.pVehicleId || null,
        techPassportDate: this.toDate(info.techPassportIssueDate),
        ownerName: info.owner || null,
        ownerInn: info.inn || null,
        ownerPinfl: info.pinfl || null,
        nappRaw: info as unknown as Prisma.InputJsonValue,
        ...(nappOrgRaw ? { nappOrgRaw: nappOrgRaw as Prisma.InputJsonValue } : {}),
        nappSyncedAt: new Date(),
      };
    } catch (e) {
      this.logger.error(`enrichFromNapp провалился для ${gov}: ${(e as Error).message}`);
      return {};
    }
  }

  private toInt(v: string | number | null | undefined): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = parseInt(String(v), 10);
    return Number.isNaN(n) ? null : n;
  }

  private toDate(v: string | null | undefined): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
}
