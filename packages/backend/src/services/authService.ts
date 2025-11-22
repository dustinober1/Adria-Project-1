export type Role = 'client' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthResult {
  user: AuthUser;
  token: string;
}

export function login(email: string, _password: string): Promise<AuthResult> {
  // Placeholder implementation — replace with real user lookup, password validation, and JWT signing.
  return Promise.resolve({
    user: { id: 'demo-user', email, role: 'client' },
    token: 'mock-jwt-token',
  });
}

export function register(
  email: string,
  _password: string,
  role: Role = 'client'
): Promise<AuthResult> {
  // Placeholder implementation — replace with persistence and password hashing.
  return Promise.resolve({
    user: { id: 'new-user', email, role },
    token: 'mock-jwt-token',
  });
}

export function getProfile(user: AuthUser): Promise<AuthUser> {
  // Placeholder implementation — will be replaced with database lookup.
  return Promise.resolve(user);
}
