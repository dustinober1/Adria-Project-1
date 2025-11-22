import type { AuthUser, Role } from '../../services/authService';
import { generateAccessToken, hashPassword } from '../../utils/auth';

// In-memory test database
const testUsers: Map<string, AuthUser & { password: string }> = new Map();
let userIdCounter = 1;

/**
 * Create a test user with the given role
 */
export async function createTestUser(
  role: Role = 'client',
  email?: string,
  password?: string
): Promise<AuthUser & { password: string }> {
  const userId = `test-user-${userIdCounter++}`;
  const userEmail = email || `${userId}@test.com`;
  const userPassword = password || 'TestPassword123!';
  const hashedPassword = await hashPassword(userPassword);

  const user = {
    id: userId,
    email: userEmail,
    role,
    password: hashedPassword,
  };

  testUsers.set(userId, user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    password: userPassword, // Return plain password for testing
  };
}

/**
 * Get authentication token for a user
 */
export function getAuthToken(user: AuthUser): string {
  return generateAccessToken(user.id, user.email, user.role);
}

/**
 * Clear test database
 */
export async function clearTestDatabase(): Promise<void> {
  testUsers.clear();
  userIdCounter = 1;
}

/**
 * Get all test users
 */
export function getAllTestUsers(): (AuthUser & { password: string })[] {
  return Array.from(testUsers.values());
}

/**
 * Find test user by email
 */
export function findTestUserByEmail(
  email: string
): (AuthUser & { password: string }) | undefined {
  return Array.from(testUsers.values()).find((u) => u.email === email);
}

/**
 * Find test user by id
 */
export function findTestUserById(
  id: string
): (AuthUser & { password: string }) | undefined {
  return testUsers.get(id);
}
