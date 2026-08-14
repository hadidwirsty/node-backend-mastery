import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';

describe('Express Application Integration Tests', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 with health metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.uptime).toBeTypeOf('number');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('POST /api/v1/logs/transform should transform raw log data via stream', async () => {
    const rawLog = 'INFO 2026-08-14 API request received with token=SecretToken99\n';

    const res = await request(app)
      .post('/api/v1/logs/transform')
      .set('Content-Type', 'text/plain')
      .send(rawLog);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data[0].level).toBe('INFO');
    expect(res.body.data[0].message).toContain('token=***REDACTED***');
  });

  it('GET /api/v1/non-existent-route should trigger 404 AppError envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });
});
