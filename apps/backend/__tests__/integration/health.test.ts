import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

interface ReadinessBody {
  status: 'ok' | 'error';
  dependencies: { database: { status: 'up' | 'down'; message?: string } };
}

interface ErrorBody {
  error: { message: string; requestId: string };
}

import { getDatabaseAdapter } from '../../src/config/database.js';

// GET /health/ready lazily creates the database client/pool on first call.
// Close it once the suite finishes rather than leaving it for process exit
// — harmless today since DATABASE_URL points nowhere reachable, but this
// will matter once tests run against a real ephemeral database in CI.
afterAll(async () => {
  await getDatabaseAdapter().close();
});

describe('GET /health/live', () => {
  it('returns 200 without touching the database', async () => {
    const app = createApp();
    const response = await request(app).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('GET /health/ready', () => {
  it('returns 503 with a structured body when the database is unreachable', async () => {
    const app = createApp();
    const response = await request(app).get('/health/ready');
    const body = response.body as ReadinessBody;

    expect(response.status).toBe(503);
    expect(body.status).toBe('error');
    expect(body.dependencies.database.status).toBe('down');
  });
});

describe('unmatched routes', () => {
  it('returns a structured 404 with a request id', async () => {
    const app = createApp();
    const response = await request(app).get('/nonexistent');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(404);
    expect(body.error.message).toContain('Cannot GET /nonexistent');
    expect(body.error.requestId).toBeTruthy();
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});
