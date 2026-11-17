import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type {
  AdminUserRow,
  AuthenticatedAdmin,
  AuthSessionResponse,
} from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string): Promise<AuthSessionResponse> {
    const { data, error } = await this.supabase
      .getAuthClient()
      .auth.signInWithPassword({ email: email.trim().toLowerCase(), password });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta sin acceso administrativo.');
    }

    try {
      const admin = await this.getActiveAdmin(data.user.id);
      return this.toSessionResponse(data.user, data.session, admin);
    } catch (error) {
      // Do not leave an unreturned session active if the account is not an admin.
      await this.revokeCurrentSession(data.session.access_token);
      throw error;
    }
  }

  async refresh(refreshToken: string): Promise<AuthSessionResponse> {
    const { data, error } = await this.supabase
      .getAuthClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('La sesión expiró. Inicia sesión nuevamente.');
    }

    try {
      const admin = await this.getActiveAdmin(data.user.id);
      return this.toSessionResponse(data.user, data.session, admin);
    } catch (error) {
      await this.revokeCurrentSession(data.session.access_token);
      throw error;
    }
  }

  async validateAccessToken(accessToken: string): Promise<AuthenticatedAdmin> {
    // getUser(jwt) asks Supabase Auth to verify the token. Do not decode the JWT
    // locally or trust role/email claims supplied by the browser.
    const { data, error } = await this.supabase
      .getAuthClient()
      .auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('La sesión no es válida o ha expirado.');
    }

    const admin = await this.getActiveAdmin(data.user.id);
    return this.toAdminUser(data.user, admin);
  }

  async logout(accessToken: string): Promise<void> {
    const { error } = await this.supabase
      .getServiceClient()
      .auth.admin.signOut(accessToken, 'local');

    if (error) {
      // Do not disclose provider internals. The browser should clear its local
      // session even if Auth is temporarily unavailable.
      throw new InternalServerErrorException('No fue posible cerrar la sesión en este momento.');
    }
  }

  private async getActiveAdmin(userId: string): Promise<AdminUserRow> {
    const { data: rawAdmin, error } = await this.supabase
      .getServiceClient()
      .from('admin_users')
      .select('user_id, role, display_name, is_active')
      .eq('user_id', userId)
      .maybeSingle();

    const data = rawAdmin as AdminUserRow | null;

    if (error) {
      throw new InternalServerErrorException('No fue posible comprobar los permisos administrativos.');
    }

    if (!data || !data.is_active) {
      throw new ForbiddenException('La cuenta no tiene permisos administrativos activos.');
    }

    if (data.role !== 'owner' && data.role !== 'editor') {
      throw new ForbiddenException('El rol de la cuenta no está autorizado.');
    }

    return data;
  }

  private toSessionResponse(
    user: User,
    session: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      expires_at?: number;
    },
    admin: AdminUserRow,
  ): AuthSessionResponse {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      tokenType: session.token_type,
      expiresIn: session.expires_in,
      expiresAt: session.expires_at ?? null,
      user: this.toAdminUser(user, admin),
    };
  }

  private toAdminUser(user: User, admin: AdminUserRow): AuthenticatedAdmin {
    return {
      userId: user.id,
      email: user.email ?? null,
      role: admin.role,
      displayName: admin.display_name,
    };
  }

  private async revokeCurrentSession(accessToken: string): Promise<void> {
    await this.supabase
      .getServiceClient()
      .auth.admin.signOut(accessToken, 'local');
  }
}
