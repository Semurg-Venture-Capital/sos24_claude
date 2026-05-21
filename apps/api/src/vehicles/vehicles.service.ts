import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

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
    try {
      return await this.prisma.vehicle.create({
        data: { userId, ...dto },
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
    try {
      return await this.prisma.vehicle.update({ where: { id }, data: dto });
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
}
