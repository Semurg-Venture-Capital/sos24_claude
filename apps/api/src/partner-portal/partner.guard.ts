import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt.strategy';

// Доступ к B2B-кабинету (partner.sos24.uz): только роль PARTNER.
// Привязка к конкретной сущности (компания/точка) проверяется в сервисе по ownerId.
@Injectable()
export class PartnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return req.user?.role === 'PARTNER';
  }
}
