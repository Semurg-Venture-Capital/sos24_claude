import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

const DEV_OTP_CODE = '6330';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async requestOtp(phone: string): Promise<{ sent: true; devCode: string }> {
    // На dev мы не отправляем SMS — код всегда 6330. Возвращаем devCode только
    // для удобства разработки; в продакшене заменим на интеграцию с Playmobile.
    return { sent: true, devCode: DEV_OTP_CODE };
  }

  async verifyOtp(phone: string, code: string): Promise<{ tokens: TokenPair; isNewUser: boolean }> {
    if (code !== DEV_OTP_CODE) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    const user = existing ?? (await this.prisma.user.create({ data: { phone } }));
    const isNewUser = !existing;

    const tokens = await this.issueTokens(user.id, user.phone);
    return { tokens, isNewUser };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; phone: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokens(user.id, user.phone);
  }

  private async issueTokens(userId: string, phone: string): Promise<TokenPair> {
    const payload = { sub: userId, phone };
    const accessTtl = this.config.getOrThrow<string>('JWT_ACCESS_TTL') as unknown as number;
    const refreshTtl = this.config.getOrThrow<string>('JWT_REFRESH_TTL') as unknown as number;
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });
    return { accessToken, refreshToken };
  }
}
