<!--
Sync Impact Report
- Version change: scaffold (unversioned) -> 1.0.0
- Ratified 2026-09-03 as the initial governance baseline. The documentation
  audit corrections were folded into this initial version rather than issuing
  a separate amendment, so no post-ratification version bump applies.
- Modified principles: placeholder principles -> five project-specific core
  principles. Principle V assigns the 8-second creation Undo timer to the
  frontend, defines `POST /api/services/:id/notify`, and states that DELETE
  sends no notification.
- Added sections: Additional Constraints (including shadcn/ui date selection
  rules and the explicit source-of-truth hierarchy), Development Workflow
- Removed sections: none
- Follow-up TODOs: none
-->

# Services App Constitution

## Core Principles

### I. Contract-First Layered Architecture
The application MUST preserve the documented dependency direction: frontend
components -> hooks -> API services -> backend, and backend routes -> services
-> repositories or external services -> database. Route handlers MUST NOT run
SQL, repositories MUST NOT contain business rules, components MUST NOT call
`fetch` directly, and Telegram access MUST remain behind the external-service
boundary. The API contract is the single source of truth for frontend-backend
communication; any contract change MUST update `docs/api-contract.md`, affected
specifications, and tests before implementation proceeds. This keeps ownership
clear and permits each layer to be tested and changed independently.

### II. Domain Integrity and Explicit Boundaries
All bill input MUST be validated before persistence or network calls. Validation
MUST enforce the documented service types, calendar-date formats, non-blank
names, non-negative finite amounts, and valid due/payment-date relationships.
Database statements MUST be parameterized, and repositories MUST return domain
objects rather than raw database rows. Services MUST own business rules such as
urgency status, deterministic sorting, notification triggering, and payment
transitions; HTTP status translation belongs to routes. Explicit boundaries
prevent invalid data, injection vulnerabilities, and duplicated business logic.

### III. Testable Behavior and Isolation
Every new behavior MUST include tests at the appropriate level before merging.
Pure validation, sorting, status, formatting, and filter logic MUST have focused
unit tests. API and component interactions MUST have integration coverage for
the primary success path and a meaningful error path. Critical user journeys
MUST remain within the 5-8 journey E2E budget and use Chromium with the Page
Object Model. Tests MUST be deterministic and isolated: unit tests use doubles
for external systems, backend integration tests use fresh real SQLite state,
Telegram requests are stubbed, and test data or state MUST NOT leak between
tests. This makes failures actionable and preserves confidence during change.

### IV. Accessible and Consistent User Experience
The frontend MUST use shadcn/ui primitives with Tailwind CSS and the defined
theme tokens; it MUST NOT introduce a parallel component library or one-off
palette values. All user-facing text MUST come from the i18n system. Bill
urgency MUST be communicated by deterministic ordering plus text and/or icon
labels, not color alone. Interactive controls MUST preserve keyboard access,
screen-reader semantics, WCAG 2.1 AA contrast, and reduced-motion preferences.
Framer Motion animations MUST enhance feedback without blocking task completion.
These constraints keep the single-page utility clear, usable, and consistent.

### V. Reliable Side Effects and Observable Operations
Primary bill operations MUST remain successful when Telegram delivery fails;
external failures MUST be logged and MUST NOT silently disappear. The 8-second
creation Undo timer MUST be owned by the frontend as a local timer: the backend
MUST NOT create, own, persist, schedule, cancel, or manage it. The backend MUST
expose `POST /api/services/:id/notify` so the frontend can request the creation
notification when its local timer expires, and `DELETE /api/services/:id` MUST
NOT send a notification. Mark-as-paid notifications MUST be sent immediately
with no Undo window, with the payment date set according to the API contract.
Application construction MUST remain separable from HTTP listener startup so
operations can be exercised in tests. Isolating side effects protects user data
and makes asynchronous behavior observable and testable.

## Additional Constraints

The implementation MUST use the documented stack and conventions:

- Backend code uses Node.js, Express, CommonJS modules, and SQLite.
- Frontend code uses React, TypeScript, ES modules, react-i18next, shadcn/ui,
  Tailwind CSS, and Framer Motion.
- shadcn/ui is the sole component system. No parallel component library MAY be
  introduced. Date selection MUST use the shadcn/ui `Calendar` inside a
  `Popover`; native `<input type="date">` MUST NOT be used. Type selection MUST
  use `Select`, destructive deletion MUST use `AlertDialog`, and Undo feedback
  MUST use the project's toast/Sonner pattern. Semantic HTML is allowed for
  document structure, but interactive controls MUST use shadcn/ui primitives.
- JavaScript and TypeScript use two-space indentation, semicolons, single
  quotes, explicit exported function types where applicable, and no
  unnecessary `any` types.
- Development and test processes use the fixed ports and separate test
  database defined by `docs/testing-guidelines.md`.
- Environment configuration MUST validate database settings and application
  startup requirements without committing secrets. Telegram Bot API credentials
  are optional; if missing, all Telegram notifications MUST be skipped without
  crashing the application or blocking user operations. Missing credentials MUST
  be logged at startup so operators are aware.
- The authoritative project guidance remains in `docs/spec.md`,
  `docs/architecture.md`, `docs/api-contract.md`, `docs/coding-guidelines.md`,
  `docs/testing-guidelines.md`, and `docs/ui-guidelines.md`. The source-of-truth
  hierarchy is explicit: `docs/api-contract.md` is authoritative for HTTP
  behavior, and this constitution is authoritative for project governance and
  architectural principles. No lower-level document MAY contradict either. When
  a contradiction is found, the contradictory document MUST be corrected rather
  than reinterpreted during implementation.

## Development Workflow

Each feature MUST begin with a clear specification and implementation plan
before code changes, using the Spec Kit workflow where applicable. A change
that crosses an architecture boundary MUST document the rationale and update
`docs/architecture.md`; a contract change MUST follow Principle I. Pull
requests MUST identify the affected requirements, include or justify tests,
and pass the relevant unit, integration, lint, build, and E2E checks available
for the changed package. Reviews MUST check dependency direction, validation,
error handling, accessibility, localization, and test isolation. Generated
artifacts, unrelated refactors, broad lint suppressions, and hidden fallbacks
MUST NOT be included merely to make a change pass.

## Governance

This constitution governs project decisions and supersedes conflicting local
practices. Amendments MUST be proposed as a documented change to this file,
including the affected principles, rationale, compatibility impact, migration
work, and updates required in dependent guidance. An amendment is effective
only after review by the project owner or designated maintainer. Every pull
request MUST assess compliance with the constitution, and reviewers MUST reject
unjustified violations or record an explicit approved exception.

Versioning follows semantic versioning for governance: MAJOR denotes removal or
backward-incompatible redefinition of a principle; MINOR denotes a new
principle or materially expanded governance requirement; PATCH denotes
clarifications, wording, or non-semantic corrections. Compliance MUST be
reviewed at feature planning, pull request review, and release readiness.
Exceptions MUST state their scope, owner, reason, and expiration or removal
condition.

**Version**: 1.0.0 | **Ratified**: 2026-09-03 | **Last Amended**: 2026-09-03
