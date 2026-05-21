import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PolicyStatus } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CalculatePolicyDto } from './dto/calculate-policy.dto';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PoliciesService } from './policies.service';

@ApiTags('policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Post('policies/calculate')
  @ApiOperation({ summary: 'Расчёт цены полиса (без сохранения).' })
  calculate(@CurrentUser() user: JwtPayload, @Body() dto: CalculatePolicyDto) {
    return this.policies.calculate(user.sub, dto);
  }

  @Post('policies')
  @ApiOperation({ summary: 'Создать полис (статус DRAFT, до оплаты).' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePolicyDto) {
    return this.policies.createDraft(user.sub, dto);
  }

  @Get('me/policies')
  @ApiQuery({ name: 'status', enum: PolicyStatus, required: false })
  @ApiOperation({ summary: 'Полисы пользователя (можно отфильтровать по статусу).' })
  list(@CurrentUser() user: JwtPayload, @Query('status') status?: PolicyStatus) {
    return this.policies.list(user.sub, status);
  }

  @Get('policies/:id')
  @ApiOperation({ summary: 'Деталь полиса (только свой).' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.policies.findOne(user.sub, id);
  }
}
