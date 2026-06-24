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

  async requestOtp(phone: string): Promise<{ sent: true; devCode?: string }> {
    // SMS пока не отправляем — код всегда 6330 (см. DEV_OTP_CODE).
    // devCode отдаём только вне прода (удобство разработки); на проде не светим.
    // TODO: интеграция Playmobile + реальная генерация/проверка OTP.
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return isProd ? { sent: true } : { sent: true, devCode: DEV_OTP_CODE };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ tokens: TokenPair; isNewUser: boolean; verificationStatus: string; role: string }> {
    if (code !== DEV_OTP_CODE) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    const user = existing ?? (await this.prisma.user.create({ data: { phone } }));
    const isNewUser = !existing;

    const tokens = await this.issueTokens(user.id, user.phone, user.role);
    return { tokens, isNewUser, verificationStatus: user.verificationStatus, role: user.role };
  }

  async adminLogin(
    phone: string,
    code: string,
  ): Promise<{ tokens: TokenPair; role: string }> {
    if (code !== DEV_OTP_CODE) {
      throw new UnauthorizedException('Invalid OTP code');
    }
    const user = await this.prisma.user.findUnique({ where: { phone } });
    // В админку допускаются ADMIN и операторы поддержки (SUPPORT).
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
      throw new UnauthorizedException('Not an admin account');
    }
    const tokens = await this.issueTokens(user.id, user.phone, user.role);
    return { tokens, role: user.role };
  }

  // Логин в B2B-кабинет partner.sos24.uz. Пускаем только роль PARTNER.
  // Тип кабинета (страховая / сервис-партнёр) определяется тем, какой сущностью владеет пользователь.
  async partnerLogin(
    phone: string,
    code: string,
  ): Promise<{ tokens: TokenPair; role: string; kind: 'INSURER' | 'SERVICE' | null }> {
    if (code !== DEV_OTP_CODE) {
      throw new UnauthorizedException('Invalid OTP code');
    }
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { ownedCompany: { select: { id: true } }, ownedPartner: { select: { id: true } } },
    });
    if (!user || user.role !== 'PARTNER') {
      throw new UnauthorizedException('Not a partner account');
    }
    const kind = user.ownedCompany ? 'INSURER' : user.ownedPartner ? 'SERVICE' : null;
    if (!kind) {
      // Аккаунт с ролью PARTNER, но не привязан ни к компании, ни к точке — кабинет пуст.
      throw new UnauthorizedException('Partner account is not linked to a company or partner location');
    }
    const tokens = await this.issueTokens(user.id, user.phone, user.role);
    return { tokens, role: user.role, kind };
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

    return this.issueTokens(user.id, user.phone, user.role);
  }

  private async issueTokens(userId: string, phone: string, role: string = 'USER'): Promise<TokenPair> {
    const payload = { sub: userId, phone, role };
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
