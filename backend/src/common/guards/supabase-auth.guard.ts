import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedAdmin } from '../../auth/auth.types.js';
import { AuthService } from '../../auth/auth.service.js';

export interface AuthenticatedRequest extends Request {
  adminUser?: AuthenticatedAdmin;
  accessToken?: string;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(.+)$/i)
      : null;

    if (!match?.[1]) {
      throw new UnauthorizedException('Debes iniciar sesión para continuar.');
    }

    const accessToken = match[1].trim();
    if (!accessToken || accessToken.length > 8192) {
      throw new UnauthorizedException('El token de acceso no es válido.');
    }

    request.adminUser = await this.authService.validateAccessToken(accessToken);
    request.accessToken = accessToken;
    return true;
  }
}
