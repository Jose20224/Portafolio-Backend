import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import type { AuthenticatedAdmin } from '../auth/auth.types.js';

@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AdminController {
  @Get('session')
  getSession(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return {
      authenticated: true,
      user: admin,
      permissions: admin.role === 'owner'
        ? ['content:read', 'content:write', 'messages:manage', 'admins:manage']
        : ['content:read', 'content:write', 'messages:manage'],
    };
  }

  @Get('owner-check')
  @Roles('owner')
  ownerCheck(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return {
      authorized: true,
      role: admin.role,
      message: 'La cuenta tiene permisos de propietario.',
    };
  }
}
