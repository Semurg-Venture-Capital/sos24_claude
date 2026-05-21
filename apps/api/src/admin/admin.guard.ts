import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return req.user?.role === 'ADMIN';
  }
}
