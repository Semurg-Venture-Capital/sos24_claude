import { Injectable, NotFoundException } from '@nestjs/common';
import { Driver } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Driver[]> {
    return this.prisma.driver.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Driver> {
    const d = await this.prisma.driver.findFirst({ where: { id, userId } });
    if (!d) throw new NotFoundException('Driver not found');
    return d;
  }

  async create(userId: string, dto: CreateDriverDto): Promise<Driver> {
    return this.prisma.driver.create({
      data: {
        userId,
        name: dto.name,
        licenseSeries: dto.licenseSeries ?? null,
        licenseNumber: dto.licenseNumber ?? null,
        experienceYears: dto.experienceYears ?? 0,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateDriverDto): Promise<Driver> {
    await this.findOne(userId, id);
    return this.prisma.driver.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.driver.delete({ where: { id } });
  }
}
