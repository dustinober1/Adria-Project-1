# Sprint 2 - Core Backend & Authentication

**Sprint Duration:** December 7, 2025 to December 20, 2025 (2 weeks)  
**Sprint Goal:** Build backend API foundation with authentication and RBAC  
**Phase:** Phase 1 (Backend Foundation)

---

## User Stories & Status

### US-2.1: REST API framework setup
- [x] Express server hardened with helmet, CORS, rate limiting, and Winston + Morgan logging
- [x] API versioning at `/api/v1` with Swagger docs exposed at `/api/v1/docs`
- [x] Global error/not-found handlers and structured logging

### US-2.2: User authentication (JWT + refresh tokens)
- [x] Prisma-backed register/login/logout/refresh/me endpoints
- [x] Password hashing via bcrypt with configurable rounds; email + password validation
- [x] Refresh token persistence with rotation and revocation
- [x] Shared types updated to include first/last name

### US-2.3: Role-based access control
- [x] Hierarchical role guard (client, admin, super_admin)
- [x] Admin endpoints: list/get/change role/delete users (JWT-protected)
- [x] Profile endpoints: get/update profile, change password (JWT-protected)
- [x] Seed defaults documented; tests cover admin/profile flows

---

## Definition of Done Checklist
- [x] Code complete and TypeScript strict
- [x] Unit/integration tests added for auth, admin, and profile flows
- [x] Swagger docs updated for auth payloads and role changes
- [x] Environment templates and docs refreshed (rate limiting, bcrypt rounds, logging)
- [x] Agents.md / CLAUDE.md updated with Sprint 2 completion

---

## Sprint Metrics
- **Planned Story Points:** 20
- **Completed Story Points:** 20
- **Stories Completed:** 3 / 3
- **Bugs Found:** 0 (manual validation only; automated tests pending DB setup)

---

## Notes & Risks
- Local testing requires a running PostgreSQL instance and `DATABASE_URL` configured; Docker not available in current environment.
- Admin/profile routes now require real JWT tokens (mock auth removed from routes).
- Next Sprint (3): service/content models, CRUD endpoints, pagination, and validation.
