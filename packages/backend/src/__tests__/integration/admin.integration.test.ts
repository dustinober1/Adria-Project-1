import request from 'supertest';

import app from '../../index';
import {
  cleanupTestUsers,
  disconnectPrisma,
  getUserByEmail,
} from '../helpers/dbTestHelper';

const createUserViaRegister = async (role: 'client' | 'admin' | 'super_admin') => {
  const email = `${role}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.com`;

  const response = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'ValidPass123',
    firstName: role,
    lastName: 'User',
    role,
  });

  return {
    email,
    id: response.body.user.id as string,
    accessToken: response.body.accessToken as string,
  };
};

describe('Admin endpoints', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('lists users and gets user by id for super admin', async () => {
    const superAdmin = await createUserViaRegister('super_admin');
    const client = await createUserViaRegister('client');

    const listResponse = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${superAdmin.accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(
      listResponse.body.data.some((u: { email: string }) => u.email === client.email)
    ).toBe(true);

    const getResponse = await request(app)
      .get(`/api/v1/admin/users/${client.id}`)
      .set('Authorization', `Bearer ${superAdmin.accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.email).toBe(client.email);
  });

  it('prevents admin from changing roles and allows super admin to change roles', async () => {
    const superAdmin = await createUserViaRegister('super_admin');
    const admin = await createUserViaRegister('admin');
    const client = await createUserViaRegister('client');

    const forbiddenResponse = await request(app)
      .post(`/api/v1/admin/users/${client.id}/role`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ role: 'admin' });

    expect(forbiddenResponse.status).toBe(403);

    const roleUpdateResponse = await request(app)
      .post(`/api/v1/admin/users/${client.id}/role`)
      .set('Authorization', `Bearer ${superAdmin.accessToken}`)
      .send({ role: 'admin' });

    expect(roleUpdateResponse.status).toBe(200);
    expect(roleUpdateResponse.body.data.role).toBe('admin');
  });

  it('allows super admin to delete users but not themselves', async () => {
    const superAdmin = await createUserViaRegister('super_admin');
    const client = await createUserViaRegister('client');

    const selfDelete = await request(app)
      .delete(`/api/v1/admin/users/${superAdmin.id}`)
      .set('Authorization', `Bearer ${superAdmin.accessToken}`);

    expect(selfDelete.status).toBe(400);

    const deleteResponse = await request(app)
      .delete(`/api/v1/admin/users/${client.id}`)
      .set('Authorization', `Bearer ${superAdmin.accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const dbUser = await getUserByEmail(client.email);
    expect(dbUser).toBeNull();
  });

  it('requires authentication on admin endpoints', async () => {
    const response = await request(app).get('/api/v1/admin/users');
    expect(response.status).toBe(401);
  });
});
