import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const serverAuthOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
};

@Injectable()
export class SupabaseService {
  private readonly serviceClient: SupabaseClient;
  private readonly authClient: SupabaseClient;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const publishableKey = config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY');
    const secretKey = config.getOrThrow<string>('SUPABASE_SECRET_KEY');

    // This client bypasses RLS. It must remain inside the trusted API process.
    this.serviceClient = createClient(url, secretKey, {
      auth: serverAuthOptions,
      global: {
        headers: { 'X-Client-Info': 'portafolio-api/server' },
      },
    });

    // This client uses the publishable key for Auth operations that validate
    // end-user access tokens. It does not persist a browser session.
    this.authClient = createClient(url, publishableKey, {
      auth: serverAuthOptions,
      global: {
        headers: { 'X-Client-Info': 'portafolio-api/auth' },
      },
    });
  }

  /** Use only from backend services that have already enforced authorization. */
  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  /** Used by the future authentication module to verify a user's JWT. */
  getAuthClient(): SupabaseClient {
    return this.authClient;
  }

  /** Performs a lightweight real query against the portfolio schema. */
  async checkDatabaseConnection(): Promise<void> {
    const { error } = await this.serviceClient
      .from('portfolio_profile')
      .select('id')
      .limit(1);

    if (error) {
      throw new Error(`Supabase database check failed (${error.code ?? 'unknown'}).`);
    }
  }
}
