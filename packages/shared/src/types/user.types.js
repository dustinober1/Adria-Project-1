"use strict";
// User-related types for authentication and authorization
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
/**
 * User roles in the system with hierarchical permissions
 * - CLIENT: Basic user with access to their own profile and booking services
 * - ADMIN: Administrative user with access to manage users and content
 * - SUPER_ADMIN: Highest privilege level with full system access
 */
var UserRole;
(function (UserRole) {
    UserRole["CLIENT"] = "client";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=user.types.js.map