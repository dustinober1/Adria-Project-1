# Sprint 4 - Contact & Inquiry System (Planned)

**Sprint Duration:** January 6, 2026 to January 19, 2026 (2 weeks)  
**Sprint Goal:** Build a spam-resistant contact submission flow with admin inquiry management, notifications, and visibility for follow-up.
**Status:** Completed (APIs, frontend, tests, Docker stack with seeded data)

---

## Scope, Capacity, Commitment

- **Stories:** US-4.1 (Contact submission), US-4.2 (Admin inquiry management), US-4.3 (Email transport/templates)  
- **Planned Velocity:** 22 pts (matches Sprint 3)  
- **Allocation (assumed):** Backend 10 pts, Frontend 8 pts, QA/DevOps 4 pts  
- **Definition of Done (global):** Code merged to `main`, tested (unit + integration), Swagger updated, .env examples updated, deployed to staging, docs refreshed, monitoring/rate-limits configured, handoff notes prepared.

### Acceptance Criteria by Story

- **US-4.1 Contact Submission**
  - Public POST endpoint stores inquiry with `status=new`, captures name/email/message/serviceInterest/phone, timestamps.
  - reCAPTCHA v3 verified server-side; failures reject with 400/429.
  - Per-IP rate limit: 3 submissions/hour on contact route.
  - Confirmation email to visitor and notification email to admin fire within 30s.
  - API response returns `id` + status + createdAt; no PII leakage beyond request payload.
  - Tests cover validation, rate limits, recaptcha mock, email enqueue/send.
- **US-4.2 Admin Inquiry Management**
  - Admin-only endpoints: list (paginated + filters), detail, status update.
  - Filters: status, date range, service interest (exact match), search by email/name substring.
  - Sorting: createdAt desc/asc. Pagination default 20, cap 50.
  - Status transitions allowed: new → in_progress → responded → closed (idempotent). Invalid transitions blocked with 409.
  - Responses include total count + paging metadata; RBAC enforced.
  - Tests cover RBAC, filters, sorting, transitions, 404/409.
- **US-4.3 Email Transport/Templates**
  - SendGrid wired with env-driven API key/from/reply-to; graceful failover to log-only mode in non-prod.
  - Templated emails: (1) Visitor confirmation, (2) Admin notification (with deep-link to admin UI).
  - Email helper reusable for future features; retry/backoff for transient SendGrid errors.
  - Tests assert template rendering and SendGrid client invoked with expected payloads (mocked).

---

## Deliverables
- Prisma model + migration for `ContactInquiry`; optional seed data for staging.
- Backend endpoints: `POST /api/v1/contact/submit`, `GET /api/v1/admin/inquiries`, `GET /api/v1/admin/inquiries/:id`, `PUT /api/v1/admin/inquiries/:id/status`.
- Rate limiting + reCAPTCHA verification on contact submission.
- SendGrid integration with two templates + env wiring.
- Frontend contact form (Next.js App Router) with client-side validation, reCAPTCHA, success/error UX.
- Admin UI for inquiries (list + filters + detail + status update).
- Shared types/constants for inquiry status and payloads.
- Updated Swagger, README/ENV docs, and sprint notes; CI secrets documented.

---

## Architecture & Data Plan

- **Prisma Model (`ContactInquiry`):**  
  `id (uuid)`, `fullName`, `email`, `phone (optional)`, `serviceInterest (string)`, `message (text)`, `status (enum: new|in_progress|responded|closed)`, `metadata (JSON for recaptcha score/ip/userAgent)`, `createdAt`, `updatedAt`, `respondedAt (nullable)`, `closedAt (nullable)`, `adminNotes (optional text)`.  
  Indexes: `status`, `createdAt`, composite `(email, createdAt)` for searching; optional FK `serviceId` to `Service` if we want normalized interests.
- **Shared Types:** Add inquiry DTOs and status enum to `packages/shared` for reuse across backend/frontend.
- **Env Variables:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_ADMIN_EMAIL`, `SENDGRID_REPLY_TO` (optional), `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `CONTACT_RATE_LIMIT_MAX=3`, `CONTACT_RATE_LIMIT_WINDOW_MS=3600000`, `EMAIL_ENABLED` toggle for non-prod, `ADMIN_DASHBOARD_URL` for email deep links.
- **Config:** Route-specific rate limiter; recaptcha verification helper that is bypassable in `NODE_ENV=test`.
- **Observability:** Winston info logs for accepted submissions, warn for rejected (spam/429), error for SendGrid failures; metrics counters for submissions accepted/rejected.

