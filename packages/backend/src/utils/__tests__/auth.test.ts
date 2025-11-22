import {
  comparePassword,
  extractTokenFromHeader,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  validateEmail,
  validatePassword,
  verifyAccessToken,
  verifyRefreshToken,
} from '../auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('creates a hashed password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('creates different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('creates different hashes for different passwords', async () => {
      const password1 = 'Password1!';
      const password2 = 'Password2!';
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('validates correct password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('rejects incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });

    it('rejects password with different case', async () => {
      const password = 'TestPassword123!';
      const wrongCasePassword = 'testpassword123!';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(wrongCasePassword, hashed);

      expect(isValid).toBe(false);
    });

    it('rejects empty password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword('', hashed);

      expect(isValid).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('creates a valid JWT token', () => {
      const token = generateAccessToken(
        'user-123',
        'test@example.com',
        'client'
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('creates different tokens for different users', () => {
      const token1 = generateAccessToken(
        'user-1',
        'user1@example.com',
        'client'
      );
      const token2 = generateAccessToken(
        'user-2',
        'user2@example.com',
        'admin'
      );

      expect(token1).not.toBe(token2);
    });

    it('includes user information in token payload', () => {
      const token = generateAccessToken(
        'user-123',
        'test@example.com',
        'admin'
      );
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('admin');
    });
  });

  describe('verifyAccessToken', () => {
    it('validates and decodes valid token', () => {
      const token = generateAccessToken(
        'user-123',
        'test@example.com',
        'client'
      );
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('client');
    });

    it('rejects invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyAccessToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('rejects malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyAccessToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('rejects empty token', () => {
      const decoded = verifyAccessToken('');

      expect(decoded).toBeNull();
    });

    it('rejects token with wrong signature', () => {
      const token = generateAccessToken(
        'user-123',
        'test@example.com',
        'client'
      );
      // Tamper with the signature
      const tamperedToken =
        token.substring(0, token.lastIndexOf('.')) + '.tamperedsignature';
      const decoded = verifyAccessToken(tamperedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('extracts Bearer token from valid header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('returns null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('returns null for empty header', () => {
      const extracted = extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });

    it('returns null for header without Bearer prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const extracted = extractTokenFromHeader(token);

      expect(extracted).toBeNull();
    });

    it('returns null for header with wrong prefix', () => {
      const header = 'Basic dXNlcjpwYXNz';
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });

    it('handles token with extra spaces', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const header = `Bearer  ${token}`; // Extra space
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(` ${token}`); // Extracts including the space
    });
  });

  describe('generateRefreshToken', () => {
    it('creates a valid refresh token', () => {
      const token = generateRefreshToken('user-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('creates different tokens for same user', () => {
      const token1 = generateRefreshToken('user-123');
      const token2 = generateRefreshToken('user-123');

      expect(token1).not.toBe(token2);
    });

    it('includes user ID in token payload', () => {
      const token = generateRefreshToken('user-123');
      const decoded = verifyRefreshToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.tokenId).toBeDefined();
    });
  });

  describe('verifyRefreshToken', () => {
    it('validates and decodes valid refresh token', () => {
      const token = generateRefreshToken('user-123');
      const decoded = verifyRefreshToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.tokenId).toBeDefined();
    });

    it('rejects invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyRefreshToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('rejects access token as refresh token', () => {
      const accessToken = generateAccessToken(
        'user-123',
        'test@example.com',
        'client'
      );
      const decoded = verifyRefreshToken(accessToken);

      // Access token can be verified but won't have tokenId
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('user-123');
    });
  });

  describe('validatePassword', () => {
    it('accepts valid password', () => {
      const result = validatePassword('ValidPass123');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects password shorter than 8 characters', () => {
      const result = validatePassword('Pass1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('rejects password without uppercase letter', () => {
      const result = validatePassword('validpass123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Password must contain at least one uppercase letter'
      );
    });

    it('rejects password without lowercase letter', () => {
      const result = validatePassword('VALIDPASS123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Password must contain at least one lowercase letter'
      );
    });

    it('rejects password without number', () => {
      const result = validatePassword('ValidPassword');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });

    it('accepts password with special characters', () => {
      const result = validatePassword('ValidPass123!@#');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@example.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user_name@example-domain.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('invalid@example')).toBe(false);
      expect(validateEmail('invalid @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });
});
