import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment } from '../dist/config/validate-environment.js';

const productionEnvironment = (overrides = {}) => ({
  NODE_ENV: 'production',
  SUPABASE_URL: 'https://example-project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${'p'.repeat(40)}`,
  SUPABASE_SECRET_KEY: `sb_secret_${'s'.repeat(40)}`,
  FRONTEND_ORIGINS: 'https://portfolio.example.com',
  PORT: '10000',
  TRUST_PROXY_HOPS: '1',
  ...overrides,
});

test('accepts a valid production environment and normalizes numeric settings', () => {
  const validated = validateEnvironment(productionEnvironment());
  assert.equal(validated.NODE_ENV, 'production');
  assert.equal(validated.PORT, 10000);
  assert.equal(validated.TRUST_PROXY_HOPS, 1);
  assert.equal(validated.FRONTEND_ORIGINS, 'https://portfolio.example.com');
});

test('requires an explicit frontend origin in production', () => {
  assert.throws(
    () => validateEnvironment(productionEnvironment({ FRONTEND_ORIGINS: '' })),
    /FRONTEND_ORIGINS is required in production/,
  );
});

test('rejects insecure HTTP origins in production', () => {
  assert.throws(
    () => validateEnvironment(productionEnvironment({ FRONTEND_ORIGINS: 'http://portfolio.example.com' })),
    /must use HTTPS in production/,
  );
});

test('rejects wildcard origins and origins containing paths', () => {
  assert.throws(
    () => validateEnvironment(productionEnvironment({ FRONTEND_ORIGINS: '*' })),
    /invalid URL|exact origins/,
  );
  assert.throws(
    () => validateEnvironment(productionEnvironment({ FRONTEND_ORIGINS: 'https://portfolio.example.com/admin' })),
    /exact origins without paths/,
  );
});

test('rejects localhost Supabase URLs in production', () => {
  assert.throws(
    () => validateEnvironment(productionEnvironment({ SUPABASE_URL: 'http://localhost:54321' })),
    /cannot point to localhost in production/,
  );
});

test('development environment retains local-origin defaults', () => {
  const validated = validateEnvironment({
    SUPABASE_URL: 'https://example-project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${'p'.repeat(40)}`,
    SUPABASE_SECRET_KEY: `sb_secret_${'s'.repeat(40)}`,
  });
  assert.equal(validated.NODE_ENV, 'development');
  assert.equal(
    validated.FRONTEND_ORIGINS,
    'http://localhost:5173,http://127.0.0.1:5173',
  );
});