---

## Detailed Work Breakdown

### Track 1: Data & Config (Backend + Shared)
- [ ] Update Prisma schema with `ContactInquiry` model, status enum, optional `serviceId` FK, indexes; run `npx prisma migrate dev` and generate client.
- [ ] Add seed script snippet to create 3 sample inquiries (varied statuses) for staging/demo; gated by `NODE_ENV`.
- [ ] Extend `packages/shared` with inquiry types (CreateInquiryRequest, InquiryResponse, InquiryStatus enum) and export barrel.
- [ ] Update `.env.example` (root + packages/backend + packages/frontend) with new vars and inline comments.
- [ ] Document env setup in `docs/operations/ENV_MANAGEMENT.md` and note SendGrid/reCAPTCHA secrets in CI/CD instructions.

### Track 2: Backend - Public Contact Submission (US-4.1)
- [ ] Create `routes/contact.ts`; register under `/api/v1/contact` in `src/index.ts`.
- [ ] Add Zod schema for submission payload (name/email/message required; phone optional with pattern; serviceInterest required with allowlist optional).
- [ ] Implement route-specific rate limiter (3/hour/IP) using `express-rate-limit`; ensure error shape matches existing API error format.
- [ ] Build reCAPTCHA verification helper (POST to Google; check score/action; configurable minimum score 0.5); support skip flag in tests/local.
- [ ] Controller: validate payload, verify recaptcha, persist inquiry (`status=new`, attach metadata ip/userAgent/recaptcha score), enqueue email send, return sanitized response.
- [ ] Service: dedupe guard (e.g., block identical payload within 5 minutes per email) to reduce spam bursts.
- [ ] Error handling: return 400 on validation, 429 on rate-limit or recaptcha spam, 500 on persistence/email failure; ensure no stack traces leak.
- [ ] Swagger: document schema, rate-limit note, recaptcha requirement, sample responses.
- [ ] Tests: unit (validation, recaptcha helper), integration (happy path, invalid payload, spam/429, dedupe, email mock invoked).

### Track 3: Backend - Admin Inquiry Management (US-4.2)
- [ ] Add repository/service functions: list with filters/sorting/pagination, get by id, update status with transition rules and timestamps.
- [ ] Controllers + routes under `/api/v1/admin/inquiries`; apply `authenticateToken`, `ensureAuthenticated`, `requireAdmin`.
- [ ] Filtering: `status` (enum), `dateFrom/dateTo`, `serviceInterest`, `search` (ILIKE on name/email). Sorting allowlist `createdAt` only.
- [ ] Pagination helper reuse from shared; include `total`, `page`, `pageSize`, `pageCount`.
- [ ] Status update endpoint accepts target status; enforces valid transitions; updates `respondedAt/closedAt` when applicable; logs audit entry.
- [ ] Tests: integration with Prisma test DB covering filters, pagination bounds, RBAC (client forbidden), transition errors, 404 on missing id.
- [ ] Swagger: admin endpoints documented with role requirements and filter params.

### Track 4: Backend - Email Transport & Templates (US-4.3)
- [ ] Add SendGrid client wrapper (configurable API key, optional sandbox mode in non-prod).
- [ ] Create two templates (can start as code-level string templates): visitor confirmation and admin notification with summary + link to admin UI; include plain-text fallback.
- [ ] Add retry/backoff (e.g., 2 retries with exponential delay) for SendGrid 5xx/timeouts; surface warning logs if retries exhausted.
- [ ] Provide feature flag `EMAIL_ENABLED=false` for local/test; in that mode, log payload instead of sending.
- [ ] Tests: mock SendGrid, assert payload shapes and retry logic paths.

### Track 5: Frontend - Public Contact Form (US-4.1)
- [ ] Build contact form in `packages/frontend/src/app/contact/page.tsx` (or existing contact route) using React Hook Form + Zod resolver aligned with backend schema.
- [ ] Integrate reCAPTCHA v3 (site key via env); handle token fetch, attach to API call; display friendly error on verification failure.
- [ ] API client uses Axios instance to call backend `/api/v1/contact/submit`; surface validation errors inline; success state with confirmation message and guidance on response times.
- [ ] UX: loading states, disable submit when sending, accessible labels, basic spam notice; mobile-first layout consistent with design system.
- [ ] Tests: component tests for validation states; integration test (mock API) for success/error flows.

