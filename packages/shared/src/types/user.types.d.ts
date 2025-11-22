/**
 * User roles in the system with hierarchical permissions
 * - CLIENT: Basic user with access to their own profile and booking services
 * - ADMIN: Administrative user with access to manage users and content
 * - SUPER_ADMIN: Highest privilege level with full system access
 */
export declare enum UserRole {
    CLIENT = "client",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
/**
 * Complete user entity with all fields
 */
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * User entity without sensitive password field
 * Used for API responses and client-side data
 */
export type UserWithoutPassword = Omit<User, 'password'>;
/**
 * Authenticated user context used in request handling
 */
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
}
/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}
/**
 * Registration data
 */
export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}
/**
 * Authentication response with user and token
 */
export interface AuthResponse {
    user: UserWithoutPassword;
    token: string;
}
/**
 * Role update request (admin/super_admin only)
 */
export interface RoleUpdateRequest {
    role: UserRole;
}
//# sourceMappingURL=user.types.d.ts.map