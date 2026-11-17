type Environment = Record<string, unknown>;

/**
 * Validate all required settings at startup so the API fails fast when it is
 * misconfigured instead of failing on the first database request.
 */
export function validateEnvironment(values: Environment): Environment {
  const errors: string[] = [];

  const supabaseUrl = typeof values.SUPABASE_URL === 'string'
    ? values.SUPABASE_URL.trim()
    : '';
  const publishableKey = typeof values.SUPABASE_PUBLISHABLE_KEY === 'string'
    ? values.SUPABASE_PUBLISHABLE_KEY.trim()
    : '';
  const secretKey = typeof values.SUPABASE_SECRET_KEY === 'string'
    ? values.SUPABASE_SECRET_KEY.trim()
    : '';

  if (!supabaseUrl) {
    errors.push('SUPABASE_URL is required.');
  } else {
    try {
      const parsedUrl = new URL(supabaseUrl);
      const isLocalHost = ['localhost', '127.0.0.1'].includes(parsedUrl.hostname);
      if (parsedUrl.protocol !== 'https:' && !(isLocalHost && parsedUrl.protocol === 'http:')) {
        errors.push('SUPABASE_URL must use HTTPS (HTTP is allowed only for localhost).');
      }
    } catch {
      errors.push('SUPABASE_URL must be a valid URL.');
    }
  }

  if (!publishableKey) {
    errors.push('SUPABASE_PUBLISHABLE_KEY is required.');
  }

  if (!secretKey) {
    errors.push('SUPABASE_SECRET_KEY is required.');
  } else if (secretKey.length < 20) {
    errors.push('SUPABASE_SECRET_KEY does not look like a valid Supabase key.');
  }

  const port = Number(values.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535.');
  }

  const frontendOrigins = typeof values.FRONTEND_ORIGINS === 'string' && values.FRONTEND_ORIGINS.trim()
    ? values.FRONTEND_ORIGINS.trim()
    : 'http://localhost:5173,http://127.0.0.1:5173';

  for (const origin of frontendOrigins.split(',').map((value) => value.trim()).filter(Boolean)) {
    try {
      const parsedOrigin = new URL(origin);
      if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
        errors.push(`FRONTEND_ORIGINS contains an invalid origin: ${origin}`);
      }
    } catch {
      errors.push(`FRONTEND_ORIGINS contains an invalid URL: ${origin}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return {
    ...values,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY: secretKey,
    FRONTEND_ORIGINS: frontendOrigins,
    PORT: port,
  };
}
