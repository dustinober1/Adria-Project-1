import request from 'supertest';

import app from '../../index';
import { generateAccessToken } from '../../utils/auth';
import {
  cleanupTestUsers,
  disconnectPrisma,
} from '../../__tests__/helpers/dbTestHelper';

// Test helper to generate unique emails for registration tests
function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

async function registerTestUser(options?: {
  role?: 'client' | 'admin' | 'super_admin';
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}) {
  const email = options?.email ?? generateTestEmail();
  const password = options?.password ?? 'ValidPass123';
  const firstName = options?.firstName ?? 'Test';
  const lastName = options?.lastName ?? 'User';
  const role = options?.role ?? 'client';

  const response = await request(app).post('/api/v1/auth/register').send({
    email,
    password,
    firstName,
    lastName,
    role,
  });

  return {
    email,
    password,
    accessToken: response.body.accessToken as string,
    refreshToken: response.body.refreshToken as string,
    id: response.body.user.id as string,
  };
}

describe('Auth Routes', () => {
  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await disconnectPrisma();
  });

  describe('POST /api/v1/auth/register', () => {
    it('creates new user successfully with valid credentials', async () => {
      const email = generateTestEmail();
      const response = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
      });

      const body = response.body as {
        success: boolean;
        user?: { id: string; email: string; role: string };
        accessToken?: string;
        refreshToken?: string;
      };

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user?.email).toBe(email);
      expect(body.user?.role).toBe('client');
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it('defaults to client role when role not specified', async () => {
      const email = generateTestEmail();
      const response = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      const body = response.body as {
        user?: { role: string };
      };

      expect(response.status).toBe(201);
      expect(body.user?.role).toBe('client');
    });

    it('allows admin role registration', async () => {
      const email = generateTestEmail();
      const response = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });

      const body = response.body as {
        user?: { role: string };
      };

      expect(response.status).toBe(201);
      expect(body.user?.role).toBe('admin');
    });

    it('allows super_admin role registration', async () => {
      const email = generateTestEmail();
      const response = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
      });

      const body = response.body as {
        user?: { role: string };
      };

      expect(response.status).toBe(201);
      expect(body.user?.role).toBe('super_admin');
    });

    it('defaults to client for invalid role', async () => {
      const email = generateTestEmail();
      const response = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'invalid_role',
      });

      const body = response.body as {
        user?: { role: string };
      };

      expect(response.status).toBe(201);
      expect(body.user?.role).toBe('client');
    });

    it('returns 400 when email is missing', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when password is missing', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when firstName is missing', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 'ValidPass123',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'First name and last name are required'
      );
    });

    it('returns 400 when lastName is missing', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 'ValidPass123',
        firstName: 'Test',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'First name and last name are required'
      );
    });

    it('returns 400 when email is not a string', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 123,
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when password is not a string', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 123,
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when both email and password are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ firstName: 'Test', lastName: 'User' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 for invalid email format', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });

    it('returns 400 for weak password (too short)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 'Short1',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('returns 400 for weak password (no uppercase)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 'nouppercase123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('uppercase letter');
    });

    it('returns 400 for weak password (no lowercase)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 'NOLOWERCASE123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('lowercase letter');
    });

    it('returns 400 for weak password (no number)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: generateTestEmail(),
        password: 'NoNumbersHere',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('number');
    });

    it('returns 400 when user already exists', async () => {
      const email = generateTestEmail();

      // Register first time
      await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      // Try to register again with same email
      const response = await request(app).post('/api/v1/auth/register').send({
        email,
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'User with this email already exists'
      );
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials and returns tokens', async () => {
      const registeredUser = await registerTestUser({
        email: generateTestEmail(),
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Client',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: registeredUser.email,
        password: 'Test123!',
      });

      const body = response.body as {
        success: boolean;
        user?: {
          email: string;
          role: string;
          firstName: string;
          lastName: string;
        };
        accessToken?: string;
        refreshToken?: string;
      };

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user?.email).toBe(registeredUser.email);
      expect(body.user?.firstName).toBe('Test');
      expect(body.user?.lastName).toBe('Client');
      expect(body.user?.role).toBe('client');
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it('logs in super admin with valid credentials', async () => {
      const superAdmin = await registerTestUser({
        role: 'super_admin',
        password: 'Admin123!',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: superAdmin.email,
        password: 'Admin123!',
      });

      const body = response.body as {
        user?: { email: string; role: string };
      };

      expect(response.status).toBe(200);
      expect(body.user?.email).toBe(superAdmin.email);
      expect(body.user?.role).toBe('super_admin');
    });

    it('logs in regular admin with valid credentials', async () => {
      const admin = await registerTestUser({
        role: 'admin',
        password: 'Admin123!',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: admin.email,
        password: 'Admin123!',
      });

      const body = response.body as {
        user?: { email: string; role: string };
      };

      expect(response.status).toBe(200);
      expect(body.user?.email).toBe(admin.email);
      expect(body.user?.role).toBe('admin');
    });

    it('returns 401 for invalid credentials', async () => {
      const user = await registerTestUser();

      const response = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid email or password'
      );
    });

    it('returns 401 for non-existent user', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid email or password'
      );
    });

    it('returns 400 when email is missing', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        password: 'Test123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when password is missing', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'client@test.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when both credentials are missing', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when email is not a string', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 123,
        password: 'Test123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 400 when password is not a string', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'client@test.com',
        password: 123,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Email and password are required'
      );
    });

    it('returns 401 for invalid email format', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'not-an-email',
        password: 'Test123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid email format');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns user info for authenticated client', async () => {
      const user = await registerTestUser({
        firstName: 'Test',
        lastName: 'Client',
      });

      // Use the token to get profile
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user.accessToken}`);

      const body = response.body as {
        success: boolean;
        user?: { id: string; email: string; role: string };
      };

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user?.email).toBe(user.email);
      expect(body.user?.role).toBe('client');
    });

    it('returns user info for authenticated admin', async () => {
      const admin = await registerTestUser({
        role: 'admin',
        password: 'Admin123!',
      });

      // Get profile
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      const body = response.body as {
        user?: { email: string; role: string };
      };

      expect(response.status).toBe(200);
      expect(body.user?.email).toBe(admin.email);
      expect(body.user?.role).toBe('admin');
    });

    it('returns user info for authenticated super admin', async () => {
      const superAdmin = await registerTestUser({
        role: 'super_admin',
        password: 'Admin123!',
      });

      // Get profile
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`);

      const body = response.body as {
        user?: { email: string; role: string };
      };

      expect(response.status).toBe(200);
      expect(body.user?.email).toBe(superAdmin.email);
      expect(body.user?.role).toBe('super_admin');
    });

    it('returns 401 for unauthenticated request (no header)', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('returns 401 for empty authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', '');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('returns 401 for invalid authorization format', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('returns 401 for Basic auth instead of Bearer', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('returns 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('returns 500 for token with non-existent user', async () => {
      // Generate a token for a user ID that doesn't exist in the database
      const tokenWithInvalidUser = generateAccessToken(
        'non-existent-user-id',
        'nonexistent@example.com',
        'client'
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenWithInvalidUser}`);

      // The token is valid JWT but the user doesn't exist in DB
      // This should return 500 as the getProfile function will fail to find the user
      expect(response.status).toBe(500);
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows client role to access /me endpoint', async () => {
      const client = await registerTestUser();

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${client.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user?.role).toBe('client');
    });

    it('allows admin role to access /me endpoint', async () => {
      const admin = await registerTestUser({ role: 'admin' });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${admin.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user?.role).toBe('admin');
    });

    it('allows super_admin role to access /me endpoint', async () => {
      const superAdmin = await registerTestUser({ role: 'super_admin' });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user?.role).toBe('super_admin');
    });
  });

  describe('Error Handling', () => {
    it('handles malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('handles empty request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('');

      expect(response.status).toBe(400);
    });
  });
});
