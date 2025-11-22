import request from 'supertest';

import app from '../index';

describe('Health endpoint', () => {
  it('returns healthy response', async () => {
    const response = await request(app).get('/api/v1/health');
    const body = response.body as unknown as {
      success: boolean;
      message: string;
      environment: string;
      timestamp?: string;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe('string');
    expect(typeof body.environment).toBe('string');
  });
});
