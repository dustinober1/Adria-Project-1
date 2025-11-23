# Sprint 7 - Booking & Calendar Sync (Planned)

**Sprint Duration:** February 17, 2026 to March 2, 2026 (2 weeks)  
**Sprint Goal:** Enable clients to request/book sessions with availability windows, admin approvals, and calendar-friendly notifications.  
**Status:** Planned

---

## Scope, Capacity, Commitment
- **Stories:** US-7.1 (availability model + calendar wiring), US-7.2 (booking request/confirm APIs), US-7.3 (admin booking dashboard + client UI), US-7.4 (reminders/ICS + notifications)  
- **Planned Velocity:** 22 pts  
- **Allocation:** Backend 10 pts, Frontend 8 pts, QA/DevOps 4 pts  
- **Definition of Done:** Code merged to `main`, migrations applied, tests (unit/integration/E2E smoke) passing, Swagger/env docs updated, staging verified with sample bookings, rollback steps documented.

### Acceptance Criteria by Story
- **US-7.1 Availability & Calendar Wiring**
  - Prisma models: Availability (recurring/one-off), Booking, optional TimeSlot; constraints to prevent overlaps.
  - Calendar service abstraction (Google Calendar mock in dev/test) with feature flag for sync.
  - Seeds for demo availability windows and sample bookings.
- **US-7.2 Booking API**
  - Public booking request endpoint with validation (date/time, serviceId, contact info), rate limit, recaptcha.
  - Admin endpoints to approve/decline/reschedule/cancel; status transitions enforced; transactional double-booking guard.
  - Responses include ICS download URL (flagged) and calendar sync status where enabled.
- **US-7.3 Frontend UI**
  - Client booking request form (RHF + Zod) with service selection and preferred times.
  - Admin bookings dashboard with filters (date range, status, service), detail view, and status actions.
  - Loading/error/empty states; success messaging; accessibility on inputs/errors.
- **US-7.4 Notifications/Reminders**
  - Email notifications (visitor + admin) for request/approval/reschedule/cancel with ICS attachment helper.
  - Optional reminder emails (flagged) X hours before event.
  - Tests for ICS generation, email payloads, and status transitions.

---

## Deliverables
- Prisma migration for Availability/Booking (and optional TimeSlot) with seeds.
- Booking APIs (public request + admin manage) with validation, rate limiting, recaptcha, and double-booking guard.
- Calendar service abstraction with Google Calendar integration behind a flag; ICS helper.
- Frontend booking request form and admin bookings UI (filters/actions).
- Notification/reminder emails with ICS; Swagger/env templates updated; tests across layers.

---

## Architecture & Data Plan
- Models: `Availability` (serviceId?, date range, recurring pattern, timezone), `Booking` (status, serviceId, contact info, scheduledAt, duration, calendarEventId?, metadata).
- DB constraints: unique index on (scheduledAt, serviceId) with buffer; transactional checks for overlap.
- Calendar abstraction similar to email adapter; toggle via `CALENDAR_SYNC_ENABLED`.
- ICS helper for outbound emails; stored inline (no persistence needed).

---

## Work Breakdown
- **Backend**
  - Add Prisma models/migration; seeds.
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
- **Timezone errors**: store UTC + timezone field; use luxon helpers; standardize formatting.
- **Double-booking**: DB unique constraints + transactional checks; overlap queries with tolerance buffer.
- **Calendar quota**: Mock in dev/test; flag for staging; minimal sync on approve/reschedule/cancel only.

---

## Dependencies & Prep
- Google Calendar credentials (staging/prod); confirm service account scopes.
- Service catalog already present from Sprint 3; reuse for booking serviceId.
