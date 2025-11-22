import { UserRole } from './index';
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
export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
    role?: UserRole;
}
export interface RegisterResponse {
    success: boolean;
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
}
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
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    success: boolean;
    accessToken: string;
    refreshToken: string;
}
export interface LogoutRequest {
    refreshToken: string;
}
export interface LogoutResponse {
    success: boolean;
    message: string;
}
export interface UserResponse {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export interface MeResponse {
    success: boolean;
    user: UserResponse;
}
export interface AuthErrorResponse {
    success: false;
    error: string;
    message?: string;
}
//# sourceMappingURL=auth.types.d.ts.map