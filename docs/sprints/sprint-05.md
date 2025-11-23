# Sprint 5 - Intake Form System (Planned)

**Sprint Duration:** January 20, 2026 to February 2, 2026 (2 weeks)  
**Sprint Goal:** Deliver a flexible intake form system to replace Google Forms, including form templates, submissions, validation, notifications, and admin management.  
**Status:** Planned

---

## Scope, Capacity, Commitment
- **Stories:** US-5.1 (Form builder/templates), US-5.2 (Form submissions + notifications)  
- **Planned Velocity:** 22 pts (consistent with previous sprints)  
- **Allocation (assumed):** Backend 10 pts, Frontend 8 pts, QA/DevOps 4 pts  
- **Definition of Done (global):** Code merged to `main`, tested (unit/integration/E2E where applicable), Swagger updated, .env templates updated, deployed to staging with demo data, docs refreshed, feature flagging and secrets managed, roll-back path documented.

### Acceptance Criteria by Story
- **US-5.1 Form Builder / Templates**
  - Prisma models for FormTemplate and FormField definitions, supporting text/textarea/select/radio/checkbox/file (file optional to defer).
  - Admin CRUD endpoints for templates (create/read/update/delete) with validation of field schemas and activation status.
  - Templates versioned or guarded so updates don’t break existing submissions.
  - Shared types for templates/fields exported for frontend consumption.
  - Tests cover schema validation and CRUD (RBAC enforced).
- **US-5.2 Form Submission**
  - Public/guest submission endpoint for a template ID; validates against field rules (required, min/max, regex).
  - Submission persisted with timestamp and raw responses; userId attached if authenticated.
  - Confirmation email to submitter and admin notification (SendGrid) with template name and link to admin detail.
  - Rate limiting and optional reCAPTCHA protection reused from Sprint 4 helpers.
  - Admin listing endpoint for submissions with filters (template, date range, email) and pagination.
  - Tests cover validation, RBAC on admin endpoints, email mocks, and anti-spam guards.

---

## Deliverables
- Prisma models/migration for `FormTemplate`, `FormField` (or JSON), and `FormSubmission`.
- Admin APIs for templates: CRUD + activate/deactivate.
- Public submission API for a template with validation.
- Admin APIs for submissions: list/detail with filters/pagination.
- SendGrid email templates for submission confirmation and admin alert.
- Frontend admin UI to manage templates and view submissions.
- Frontend public form rendering driven by template schema + client validation.
- Updated Swagger, env templates, docs, and seeds for demo templates/submissions.

---

## Architecture & Data Plan
- **Models (Prisma):**
  - `FormTemplate`: id (uuid), name, description, serviceId (nullable FK), fields (JSON), active (bool), createdAt/updatedAt.
  - `FormSubmission`: id (uuid), formTemplateId (FK), userId (nullable FK), email (for guests), responses (JSON), createdAt, metadata (IP, userAgent, recaptchaScore).
  - Optional `FormField` table if not storing JSON; start with JSON for speed and index by template if needed.
  - Indexes: `formTemplateId`, `createdAt`, `(email, createdAt)` on submissions; `active` on templates.
- **Field Schema (JSON):**
  - Fields: id, label, type (text|textarea|select|radio|checkbox|file), options (for select/radio/checkbox), validation (required, minLength, maxLength, pattern).
  - Versioning: store `version` on template; submissions store `templateVersion`.
- **Env Vars:** reuse SendGrid + recaptcha; add `FORMS_RATE_LIMIT_MAX`, `FORMS_RATE_LIMIT_WINDOW_MS` if different from contact.
- **Security/Spam:** reuse recaptcha helper and rate limiter; sanitize file uploads if enabled (or defer).
- **Observability:** log submissions (without PII content), counts per template.

---

## Detailed Work Breakdown

### Track 1: Data & Shared Types
- [ ] Add Prisma models/migration for templates/submissions (JSON fields); generate client.
- [ ] Seed 2 demo templates (e.g., “Virtual Styling Intake”, “Event Styling Intake”) with varied fields.
- [ ] Extend `@adria/shared` types for FormTemplate, FormField, FormSubmission DTOs and enums.
- [ ] Update `.env.example` files with any new rate-limit/env toggles for forms.

