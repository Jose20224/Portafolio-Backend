import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedAdmin } from '../../auth/auth.types.js';

interface AuthenticatedRequest extends Request {
  adminUser?: AuthenticatedAdmin;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.adminUser as AuthenticatedAdmin;
  },
);
