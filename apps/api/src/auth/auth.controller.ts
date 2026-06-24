import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshDto } from './dto/refresh.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Запросить OTP-код. На dev код всегда 6330.' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Подтвердить OTP-код. Возвращает пару JWT.' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const { tokens, isNewUser, verificationStatus, role } = await this.authService.verifyOtp(dto.phone, dto.code);
    return { ...tokens, isNewUser, verificationStatus, role };
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логин для Admin Panel. Телефон + OTP, роль ADMIN обязательна.' })
  async adminLogin(@Body() dto: VerifyOtpDto) {
    const { tokens, role } = await this.authService.adminLogin(dto.phone, dto.code);
    return { ...tokens, role };
  }

  @Post('partner/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логин в B2B-кабинет (partner.sos24.uz). Телефон + OTP, роль PARTNER.' })
  async partnerLogin(@Body() dto: VerifyOtpDto) {
    const { tokens, role, kind } = await this.authService.partnerLogin(dto.phone, dto.code);
    return { ...tokens, role, kind };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить пару токенов по refresh-токену.' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