### Track 2: Backend - Template Management (US-5.1)
- [ ] Admin routes for templates: list, get, create, update, delete (or deactivate), using RBAC.
- [ ] Validation layer for fields schema (Zod) including option lists and regex/min/max.
- [ ] Guard updates when template has submissions: allow additive/compatible changes; block destructive edits or require new version (simplify: disallow field removals if submissions exist).
- [ ] Swagger docs for template endpoints and schemas.
- [ ] Tests: integration for CRUD, validation errors, RBAC, and version guard behavior.

### Track 3: Backend - Form Submission (US-5.2)
- [ ] Public POST `/api/v1/forms/:id/submit` with rate limit (reuse contact limiter or dedicated).
- [ ] Validate request against template field rules; attach userId if authenticated or guest email required.
- [ ] Persist submission with metadata (ip, userAgent, recaptcha score/action).
- [ ] Send confirmation + admin notification emails; log-only mode when EMAIL_ENABLED=false.
- [ ] Admin endpoints: list submissions with filters (templateId, date range, email), pagination; get submission detail.
- [ ] Swagger docs for submission endpoints; tests for happy/invalid paths, RBAC, spam guard.

### Track 4: Frontend - Admin Templates UI
- [ ] Build `/admin/forms` pages: list templates, create/edit form builder (JSON-driven; simple field editor).
- [ ] Support activate/deactivate and view existing submissions count.
- [ ] Client validation aligned with backend schema; React Query for data fetching/mutations.
- [ ] Tests: render list, create/edit flow with mocked API.

### Track 5: Frontend - Public Form Rendering
- [ ] Dynamic form page driven by template JSON (App Router); render field types with RHF + Zod.
- [ ] Apply client-side validation rules; integrate recaptcha token; show success/error states.
- [ ] API integration to submission endpoint; loading/disabled states; accessibility for inputs/errors.
- [ ] Tests: component validation states; mocked submit success/error.

### Track 6: QA, Security, Ops
- [ ] Reuse recaptcha + rate limit configs; add form-specific env defaults.
- [ ] Ensure no PII in logs; trim/sanitize responses; cap payload sizes.
- [ ] Run full test suite; add E2E smoke for one template submit path (optional).
- [ ] Update docs: ENV vars, backend README endpoints, sprint doc, CLAUDE/Agents if status changes.
- [ ] Staging deploy and manual submission test; verify emails and admin UI reflect submissions.

---

## Timeline (10 working days)
- **Day 1:** Finalize schema/types; create migration; seed templates; update env examples.
- **Day 2:** Implement template CRUD + validation + tests; Swagger for templates.
- **Day 3:** Implement submission endpoint with validation/rate-limit/recaptcha; tests; email hooks stubbed.
- **Day 4:** Admin submissions list/detail + filters/pagination; tests; email notifications wired.
- **Day 5:** Swagger/docs refresh; harden validation/version guards; start frontend admin templates UI.
- **Day 6:** Finish admin templates UI; hook mutations; tests.
- **Day 7:** Build public dynamic form rendering + client validation + recaptcha; tests.
- **Day 8:** Polish UX, error states, optimistic updates; add submission admin detail view.
- **Day 9:** QA/security review; regression of auth/RBAC; staging deploy and E2E manual run.
- **Day 10:** Buffer, docs wrap, release notes, rollback plan confirmation.

---

## Risks & Mitigations
- **Template changes vs existing submissions:** enforce non-breaking updates or require new version; block field removals if submissions exist.
- **Spam/abuse:** reuse recaptcha + rate limiter; reject oversized payloads.
- **File uploads (if added):** defer or restrict to avoid scope creep; otherwise require size/type validation.
- **Email deliverability:** use SendGrid sandbox locally; confirm sender identity early.
- **Frontend schema drift:** share types from `@adria/shared`; centralize validation logic.

---

## Dependencies & Prep
- SendGrid and reCAPTCHA keys already wired from Sprint 4.
- Admin auth in place; reuse JWT/RBAC.
- Ensure staging secrets for any new rate limit envs; update CI/CD secret mapping if added.

---

## Out of Scope
- Complex conditional logic between fields.
- Full file upload pipeline (can be flagged or MVP-disabled).
- Analytics/UTM tracking for submissions (future).
