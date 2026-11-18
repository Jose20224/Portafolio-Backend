import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RateLimitRule = {
  key: string;
  limit: number;
  message: string;
};

/**
 * Lightweight per-process sliding-window limiter for the public contact form.
 * It deliberately stores no persistent IP data and adds no infrastructure.
 * For multiple API replicas, use a shared Redis/gateway limiter before production.
 */
@Injectable()
export class ContactRateLimitService {
  private readonly attempts = new Map<string, number[]>();
  private readonly windowMs = 60 * 60 * 1000;
  private readonly maxKeys = 20_000;
  private nextCleanupAt = Date.now() + 5 * 60 * 1000;

  consume(rules: RateLimitRule[]): void {
    const now = Date.now();
    if (now >= this.nextCleanupAt) {
      this.removeExpired(now);
      this.nextCleanupAt = now + 5 * 60 * 1000;
    }

    const pending: Array<{ key: string; timestamps: number[] }> = [];
    for (const rule of rules) {
      const cutoff = now - this.windowMs;
      const recent = (this.attempts.get(rule.key) ?? []).filter((timestamp) => timestamp > cutoff);
      if (recent.length >= rule.limit) {
        throw new HttpException(rule.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      pending.push({ key: rule.key, timestamps: [...recent, now] });
    }

    // Apply counters only after every rule passed, so a rejected request does
    // not consume quota from the other key (IP/email).
    for (const entry of pending) this.attempts.set(entry.key, entry.timestamps);

    // Bound memory if a bot rotates many email values between cleanup runs.
    while (this.attempts.size > this.maxKeys) {
      const oldestKey = this.attempts.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.attempts.delete(oldestKey);
    }
  }

  private removeExpired(now: number): void {
    const cutoff = now - this.windowMs;
    for (const [key, timestamps] of this.attempts.entries()) {
      const recent = timestamps.filter((timestamp) => timestamp > cutoff);
      if (recent.length === 0) this.attempts.delete(key);
      else this.attempts.set(key, recent);
    }
  }
}
