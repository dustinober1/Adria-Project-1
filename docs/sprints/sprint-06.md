# Sprint 6 - Email Experience Hardening (Planned)

**Sprint Duration:** February 3, 2026 to February 16, 2026 (2 weeks)  
**Sprint Goal:** Make all transactional emails reliable, branded, observable, and easy to operate across contact and intake flows.  
**Status:** Planned

---

## Scope, Capacity, Commitment
- **Stories:** US-6.1 (email abstraction/reliability), US-6.2 (branded templates), US-6.3 (admin notification routing), US-6.4 (secrets/feature flags + docs)  
- **Planned Velocity:** 22 pts (steady)  
- **Allocation:** Backend 9 pts, Frontend 5 pts, QA/DevOps 8 pts  
- **Definition of Done:** Code merged to `main`, tests (unit/integration/E2E smoke) passing, Swagger/env docs updated, deploy to staging with verification, ops checklist (SPF/DKIM, secret mapping) updated.

### Acceptance Criteria by Story
- **US-6.1 Email Abstraction**
  - Email adapter with retry/backoff + circuit breaker; structured logs and metrics per send.
  - Sandboxed/log-only mode respected by env/feature flag; SendGrid client errors surfaced as typed results.
  - Per-template overrides (from/reply-to) supported; unit tests for retry/backoff paths.
- **US-6.2 Branded Templates**
  - Branded HTML + text templates for contact + intake + auth emails; shared partials (header/footer/button).
  - Snapshots to prevent drift; variables validated to avoid missing placeholders.
  - Template previews available locally (CLI or route) without sending.
- **US-6.3 Admin Notification Routing**
  - Admin recipients configurable (to/cc/bcc); optional digest mode for forms/contact.
  - Routing rules documented; submissions tagged with notification status.
  - Tests cover routing choices and digest grouping logic (unit/integration with mocks).
- **US-6.4 Secrets/Flags/Docs**
  - Env templates updated for new flags (EMAIL_SANDBOX, EMAIL_MAX_RETRIES, DIGEST_ENABLED, etc.).
  - CI/CD secret mapping documented; SPF/DKIM runbook updated; Swagger reflects email behaviors.

---

## Deliverables
- Email adapter with retry/backoff, circuit breaker, structured logging/metrics, sandbox flag.
- Branded HTML/text templates for contact, intake submission, admin alerts, and auth flows.
- Notification routing config (to/cc/bcc/digest) with feature flags; log-only preview CLI.
- Updated Swagger, env examples, and ops docs (SPF/DKIM, secret mapping); Jest tests (unit/integration/snapshots).

---

## Architecture & Data Plan
- Adapter wraps SendGrid client; supports sandbox/log-only modes per env flag.
- Templates stored as code partials; render function accepts variables + produces HTML/text.
- Notification routing config via env + defaults; digest queue (in-memory for now) gated by flag.
- Metrics via structured logs (counts, latency, retry attempts); future hook for APM.

---

## Work Breakdown
- **Backend**
  - Add email adapter + retry/backoff + circuit breaker; typed results.
  - Implement template renderer with shared partials; preview CLI.
  - Routing config: admin cc/bcc/digest; extend submission/contact notification flows.
  - Swagger updates; env templates + feature flags; ops docs (SPF/DKIM/secrets).
  - Tests: adapter unit, template snapshots, integration for contact/intake notifications.
- **Frontend**
  - Optional: lightweight email preview page (dev-only) showing rendered HTML.
  - Ensure admin UI surfaces notification status (badge/text) for submissions.
- **QA/DevOps**
  - CI smoke to render templates; staging verification (send + sandbox).
  - Secrets mapping in GitHub Actions/Cloud Build; SPF/DKIM checklist.

---

## Risks & Mitigations
- **Deliverability**: Add SPF/DKIM checklist; sandbox default in non-prod.
- **Template drift**: Snapshot tests + shared partials; preview CLI.
- **Rate limiting**: Backoff + circuit breaker; monitor retry counts.

---

## Dependencies & Prep
- Existing SendGrid keys; admin email addresses; staging/prod DNS control for SPF/DKIM.
- No new DB schema required.
