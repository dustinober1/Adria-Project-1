// Authentication request and response types

import { UserRole } from './index';

// Login types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// Register types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface RegisterResponse {
  success: boolean;
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// Token types
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// Refresh token types
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

// Logout types
export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// User response (without password field)
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Get current user response
export interface MeResponse {
  success: boolean;
  user: UserResponse;
}

// Error response
export interface AuthErrorResponse {
  success: false;
  error: string;
  message?: string;
}
