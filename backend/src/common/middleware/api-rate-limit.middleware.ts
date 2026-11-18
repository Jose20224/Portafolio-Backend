import type { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Per-process API limiter. It protects the login endpoint and bounds general
 * traffic without adding another runtime dependency. For multiple replicas,
 * replace this store with a shared Redis or edge-gateway limiter.
 */
export class ApiRateLimitMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly generalWindowMs = 60_000;
  private readonly generalLimit = 120;
  private readonly loginWindowMs = 15 * 60_000;
  private readonly loginLimit = 10;
  private readonly maxBuckets = 20_000;
  private nextCleanupAt = Date.now() + 60_000;

  use(request: Request, response: Response, next: NextFunction): void {
    if (request.method === 'OPTIONS' || request.path.endsWith('/health/live')) {
      next();
      return;
    }

    const now = Date.now();
    this.cleanupExpired(now);

    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const general = this.consume(`api:${ip}`, this.generalLimit, this.generalWindowMs, now);
    this.setRateLimitHeaders(response, general);

    if (!general.allowed) {
      this.reject(response, general);
      return;
    }

    const isLogin = request.method === 'POST' && /\/auth\/login\/?$/.test(request.path);
    if (isLogin) {
      const login = this.consume(`login:${ip}`, this.loginLimit, this.loginWindowMs, now);
      if (!login.allowed) {
        this.setRateLimitHeaders(response, login);
        this.reject(
          response,
          login,
          'Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde.',
        );
        return;
      }
    }

    next();
  }

  private consume(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
    const current = this.buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

    if (bucket.count >= limit) {
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    }

    bucket.count += 1;
    this.buckets.delete(key);
    this.buckets.set(key, bucket);

    while (this.buckets.size > this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.buckets.delete(oldestKey);
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  private setRateLimitHeaders(response: Response, result: RateLimitResult): void {
    response.setHeader('RateLimit-Limit', String(result.limit));
    response.setHeader('RateLimit-Remaining', String(result.remaining));
    response.setHeader('RateLimit-Reset', String(result.retryAfterSeconds));
  }

  private reject(
    response: Response,
    result: RateLimitResult,
    message = 'Se alcanzó el límite de solicitudes. Intenta nuevamente más tarde.',
  ): void {
    response.setHeader('Retry-After', String(result.retryAfterSeconds));
    response.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message,
    });
  }

  private cleanupExpired(now: number): void {
    if (now < this.nextCleanupAt) return;

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }

    this.nextCleanupAt = now + 60_000;
  }
}