### Track 6: Frontend - Admin Inquiry UI (US-4.2)
- [ ] Add protected admin route (e.g., `/admin/inquiries`) reusing existing auth context/guards; redirect unauthenticated users.
- [ ] List page: table with columns (Name, Email, Service, Status, Created), filters (status dropdown, date range, serviceInterest text), search box, pagination controls.
- [ ] Detail drawer/page: show full message, recaptcha score metadata, timestamps; status update dropdown with confirmation; admin notes textarea persisted via status endpoint (optional field).
- [ ] Data fetching via React Query with query keys aligned to filters; caching + optimistic update for status changes.
- [ ] Error handling: display RBAC errors, empty states, retry buttons; log to console for dev.
- [ ] Tests: React Testing Library for list rendering and status update flow (mock API); snapshot for template.

### Track 7: QA, Security, and Hardening
- [ ] Regress authentication/RBAC on admin endpoints (existing auth middleware).
- [ ] Validate rate-limit headers and ensure global limiter not exceeded by new route.
- [ ] Security review: PII logging avoided; reCAPTCHA secrets not exposed; email contents sanitized; phone/email regex to prevent header injection.
- [ ] Performance: confirm queries use indexes; list endpoint paginated; N+1 avoided.
- [ ] Add monitoring hooks (log counts) and 429/400 dashboards (if logging stack available).

### Track 8: Ops, Docs, and Rollout
- [ ] Update `docs/operations/ENV_MANAGEMENT.md`, `packages/backend/README.md`, and Swagger docs with new endpoints and env vars.
- [ ] Configure SendGrid domain + API key + sender identity; store secrets in GitHub Actions/Cloud Build; document in `docs/operations/CICD_SETUP_SUMMARY.md`.
- [ ] Add CI checks for new tests; ensure `npm run test` covers backend + frontend suites.
- [ ] Staging deployment after feature complete; send test submission end-to-end; verify emails arrive and admin UI updates.
- [ ] Prepare release notes and support runbook (how to rotate SendGrid/reCAPTCHA keys, how to unblock rate-limited IP).

---

## Timeline (10 working days)
- **Day 1:** Finalize schema + env list; create migration; add shared types; scaffold contact route + recaptcha helper stub.
- **Day 2:** Implement contact submission controller/service with validation + rate limit; stub SendGrid; add initial tests.
- **Day 3:** Finish reCAPTCHA integration + dedupe guard; integrate SendGrid wrapper; wire confirmation/admin email templates; expand tests.
- **Day 4:** Build admin inquiry service/routes (list/detail/status); add filters/sorting/pagination; write integration tests.
- **Day 5:** Swagger/docs updates for backend; harden error handling; start frontend contact form (UI + validation).
- **Day 6:** Finish frontend contact form + recaptcha; hook to backend; component tests; QA pass on public flow.
- **Day 7:** Build admin UI list/detail/status update with React Query; loading/error/empty states.
- **Day 8:** Admin UI polish, optimistic updates, tests; integrate admin deep-link from email.
- **Day 9:** Security/perf review, regression on auth/rate limits; fix bugs; staging deploy and E2E validation (test submissions).
- **Day 10:** Buffer, documentation wrap, handoff notes, release readiness checklist; code freeze for sprint review.

---

## Risks & Mitigations
- **SendGrid deliverability:** Verify domain + sender early (Day 1-2); use sandbox mode locally; add SPF/DKIM guidance.
- **reCAPTCHA false negatives/positives:** Start with moderate threshold (0.5); log scores; allow manual override during QA; add bypass flag for staging smoke tests.
- **Rate-limit collisions with global limiter:** Isolate limiter for contact route; tune global settings if 429 observed in QA.
- **PII leakage in logs:** Ensure request logging excludes message body/email in info logs; only log metadata.
- **Admin UI auth drift:** Reuse existing auth guard patterns; add integration test to ensure 401/403 on missing tokens.

---

## Dependencies & Prep
- SendGrid API key + verified sender domain; staging/prod secrets set.
- reCAPTCHA v3 site + secret keys; allowed domains configured.
- Admin dashboard base URL to include in notification emails.
- Postgres access for migration; CI secrets for tests (or use sqlite in-memory if already supported).

---

## Out of Scope (explicit)
- Full intake form builder (Sprint 5 scope).
- SMS/WhatsApp notifications.
- Marketing automation flows beyond basic emails.
- Analytics eventing beyond basic logs/counters.
