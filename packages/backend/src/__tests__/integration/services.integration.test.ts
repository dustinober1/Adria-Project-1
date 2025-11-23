import request from 'supertest';

import app from '../../index';
import {
  cleanupTestUsers,
  disconnectPrisma,
  prisma,
} from '../helpers/dbTestHelper';

const adminCredentials = {
  email: `admin-service-${Date.now()}@example.com`,
  password: 'ValidPass123',
  firstName: 'Admin',
  lastName: 'Services',
  role: 'admin',
};

const createAdmin = async () => {
  const response = await request(app).post('/api/v1/auth/register').send(adminCredentials);
  return {
    token: response.body.accessToken as string,
  };
};

describe('Services API', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await disconnectPrisma();
  });

  it('creates, lists, retrieves, updates, and deletes a service (admin)', async () => {
    const admin = await createAdmin();

    const createRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Test Styling Session',
        description: 'A test service description for integration testing.',
        durationMinutes: 90,
        priceCents: 15000,
        active: true,
      });

    expect(createRes.status).toBe(201);
    const serviceId = createRes.body.data.id as string;
    const serviceSlug = createRes.body.data.slug as string;

    const listRes = await request(app).get('/api/v1/services');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((s: { id: string }) => s.id === serviceId)).toBe(
      true
    );

    const detailRes = await request(app).get(`/api/v1/services/slug/${serviceSlug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.id).toBe(serviceId);

    const updateRes = await request(app)
      .put(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Updated Test Styling',
        priceCents: 17500,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.slug).toBe('updated-test-styling');

    const deleteRes = await request(app)
      .delete(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(deleteRes.status).toBe(200);

    const afterDelete = await request(app).get(`/api/v1/services/${serviceId}`);
    expect(afterDelete.status).toBe(404);
  });

  it('enforces unique slug on create', async () => {
    const admin = await createAdmin();

    const payload = {
      name: 'Duplicate Service',
      description: 'First service',
      durationMinutes: 60,
      priceCents: 10000,
    };

    await prisma.service.deleteMany({
      where: {
        slug: 'duplicate-service',
      },
    });

    const first = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(payload);

    expect(second.status).toBe(409);
  });

  it('rejects admin endpoints for unauthenticated users', async () => {
    const res = await request(app).post('/api/v1/services').send({
      name: 'No Auth',
      description: 'Should fail',
      durationMinutes: 60,
      priceCents: 10000,
    });

    expect(res.status).toBe(401);
  });
});
