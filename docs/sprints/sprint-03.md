# Sprint 3 - Services & Content Models (Planned)

**Sprint Duration:** December 21, 2025 to January 5, 2026 (2 weeks)  
**Sprint Goal:** Deliver service and blog/content models with public/admin CRUD, validation, pagination, and tests.

---

## User Stories & Scope
- **US-3.1:** Service model + CRUD endpoints (public read, admin mutate).
- **US-3.2:** Blog/content models with validation and status handling.
- **US-3.3:** Public content listing/detail with pagination, sorting, and guards.

---

## Work Breakdown

### 1) Data Modeling & Migrations
- [x] Add Prisma models:
  - `Service`: id, name, slug, description, durationMinutes, priceCents, active, createdAt/updatedAt.
  - `BlogPost`: id, title, slug, excerpt, content, authorId (FK users), status enum (draft|published|archived), publishedAt, createdAt/updatedAt.
- [x] Indexes: unique slug, status, active.
- [x] Create migration and apply to dev DB.
- [x] Seed sample services/posts for local QA.
- [x] Update shared types (already covered).

### 2) Service API (US-3.1)
- [x] Routes:
  - GET `/api/v1/services` (public; active only; pagination/sort).
  - GET `/api/v1/services/:id` and `/slug/:slug` (public).
  - POST/PUT/DELETE `/api/v1/services` (admin/super_admin).
- [x] Controllers:
  - Zod validation, slug generation, 404/409 handling.
  - Hard delete implemented.
- [x] RBAC: admin-only mutations; public reads open.
- [x] Swagger: schemas for Service added.

### 3) Blog/Content API (US-3.2, US-3.3)
- [x] Routes:
  - GET `/api/v1/posts` (public published only; pagination/sort).
  - GET `/api/v1/posts/:slug` (public published only).
  - GET `/api/v1/posts/admin/list` (admin/super_admin, all statuses).
  - POST/PUT/DELETE `/api/v1/posts` (admin/super_admin).
  - PATCH `/api/v1/posts/:id/status` (admin/super_admin).
- [x] Controllers:
  - Zod validation, slug handling, publishedAt set on publish.
  - Status transitions handled with 409/404 guards.
- [x] RBAC: admin/super_admin for write; public read only published.
- [x] Swagger: schemas for BlogPost added.

### 4) Shared & Utilities
- [x] Pagination helper (page/limit bounds, sort allowlist).
- [x] Shared slugify reused; status/pagination handled in controllers.
- [x] ENV unchanged for this sprint.

### 5) Testing Plan
- [x] Unit: existing utilities; new pagination exercised indirectly.
- [x] Integration (Prisma-backed, Jest maxWorkers=1):
  - Services: admin create/update/delete; public list/slug; 404/409 cases.
  - Posts: admin create/update/delete/status change; public list only `published`; detail by slug; drafts 404; publish sets `publishedAt`.
  - Pagination/sorting: defaults validated via list tests.
  - RBAC: client blocked on admin endpoints; super_admin/admin allowed as appropriate.
- [x] Test DB hygiene: cleanup helper extended; manual truncate before run.

### 6) Docs & Ops
- [x] Updated sprint docs (this file).
- [x] Updated CLAUDE.md / Agents.md with Sprint 3 completion.
- [x] Backend README: new endpoints added.
- [x] Seed script expanded with services/posts.

---

## Risks & Mitigations
- **DB contention in tests**: Jest `maxWorkers=1`; truncate tables per suite; cleanup helper extended.
- **Slug collisions**: unique indexes + 409 handling.
- **Published content leakage**: public queries filtered to `status=published`; draft access returns 404.
- **Pagination abuse**: capped limit (50) and sort allowlist.

---

## Dependencies
- Running Postgres with `DATABASE_URL` set.
- Existing auth/RBAC middleware from Sprint 2.
- Prisma client regenerated after schema changes.
