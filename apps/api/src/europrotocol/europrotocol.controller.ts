import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ValidatePolicyDto } from './dto/validate-policy.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { EuroprotocolService } from './europrotocol.service';

@ApiTags('europrotocol')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('europrotocol')
export class EuroprotocolController {
  constructor(private readonly euro: EuroprotocolService) {}

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
}
