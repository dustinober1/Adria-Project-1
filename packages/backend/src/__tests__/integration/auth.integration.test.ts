import request from 'supertest';

import app from '../../index';
import { generateAccessToken } from '../../utils/auth';
import {
  cleanupTestUsers,
  disconnectPrisma,
  getUserByEmail,
} from '../helpers/dbTestHelper';

// Clean up before all tests
beforeAll(async () => {
  await cleanupTestUsers();
});

// Clean up after each test to ensure isolation
afterEach(async () => {
  await cleanupTestUsers();
});

// Disconnect Prisma after all tests
afterAll(async () => {
  await disconnectPrisma();
});

describe('Auth Integration Tests - Real Database', () => {
  describe('Complete Registration and Login Flow', () => {
    it('registers a new user, logs in, and accesses protected resource', async () => {
      const testUser = {
        email: 'integrationtest@example.com',
        password: 'ValidPass123',
        firstName: 'Integration',
        lastName: 'Test',
        role: 'client',
      };

      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.accessToken).toBeDefined();
      expect(registerResponse.body.refreshToken).toBeDefined();
      expect(registerResponse.body.user).toMatchObject({
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
      });
      expect(registerResponse.body.user.id).toBeDefined();

      const registrationAccessToken = registerResponse.body.accessToken as string;
      const registrationRefreshToken = registerResponse.body
        .refreshToken as string;

      // Verify user exists in database
      const dbUser = await getUserByEmail(testUser.email);
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(testUser.email);
      expect(dbUser?.firstName).toBe(testUser.firstName);
      expect(dbUser?.refreshTokens.length).toBe(1);

      // Step 2: Login with same credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();
      expect(loginResponse.body.user.email).toBe(testUser.email);

      const loginAccessToken = loginResponse.body.accessToken as string;

      // Verify new refresh token was created
      const dbUserAfterLogin = await getUserByEmail(testUser.email);
      expect(dbUserAfterLogin?.refreshTokens.length).toBe(2);

      // Step 3: Access protected resource with registration token
      const meResponse1 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${registrationAccessToken}`);

      expect(meResponse1.status).toBe(200);
      expect(meResponse1.body.success).toBe(true);
      expect(meResponse1.body.user).toMatchObject({
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
      });

      // Step 4: Access protected resource with login token
      const meResponse2 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginAccessToken}`);

      expect(meResponse2.status).toBe(200);
      expect(meResponse2.body.success).toBe(true);
      expect(meResponse2.body.user).toMatchObject({
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });

      // Step 5: Test logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: registrationRefreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Verify refresh token was deleted
      const dbUserAfterLogout = await getUserByEmail(testUser.email);
      expect(dbUserAfterLogout?.refreshTokens.length).toBe(1);
    });

    it('rejects access to protected resource without authentication', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('rejects login with invalid credentials', async () => {
      // First register a user
      await request(app).post('/api/v1/auth/register').send({
        email: 'validuser@example.com',
        password: 'ValidPass123',
        firstName: 'Valid',
        lastName: 'User',
      });

      // Try to login with wrong password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'validuser@example.com',
          password: 'WrongPassword123',
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.message).toContain('Invalid email or password');
    });

    it('rejects login for non-existent user', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'ValidPass123',
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.message).toContain('Invalid email or password');
    });
  });

  describe('Registration Validation', () => {
    it('rejects registration with missing email', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects registration with missing password', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects registration with missing firstName', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'ValidPass123',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects registration with missing lastName', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'ValidPass123',
        firstName: 'Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects registration with invalid email format', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'ValidPass123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('rejects registration with weak password (too short)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Short1',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('rejects registration with password missing uppercase', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'lowercase123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('uppercase letter');
    });

    it('rejects registration with password missing lowercase', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'UPPERCASE123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('lowercase letter');
    });

    it('rejects registration with password missing number', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'NoNumbers',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('number');
    });

    it('rejects duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'ValidPass123',
        firstName: 'First',
        lastName: 'User',
      };

      // First registration
      const firstResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
      expect(firstResponse.status).toBe(201);

      // Second registration with same email
      const secondResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.message).toContain('already exists');
    });

    it('handles case-insensitive email duplicate check', async () => {
      // Register with lowercase
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'case@example.com',
          password: 'ValidPass123',
          firstName: 'Case',
          lastName: 'Test',
        });

      // Try to register with uppercase
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'CASE@example.com',
          password: 'ValidPass123',
          firstName: 'Case',
          lastName: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Role-Based Access Control', () => {
    it('client role can access /me endpoint', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'client@example.com',
          password: 'ValidPass123',
          firstName: 'Client',
          lastName: 'User',
          role: 'client',
        });

      const token = registerResponse.body.accessToken as string;

      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.role).toBe('client');
    });

    it('admin role can access /me endpoint', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'ValidPass123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        });

      const token = registerResponse.body.accessToken as string;

      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.role).toBe('admin');
    });

    it('super_admin role can access /me endpoint', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'superadmin@example.com',
          password: 'ValidPass123',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
        });

      const token = registerResponse.body.accessToken as string;

      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.role).toBe('super_admin');
    });

    it('defaults to client role when no role provided', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'norole@example.com',
          password: 'ValidPass123',
          firstName: 'No',
          lastName: 'Role',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.user.role).toBe('client');
    });

    it('defaults to client role for invalid role', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalidrole@example.com',
          password: 'ValidPass123',
          firstName: 'Invalid',
          lastName: 'Role',
          role: 'hacker',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.user.role).toBe('client');
    });
  });

  describe('Token Refresh Flow', () => {
    it('refreshes access token with valid refresh token', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'ValidPass123',
          firstName: 'Refresh',
          lastName: 'Test',
        });

      const refreshToken = registerResponse.body.refreshToken as string;

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).not.toBe(refreshToken);
    });

    it('rejects refresh with invalid token', async () => {
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.success).toBe(false);
    });

    it('rejects refresh with missing token', async () => {
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(refreshResponse.status).toBe(400);
      expect(refreshResponse.body.success).toBe(false);
    });

    it('rejects refresh after logout', async () => {
      // Register and get tokens
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'loggedout@example.com',
          password: 'ValidPass123',
          firstName: 'Logged',
          lastName: 'Out',
        });

      const refreshToken = registerResponse.body.refreshToken as string;

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      // Try to refresh after logout
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.success).toBe(false);
    });
  });

  describe('Concurrent Requests', () => {
    it('handles multiple concurrent requests with same token', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'concurrent@example.com',
          password: 'ValidPass123',
          firstName: 'Concurrent',
          lastName: 'Test',
        });

      const token = registerResponse.body.accessToken as string;

      // Make 5 concurrent requests
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`)
        );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user).toBeDefined();
      });
    });

    it('handles concurrent login requests for same user', async () => {
      const credentials = {
        email: 'multiplelogins@example.com',
        password: 'ValidPass123',
        firstName: 'Multiple',
        lastName: 'Logins',
      };

      // Register user first
      await request(app).post('/api/v1/auth/register').send(credentials);

      // Make 3 concurrent login requests
      const loginRequests = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: credentials.email,
              password: credentials.password,
            })
        );

      const responses = await Promise.all(loginRequests);

      // All login requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.accessToken).toBeDefined();
      });

      // Verify multiple refresh tokens were created
      const dbUser = await getUserByEmail(credentials.email);
      expect(dbUser?.refreshTokens.length).toBe(4); // 1 from registration + 3 from logins
    });
  });

  describe('Token Validation', () => {
    it('validates token signature and payload', async () => {
      // Register a real user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'tokentest@example.com',
          password: 'ValidPass123',
          firstName: 'Token',
          lastName: 'Test',
        });

      const token = registerResponse.body.accessToken as string;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('tokentest@example.com');
    });

    it('rejects request with malformed Bearer token format', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer');

      expect(response.status).toBe(401);
    });

    it('rejects request with token but no Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'some-token-value');

      expect(response.status).toBe(401);
    });

    it('rejects request with expired/invalid token', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it('rejects request with token signed with wrong secret', async () => {
      // Create token with wrong secret
      const wrongToken = generateAccessToken(
        'test-user-id',
        'test@example.com',
        'client'
      ).substring(0, 100) + 'tampered';

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Edge Cases and Special Characters', () => {
    it('handles registration with extremely long email', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: longEmail,
          password: 'ValidPass123',
          firstName: 'Long',
          lastName: 'Email',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(longEmail);
    });

    it('handles registration with special characters in email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user+test@example.com',
          password: 'ValidPass123',
          firstName: 'Special',
          lastName: 'Char',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('user+test@example.com');
    });

    it('handles registration with unicode characters in password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'unicode@example.com',
          password: 'ValidPass123çãñ',
          firstName: 'Unicode',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);

      // Verify can login with unicode password
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unicode@example.com',
          password: 'ValidPass123çãñ',
        });

      expect(loginResponse.status).toBe(200);
    });

    it('handles unicode characters in names', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'unicodename@example.com',
          password: 'ValidPass123',
          firstName: 'José',
          lastName: 'García',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.firstName).toBe('José');
      expect(response.body.user.lastName).toBe('García');
    });

    it('handles very large request payloads gracefully', async () => {
      const largePayload = {
        email: 'large@example.com',
        password: 'ValidPass123',
        firstName: 'Large',
        lastName: 'Payload',
        extraData: 'x'.repeat(10000),
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(largePayload);

      // Should still succeed (extra data is ignored)
      expect(response.status).toBe(201);
    });

    it('handles whitespace in input fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: '  whitespace@example.com  ',
          password: 'ValidPass123',
          firstName: '  Whitespace  ',
          lastName: '  Test  ',
        });

      expect(response.status).toBe(201);
      // Email should be normalized (trimmed and lowercased)
      expect(response.body.user.email).toBe('whitespace@example.com');
    });
  });

  describe('Security Headers and CORS', () => {
    it('includes security headers in response', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'security@example.com',
        password: 'ValidPass123',
      });

      // Helmet should add security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('allows CORS requests from allowed origins', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: 'cors@example.com',
          password: 'ValidPass123',
          firstName: 'CORS',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Inactive User Handling', () => {
    it('prevents login for inactive users', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'inactive@example.com',
          password: 'ValidPass123',
          firstName: 'Inactive',
          lastName: 'User',
        });

      expect(registerResponse.status).toBe(201);

      // Manually deactivate user in database
      const { prisma } = await import('../helpers/dbTestHelper');
      await prisma.user.update({
        where: { email: 'inactive@example.com' },
        data: { isActive: false },
      });

      // Try to login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'ValidPass123',
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.message).toContain('deactivated');
    });

    it('prevents token refresh for inactive users', async () => {
      // Register user and get refresh token
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refreshinactive@example.com',
          password: 'ValidPass123',
          firstName: 'Refresh',
          lastName: 'Inactive',
        });

      const refreshToken = registerResponse.body.refreshToken as string;

      // Deactivate user
      const { prisma } = await import('../helpers/dbTestHelper');
      await prisma.user.update({
        where: { email: 'refreshinactive@example.com' },
        data: { isActive: false },
      });

      // Try to refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body.success).toBe(false);
      expect(refreshResponse.body.message).toContain('deactivated');
    });
  });

  describe('Logout Functionality', () => {
    it('successfully logs out with valid refresh token', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'ValidPass123',
          firstName: 'Logout',
          lastName: 'Test',
        });

      const refreshToken = registerResponse.body.refreshToken as string;

      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Verify token was deleted
      const dbUser = await getUserByEmail('logout@example.com');
      expect(dbUser?.refreshTokens.length).toBe(0);
    });

    it('handles logout with non-existent refresh token gracefully', async () => {
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'non-existent-token' });

      // Should succeed (idempotent)
      expect(logoutResponse.status).toBe(200);
    });

    it('requires refresh token for logout', async () => {
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(logoutResponse.status).toBe(400);
      expect(logoutResponse.body.success).toBe(false);
    });
  });
});
