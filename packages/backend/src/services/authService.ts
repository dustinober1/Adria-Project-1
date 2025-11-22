import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  validateEmail,
  validatePassword,
  verifyRefreshToken,
} from '../utils/auth';

import prisma from '../lib/prisma';

export type Role = 'client' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

/**
 * Register a new user
 * @param data - User registration data
 * @returns Auth result with user and tokens
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  const {
    email,
    password,
    firstName,
    lastName,
    role = 'client',
  } = normalizeRegisterData(data);

  // Validate email format
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.error || 'Invalid password');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role.toUpperCase() as 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN',
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.role.toLowerCase()
  );
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase() as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Login a user
 * @param email - User email
 * @param password - User password
 * @returns Auth result with user and tokens
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Validate email format
  if (!validateEmail(normalizedEmail)) {
    throw new Error('Invalid email format');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.role.toLowerCase()
  );
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase() as Role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Get user profile by authenticated user
 * @param authUser - Authenticated user context
 * @returns User profile
 */
export async function getProfile(authUser: AuthUser) {
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.toLowerCase() as Role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token
 * @returns New access and refresh tokens
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error('Invalid or expired refresh token');
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new Error('Refresh token not found');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new Error('Refresh token expired');
  }

  // Check if user is active
  if (!storedToken.user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Generate new tokens
  const accessToken = generateAccessToken(
    storedToken.user.id,
    storedToken.user.email,
    storedToken.user.role.toLowerCase()
  );
  const newRefreshToken = generateRefreshToken(storedToken.user.id);

  // Delete old refresh token and create new one
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout a user by invalidating refresh token
 * @param refreshToken - Refresh token to invalidate
 */
export async function logout(refreshToken: string): Promise<void> {
  // Delete refresh token from database
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

/**
 * Logout all sessions for a user
 * @param userId - User ID
 */
export async function logoutAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

function normalizeRegisterData(data: RegisterData): RegisterData {
  return {
    ...data,
    email: data.email.trim().toLowerCase(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
  };
}
