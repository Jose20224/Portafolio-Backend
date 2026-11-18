import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiRateLimitMiddleware } from '../dist/common/middleware/api-rate-limit.middleware.js';

function send(middleware, { method = 'GET', path = '/api/v1/portfolio/profile', ip = '203.0.113.10' } = {}) {
  let nextCalled = false;
  let statusCode = 200;
  let body;
  const headers = {};
  const request = { method, path, ip, socket: { remoteAddress: ip } };
  const response = {
    setHeader(name, value) { headers[name] = value; return this; },
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  middleware.use(request, response, () => { nextCalled = true; });
  return { nextCalled, statusCode, body, headers };
}

test('allows up to 120 API requests per minute per client IP', () => {
  const middleware = new ApiRateLimitMiddleware();
  for (let index = 0; index < 120; index += 1) {
    assert.equal(send(middleware).nextCalled, true);
  }
  const blocked = send(middleware);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.statusCode, 429);
  assert.ok(Number(blocked.headers['Retry-After']) >= 1);
});

test('limits login attempts to ten per fifteen minutes per client IP', () => {
  const middleware = new ApiRateLimitMiddleware();
  for (let index = 0; index < 10; index += 1) {
    assert.equal(send(middleware, { method: 'POST', path: '/api/v1/auth/login' }).nextCalled, true);
  }
  const blocked = send(middleware, { method: 'POST', path: '/api/v1/auth/login' });
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.statusCode, 429);
  assert.match(blocked.body.message, /inicio de sesión/);
});

test('does not rate-limit CORS preflight or liveness probes', () => {
  const middleware = new ApiRateLimitMiddleware();
  for (let index = 0; index < 150; index += 1) {
    assert.equal(send(middleware, { method: 'OPTIONS' }).nextCalled, true);
    assert.equal(send(middleware, { path: '/api/v1/health/live' }).nextCalled, true);
  }
});
