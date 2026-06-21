import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt.strategy';

// Доступ к чатам поддержки в админке: операторы (SUPPORT) и админы (ADMIN).
@Injectable()
export class SupportGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return req.user?.role === 'SUPPORT' || req.user?.role === 'ADMIN';
  }
}
