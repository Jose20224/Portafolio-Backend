import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '../../auth/auth.types.js';

export const ADMIN_ROLES_KEY = 'admin_roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);
