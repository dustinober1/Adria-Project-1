# Sprint 7 - Booking & Calendar Sync (Completed)

**Sprint Duration:** February 17, 2026 to March 2, 2026 (2 weeks)  
**Sprint Goal:** Enable clients to request/book sessions with availability windows, admin approvals, and calendar-friendly notifications.  
**Status:** Completed (booking models/APIs/UI + calendar/ICS + notifications)

---

## Completion Summary
- Added Prisma models/migration for `Availability` and `Booking` (with overlap guard) plus seeds for demo windows and sample bookings.
- Delivered booking APIs: public request endpoint with validation/rate-limit/recaptcha, admin approve/decline/reschedule/cancel with status machine and double-booking guard.
- Implemented calendar service abstraction (Google Calendar sync behind flag) and ICS generator; responses return ICS download URLs and sync status when enabled.
- Built frontend client booking form (RHF + Zod) tied to services and recaptcha, plus admin bookings dashboard with filters, detail view, and status actions.
- Wired notifications for request/approval/reschedule/cancel (visitor + admin) with ICS helper; Jest integration/unit coverage for overlap checks, ICS payloads, calendar mock, and status transitions; staging smoke run with flag on/off.

---

## Scope, Capacity, Commitment
- **Stories:** US-7.1 (availability model + calendar wiring), US-7.2 (booking request/confirm APIs), US-7.3 (admin booking dashboard + client UI), US-7.4 (reminders/ICS + notifications)  
- **Planned Velocity:** 22 pts (met)  
- **Allocation:** Backend 10 pts, Frontend 8 pts, QA/DevOps 4 pts  
- **Definition of Done:** Code merged to `main`, migrations applied, tests (unit/integration/E2E smoke) passing, Swagger/env docs updated, staging verified with sample bookings, rollback steps documented.

### Acceptance Criteria by Story
- **US-7.1 Availability & Calendar Wiring (Done)**
  - Prisma models: Availability (recurring/one-off), Booking, optional TimeSlot; constraints to prevent overlaps.
  - Calendar service abstraction (Google Calendar mock in dev/test) with feature flag for sync.
  - Seeds for demo availability windows and sample bookings.
- **US-7.2 Booking API (Done)**
  - Public booking request endpoint with validation (date/time, serviceId, contact info), rate limit, recaptcha.
  - Admin endpoints to approve/decline/reschedule/cancel; status transitions enforced; transactional double-booking guard.
  - Responses include ICS download URL (flagged) and calendar sync status where enabled.
- **US-7.3 Frontend UI (Done)**
  - Client booking request form (RHF + Zod) with service selection and preferred times.
  - Admin bookings dashboard with filters (date range, status, service), detail view, and status actions.
  - Loading/error/empty states; success messaging; accessibility on inputs/errors.
- **US-7.4 Notifications/Reminders (Done)**
  - Email notifications (visitor + admin) for request/approval/reschedule/cancel with ICS attachment helper.
  - Optional reminder emails (flagged) X hours before event.
  - Tests for ICS generation, email payloads, and status transitions.

---

## Deliverables
- Prisma migration for `Availability` and `Booking` with overlap constraints and seeds for demo schedules + sample bookings.
- Booking APIs (public request + admin manage) with validation, rate limiting, recaptcha, status machine, and transactional double-booking guard; responses include ICS download + calendar sync status when enabled.
- Calendar service abstraction with Google Calendar integration behind `CALENDAR_SYNC_ENABLED`, plus ICS helper shared by notifications.
- Frontend booking request form and admin bookings UI (filters/actions/detail/status updates) with status pills and accessibility/error states.
- Notification/reminder emails with ICS; Swagger/env templates updated (calendar flags, reminder timing); tests across layers (overlap guard, status transitions, calendar mock, ICS snapshots).

## Testing & Verification
- Backend: integration tests for request/approve/decline/reschedule/cancel flows, overlap/double-booking checks, calendar mock sync paths, and ICS generator; migration applied in CI with seeds.
- Frontend: booking form and admin dashboard exercised with mocked API for success/error/loading/empty states; status badges verified.
- Operations: staging smoke with calendar sync flag off/on, rollback notes captured; Swagger endpoints validated against deployed build.

---

## Architecture & Data Plan
- Models: `Availability` (serviceId?, date range, recurring pattern, timezone), `Booking` (status, serviceId, contact info, scheduledAt, duration, calendarEventId?, metadata).
- DB constraints: unique index on (scheduledAt, serviceId) with buffer; transactional checks for overlap.
- Calendar abstraction similar to email adapter; toggle via `CALENDAR_SYNC_ENABLED`.
- ICS helper for outbound emails; stored inline (no persistence needed).

---

## Work Breakdown
- **Backend**
  - Added Prisma models/migration; seeds.
  - Booking controllers/routes (public + admin) with status machine, validation, recaptcha/rate-limit, double-booking guard.
  - Calendar sync service (mock in dev/test); ICS generator; notification hooks.
  - Swagger updates; env templates (sync toggle, reminder timing).
  - Tests: integration for booking flows, overlap guard, calendar mock; unit for ICS.
- **Frontend**
  - Client booking form page; ties to services; handles recaptcha + submission state.
  - Admin bookings dashboard (list/detail/actions) with React Query + filters.
  - UX polish: status pills, time formatting, success/error handling.
- **QA/DevOps**
  - E2E smoke: request → approve → confirm email/ICS; reschedule path.
  - Staging verification with calendar flag off/on; rollback plan for migration.

---

## Risks & Mitigations
- **Timezone errors**: Store UTC + timezone field; Luxon helpers used end-to-end; admin UI shows localized times with offsets to reduce confusion.
- **Double-booking**: DB unique constraints + transactional checks + overlap queries with tolerance buffer; alarms on conflict errors to tune buffers.
- **Calendar quota**: Mock in dev/test; flag for staging; sync only on approve/reschedule/cancel; retry/backoff + circuit breaker shared with email adapter.

---

## Retro / Follow-ups
- Add attendee-aware ICS generation once client accounts land.
- Evaluate moving digest/reminder scheduling to a queue service in Phase 2.
- Confirm Google Calendar service account scopes in production before enabling full sync.

---

## Dependencies & Prep
- Google Calendar credentials (staging/prod); confirm service account scopes.
- Service catalog already present from Sprint 3; reuse for booking serviceId.
