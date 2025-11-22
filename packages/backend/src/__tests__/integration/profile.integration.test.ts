import request from 'supertest';

import app from '../../index';
import {
  cleanupTestUsers,
  disconnectPrisma,
} from '../helpers/dbTestHelper';

const registerUser = async () => {
  const email = `profile-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.com`;

  const response = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'ValidPass123',
    firstName: 'Profile',
    lastName: 'User',
  });

  return {
    email,
    accessToken: response.body.accessToken as string,
  };
};

describe('Profile endpoints', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('returns current profile data', async () => {
    const user = await registerUser();

    const response = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(user.email);
  });

  it('updates profile firstName, lastName, and email', async () => {
    const user = await registerUser();

    const updateResponse = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'Name',
        email: `updated-${user.email}`,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.firstName).toBe('Updated');
    expect(updateResponse.body.data.lastName).toBe('Name');
    expect(updateResponse.body.data.email).toBe(`updated-${user.email}`);
  });

  it('rejects profile update when email already exists', async () => {
    const user1 = await registerUser();
    const user2 = await registerUser();

    const conflictResponse = await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send({ email: user2.email });

    expect(conflictResponse.status).toBe(409);
  });

  it('changes password and allows login with new password', async () => {
    const user = await registerUser();

    const changeResponse = await request(app)
      .put('/api/v1/profile/password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({
        currentPassword: 'ValidPass123',
        newPassword: 'NewPass456',
      });

    expect(changeResponse.status).toBe(200);

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: user.email,
      password: 'NewPass456',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeDefined();
  });

  it('requires authentication for profile routes', async () => {
    const response = await request(app).get('/api/v1/profile');
    expect(response.status).toBe(401);
  });
});
