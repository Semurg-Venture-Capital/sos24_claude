import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { SubmitEuroDto } from './dto/submit-euro.dto';
import { ValidatePolicyDto } from './dto/validate-policy.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { EuroprotocolPdfService } from './europrotocol-pdf.service';
import { EuroprotocolService } from './europrotocol.service';

@ApiTags('europrotocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('europrotocol')
export class EuroprotocolController {
  constructor(
    private readonly euro: EuroprotocolService,
    private readonly pdf: EuroprotocolPdfService,
  ) {}

  @Post('me/step-up')
  @ApiOperation({ summary: 'Шаг-ап MyID инициатора — подтвердить присутствие владельца аккаунта.' })
  stepUp(@CurrentUser() user: JwtPayload, @Body() dto: VerifyCodeDto) {
    return this.euro.stepUp(user.sub, dto.code);
  }

  @Post('participant/verify')
  @ApiOperation({ summary: 'Верификация второго участника через MyID (find-or-create EuroParticipant).' })
  verifyParticipant(@Body() dto: VerifyCodeDto) {
    return this.euro.verifyParticipant(dto.code);
  }

  @Post('validate-policy')
  @ApiOperation({ summary: 'Валидация полиса ОСАГО второго участника по серии+номеру через НАПП.' })
  validatePolicy(@Body() dto: ValidatePolicyDto) {
    return this.euro.validatePolicy(dto.seria, dto.number);
  }

  @Post()
  @ApiOperation({ summary: 'Отправить европротокол (сбор данных визарда).' })
  submit(@CurrentUser() user: JwtPayload, @Body() dto: SubmitEuroDto) {
    return this.euro.submit(user.sub, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Список европротоколов текущего пользователя.' })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.euro.listByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Деталь европротокола (свой).' })
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.euro.findOneForUser(user.sub, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Сгенерировать PDF бланка «Извещение о ДТП» (свой европротокол).' })
  @ApiProduces('application/pdf')
  async pdfFile(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Res() res: Response) {
    await this.euro.findOneForUser(user.sub, id); // проверка владельца (бросит 404, если не свой)
    const { buffer, filename } = await this.pdf.generate(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
