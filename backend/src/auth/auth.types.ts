export type AdminRole = 'owner' | 'editor';

export interface AuthenticatedAdmin {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number | null;
  expiresAt: number | null;
  user: AuthenticatedAdmin;
}

export interface AdminUserRow {
  user_id: string;
  role: AdminRole;
  display_name: string | null;
  is_active: boolean;
}
