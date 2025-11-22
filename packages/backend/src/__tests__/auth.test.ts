import request from 'supertest';

import app from '../index';

describe('Auth scaffolding', () => {
  it('logs in with placeholder implementation', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@adria.cross', password: 'password123' });

    const body = response.body as unknown as {
      success: boolean;
      token?: string;
      user?: { email: string; role: string };
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.user?.email).toBe('demo@adria.cross');
  });

  it('blocks /me without auth header', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });

  it('returns profile when auth header present', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer mock');

    const body = response.body as unknown as { user?: { role?: string } };

    expect(response.status).toBe(200);
    expect(body.user?.role).toBe('client');
  });
});
