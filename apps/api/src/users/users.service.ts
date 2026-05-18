import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const data: Prisma.UserUpdateInput = {
      name: dto.name,
      surname: dto.surname,
      patronymic: dto.patronymic,
      locale: dto.locale,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    };
    return this.prisma.user.update({ where: { id }, data });
  }
}
