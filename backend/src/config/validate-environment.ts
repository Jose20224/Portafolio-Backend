type Environment = Record<string, unknown>;

/**
 * Validates required settings at startup so the API fails fast when it is
 * misconfigured instead of failing on the first database request.
 */
export function validateEnvironment(values: Environment): Environment {
  const errors: string[] = [];

  const nodeEnv = typeof values.NODE_ENV === 'string' && values.NODE_ENV.trim()
    ? values.NODE_ENV.trim()
    : 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be development, test, or production.');
  }
  const isProduction = nodeEnv === 'production';

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
      if (isProduction && isLocalHost) {
        errors.push('SUPABASE_URL cannot point to localhost in production.');
      }
      if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
        errors.push('SUPABASE_URL must not contain credentials, query parameters, or a fragment.');
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
  const trustProxyHops = Number(values.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535.');
  }

  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
    errors.push('TRUST_PROXY_HOPS must be an integer between 0 and 10.');
  }

  const configuredOrigins = typeof values.FRONTEND_ORIGINS === 'string'
    ? values.FRONTEND_ORIGINS.trim()
    : '';

  if (isProduction && !configuredOrigins) {
    errors.push('FRONTEND_ORIGINS is required in production.');
  }

  const frontendOrigins = configuredOrigins ||
    'http://localhost:5173,http://127.0.0.1:5173';
  const origins = frontendOrigins.split(',').map((value) => value.trim()).filter(Boolean);

  if (origins.length === 0) {
    errors.push('FRONTEND_ORIGINS must contain at least one exact origin.');
  }

  for (const origin of origins) {
    try {
      const parsedOrigin = new URL(origin);
      const isExactOrigin = parsedOrigin.origin === origin &&
        !parsedOrigin.username && !parsedOrigin.password &&
        !parsedOrigin.search && !parsedOrigin.hash;

      if (!isExactOrigin || !['http:', 'https:'].includes(parsedOrigin.protocol)) {
        errors.push(`FRONTEND_ORIGINS must contain only exact origins without paths: ${origin}`);
      }
      if (isProduction && parsedOrigin.protocol !== 'https:') {
        errors.push(`FRONTEND_ORIGINS must use HTTPS in production: ${origin}`);
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
    NODE_ENV: nodeEnv,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY: secretKey,
    FRONTEND_ORIGINS: origins.join(','),
    PORT: port,
    TRUST_PROXY_HOPS: trustProxyHops,
  };
}
