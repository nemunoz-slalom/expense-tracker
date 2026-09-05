# Implementation Plan: Complete Production Readiness

**Branch**: `001-complete-production-readiness` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)
**Authoritative inputs**: `docs/api-contract.md`, `.specify/memory/constitution.md`, `docs/architecture.md`, and the feature specification.

## Summary

Build the documented, local single-user Services App from this documentation-only repository. The implementation is a React/TypeScript client and Node.js/Express/SQLite server that implement the already frozen HTTP contract without changing endpoint shapes or behavior. Work is organized around durable Service data; layered backend behavior; accessible, localized UI; isolated verification; and production-operational controls.

## Technical Context

| Area | Decision |
|---|---|
| Language/runtime | Node.js with CommonJS on the server; React with TypeScript and ES modules in the client. |
| Primary dependencies | Express, SQLite driver, Jest, React Testing Library, Playwright (Chromium), react-i18next, shadcn/ui, Tailwind CSS, Framer Motion, and a PDF-generation library selected by the backend owner. |
| Storage | Local SQLite: production/development `services.db`; isolated test database `services.test.db`. |
| External integration | Telegram Bot API only through `server/external/telegram.client.js`; credentials remain server-only. |
| Project type | Local web application with separate server and client packages, plus root E2E tests. |
| Target platforms | Modern Chrome, Firefox, Safari, and Edge; desktop and tablet layouts at 768px and wider. |
| Operational time basis | Server-local timezone for status, paid transition dates, and statistics anchoring; deployment documentation must state the configured host timezone. |
| Performance objectives | List p95 under 2 seconds for 1,000 bills; type statistics under 1 second; PDF export under 5 seconds; responsive UI motion targets 60fps. |
| Security constraints | No authentication in the local MVP; allow only configured CORS origins, parameterize every query, validate all external inputs, omit secrets and sensitive paths from responses/logs, and prevent committing environment/data files. |
| Filter contract | `month` is mutually exclusive with `from` and `to`; mixed date-filter modes return `400 ValidationError`. |
| Empty export contract | A valid zero-result export returns `200 application/pdf` with filter context, zero counts, no rows, and an explicit no-data statement. |
| Scope boundary | Implement FR-001 through FR-038 only. Do not introduce accounts, authorization, categories, budgets, banking data, cloud sync, multi-currency, recurrence, or a persistent notification queue. |

## Constitution Check

### Pre-design gate

| Constitution requirement | Plan response | Result |
|---|---|---|
| Contract-first layered architecture | Routes delegate to services; services coordinate repositories and Telegram client; components use hooks; hooks use API services; only repositories use SQL and only API modules use `fetch`. | Pass |
| Domain integrity and boundaries | Central validation validates complete post-PATCH state before writes. Derived status and billing periods remain non-persisted. | Pass |
| Testability and isolation | Unit, real-SQLite integration, mocked frontend-network integration, and seven POM-based Chromium journeys are planned. Telegram is stubbed; test DB is separate. | Pass |
| Accessible consistent UX | UI uses only shadcn/ui, Tailwind tokens, i18n keys, keyboard semantics, WCAG checks, and reduced-motion behavior. | Pass |
| Reliable observable side effects | Browser-local 8-second Undo timer is isolated in `useUndoTimer`; backend has no timer. Telegram failures are structured/logged best effort and do not fail bill operations. | Pass |
| Additional stack/configuration constraints | Separate `app.js` and listener, validated environment, server-only credentials, fixed ports, and documented commands are planned. | Pass |

No constitutional exception or complexity justification is required.

### Post-design re-check

The data model keeps only Service records durable. The implementation contract defers all HTTP details to the frozen authoritative contract. The planned file ownership preserves the required dependency direction and confines notification timing to the browser. All gates remain **Pass**.

## Intended Project Structure and Ownership

```text
expense-tracker/
├── server/                                      # Backend/API/Domain owner
│   ├── config/
│   │   └── env.js                               # server configuration validation
│   ├── db/
│   │   ├── connection.js                        # SQLite connection factory
│   │   ├── schema.js                            # Service table/index initialization
│   │   └── migrate.js                           # idempotent startup initialization
│   ├── external/
│   │   └── telegram.client.js                   # Telegram-only transport boundary
│   ├── repositories/
│   │   └── service.repository.js                # parameterized Service persistence
│   ├── routes/
│   │   ├── services.routes.js                   # CRUD and notification routes
│   │   ├── stats.routes.js                      # statistics route
│   │   └── export.routes.js                     # PDF route
│   ├── services/
│   │   ├── service.service.js                   # CRUD, validation, status, sort
│   │   ├── notification.service.js              # message formatting and sending
│   │   ├── stats.service.js                     # derived billing periods
│   │   ├── pdf.service.js                       # filtered report generation
│   │   └── errors.js                            # typed domain errors
│   ├── utils/
│   │   ├── dates.js                             # calendar/date-only operations
│   │   ├── filters.js                           # contract query parsing
│   │   ├── logger.js                            # redacted structured logging
│   │   ├── sorting.js                           # deterministic urgency sort
│   │   └── validation.js                        # Service and query validation
│   ├── __tests__/
│   │   ├── unit/                                # Backend/API/Domain owner
│   │   ├── integration/                         # Database/Data + Backend shared
│   │   └── helpers/                             # fixtures and fresh DB support
│   ├── app.js                                   # Express construction only
│   ├── server.js                                # HTTP listener only
│   └── package.json                             # Integration owns shared scripts
├── client/                                      # Frontend/UI owner
│   ├── src/
│   │   ├── api/
│   │   │   ├── services.api.ts                  # sole CRUD/notify fetch boundary
│   │   │   ├── stats.api.ts
│   │   │   └── export.api.ts
│   │   ├── components/
│   │   │   ├── ui/                              # shadcn/ui primitives
│   │   │   ├── ServiceForm.tsx
│   │   │   ├── ServiceList.tsx
│   │   │   ├── ServiceItem.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── DateFilter.tsx
│   │   │   ├── TypeFilter.tsx
│   │   │   ├── UndoToast.tsx
│   │   │   ├── DeleteConfirmation.tsx
│   │   │   └── ConsumptionByPeriodChart.tsx
│   │   ├── config/runtime.ts                    # public API base URL only
│   │   ├── hooks/
│   │   │   ├── useServices.ts
│   │   │   ├── useConsumptionStats.ts
│   │   │   ├── useUndoTimer.ts
│   │   │   └── useToasts.ts
│   │   ├── lib/                                 # shadcn utilities
│   │   ├── locales/en.json                      # all visible English text
│   │   ├── styles/                              # global tokens and Tailwind entry CSS
│   │   ├── types/                               # contract/domain TypeScript types
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── __tests__/                               # component/hook/API integration tests
│   └── package.json                             # Integration owns shared scripts
├── tests/
│   ├── e2e/                                     # QA/Security owner
│   │   ├── pages/                               # private locators, public actions
│   │   └── *.spec.ts                            # assertions only
│   └── helpers/                                 # reset and test-server support
├── playwright.config.ts                          # Integration + QA merge hotspot
├── package.json                                  # root E2E orchestration
├── .env.example                                 # Integration owner; no values/secrets
├── .gitignore                                   # Integration owner; excludes env and DB files
└── docs/                                        # unchanged API contract unless approved
```

`server/routes → server/services → (server/repositories → server/db, server/external)` and `client/components → client/hooks → client/api → backend` are mandatory import directions. Frontend `types` are dependency leaves. `server/app.js`, root scripts/configuration, locale catalog structure, global theme files, and Playwright configuration are coordinated shared files rather than parallel-edit targets.

## Workstreams, Dependencies, and Integration Order

| Workstream | Owns | Deliverables | Hard dependencies | Soft dependencies / parallel work |
|---|---|---|---|---|
| Database/Data | `server/db/`, `server/repositories/`, data fixtures | schema/init, constraints, indexes, atomic repository operations, fresh-DB helpers | frozen Service and filter semantics | Backend can define services against repository interface; QA can author fixtures |
| Backend/API/Domain | `server/routes/`, `server/services/`, `server/external/`, backend utilities | all frozen endpoints, errors, dates/status/sort, stats, PDFs, Telegram behavior | configuration, repository interface/schema | Frontend uses contract mocks; QA builds API cases |
| Frontend/UI | `client/` except shared setup decisions | typed API clients, hooks, local Undo, bill/list/filter/form/chart/export UI, i18n/a11y | frozen API contract and public runtime URL | Backend implementation; uses mocks until integration |
| QA/Security | tests, verification evidence, security review | test fixtures, contract tests, POM suite, accessibility/responsive/failure/performance checks | testable server/client seams | runs continuously with each workstream |
| Integration/Production readiness | package manifests, shared scripts, entrypoints, env docs, CORS/deployment/run config | runnable packages, test ports, build/start scripts, secret hygiene, operational docs, release gates | completed package-level capabilities | establishes foundation before all teams and assembles after |

### Hard dependency sequence

1. **Integration foundation**: establish package boundaries, scripts, environment shape, `.gitignore`, test ports, app/listener separation, and test database path.
2. **Frontend platform**: after client setup, establish i18n, project-owned shadcn primitives, global theme/accessibility tokens, and toast/live-feedback infrastructure. This may run in parallel with Database/Data work.
3. **Database/Data**: initialize Service schema and repository interface; prove writes are atomic and isolated.
4. **Backend core**: implement contract parsing/validation, CRUD/status/filtering/error translation over the repository.
5. **Frontend core**: integrate CRUD/list/filter UI only after the frontend platform is established and independently passing mocked API tests.
5. **Notifications**: server notification endpoint and paid-transition behavior require core mutation operations; browser timer requires successful create/delete API actions.
6. **Analytics/PDF**: statistics and export require reusable filtered ordered selection semantics; chart and download UI require their endpoints.
7. **Release assembly**: full E2E, failure-mode, accessibility, responsive, performance, configuration, and production-build validation.

### Explicit parallelism

After foundation and contract review, Database/Data and the Frontend UI shell may proceed concurrently. Once the repository interface is stable, Backend/API/Domain can proceed while Frontend builds against fixture responses. Notification backend work and `useUndoTimer` proceed independently after CRUD semantics exist, then integrate as one timed flow. Statistics/PDF server work and chart/export client work proceed concurrently after filter ownership is stabilized. QA/Security authors tests and controlled failure tooling in parallel but merges capability-specific tests with the owning workstream.

### Merge hotspots and controls

| Hotspot | Coordinator | Control |
|---|---|---|
| `package.json`, lockfiles, server/client setup | Integration | Serialize dependency/script changes and rebase before merging. |
| `server/app.js` and route order | Backend/API/Domain | Register statistics/export static routes before `/:id`; one owner performs route wiring. |
| `server/db/schema.js`, repository interface, fixtures | Database/Data | Land schema/interface first; no service owner writes SQL. |
| `client/src/App.tsx`, global styles, shadcn components, `en.json` | Frontend/UI | Batch composition, tokens, primitive installation, and catalog key additions. |
| `playwright.config.ts`, root E2E scripts, database reset | QA/Security + Integration | Keep a single coordinated reset/startup contract on ports 3001/5002. |
| `docs/api-contract.md` | Project lead/architect | Frozen. No workstream changes it; a discovered discrepancy follows its explicit change process before code changes. |

## Detailed Delivery Plan

### 1. Database/Data

- Create idempotent SQLite schema initialization for exactly the durable Service fields in [data-model.md](data-model.md).
- Use database constraints for representable type, paid flag, non-negative amount, and timestamp defaults where SQLite can enforce them; retain application validation for calendar correctness and complete PATCH-state rules.
- Implement parameterized `findAll`, `findById`, `create`, `update`, `delete`, and filtered-selection methods. Repository results are mapped to plain domain objects, never raw rows.
- Design filtering queries so type and paid predicates are ANDed with exactly one date mode. Reject requests that combine `month` with `from` or `to` as `400 ValidationError`. Reuse the same ordered selection for list and export.
- Add indexes for type/date and paid/date query paths only after query behavior is correct; validate with representative 1,000-record test data.
- Verify restart durability, rollback/no partial mutation on errors, and strict production/test database separation.

### 2. Backend/API/Domain

- Build configuration validation, CORS allowlist handling, redacted structured logger, centralized typed errors, and Express error middleware.
- Implement pure utilities for strict identifiers, real `YYYY-MM-DD` validation, server-local today, query validation, urgency status, and stable sort order.
- Implement each frozen API route, preserving exact envelope, status code, no-content behavior, binary PDF behavior, and error shape defined in `docs/api-contract.md`.
- Keep route handlers to parsing/validation/delegation/HTTP translation; put complete resulting-state validation and paid transition rules in `service.service.js`.
- Generate status per response; never add a status or billing-period persistence column.
- Implement statistics exactly from the contract's current server-local anchor, with the specified type frequencies, chronological zero-filled output, non-null amount inclusion, and zero-inclusive averages.
- Make PDF output select the same ordered filtered records as list; when that selection is empty, return a valid PDF with filter context, zero counts, no rows, and an explicit no-data statement.
- Isolate Telegram transport, redact credentials, log unavailable credentials and delivery failures, and make delivery best effort. Creation creates no notification/timer; notification endpoint sends only when called; only false-to-true paid transition sends immediately.

### 3. Frontend/UI

- Define TypeScript types matching the frozen API payloads and typed error handling. Keep `fetch` exclusively in `client/src/api/`.
- Build `useServices` for fetching, mutations, refetch/error states, and stale-result avoidance; build `useConsumptionStats` only for a selected type.
- Build `useUndoTimer` as browser-local state with independent timers keyed by created Service ID. Start only after a create response with `paymentDate`, cancel before DELETE on Undo, call the application notify endpoint once at natural expiry, and clear timers on teardown. It must never imply a backend timer or direct browser-to-Telegram communication.
- Compose forms, list/actions, filters, confirmation, feedback, chart, and export around shadcn/ui primitives. Calendar selection must be a `Calendar` in a `Popover`; type filtering uses `Select`; deletion uses `AlertDialog`; feedback uses Sonner; countdown feedback uses `Progress`.
- Default UI filtering to current month, combine filter values by AND, hide the chart for All types, and generate export query parameters from the active view.
- Put every visible/accessible string and dynamic message in `locales/en.json`. Use theme tokens instead of component hex values; include status text/icons beyond color.
- Verify labels/error associations, focus movement and restoration, keyboard actions, live feedback, 44px touch targets, 768px layout, and reduced-motion behavior.

### 4. QA/Security

- Unit test validation, dates, status/sorting, filter construction, notification messages/transition guard, billing-period derivation, and timer lifecycle with fake timers.
- Backend integration-test route/service/repository slices against fresh `services.test.db`; stub Telegram HTTP at the client boundary. Cover every endpoint's representative success, validation, not-found, and controlled persistence failure outcomes.
- Frontend integration-test components/hooks through mocked API transport, not mocked hooks. Cover loading/empty/error/success, mutation refetching, form errors, accessible controls, current-month/custom filters, timer paths, chart visibility, and download failure behavior.
- Implement the seven required Chromium POM journeys: create/list; Undo; mark paid; edit/re-sort; confirmed delete; type filter/chart; filtered PDF export. Reset data independently for each.
- Test CORS restrictions, malformed input, redacted errors/logging, unavailable DB, missing/failed Telegram credentials, browser absence of secrets, ignored files, and no duplicate notification from repeated paid PATCH.
- Use automated accessibility assertions plus manual keyboard/reduced-motion checks at 768px and 1024px. Record list/chart/export timing measurements against the requirements.

### 5. Integration/Production Readiness

- Provide repeatable install/test/lint/build/start scripts in package manifests and root E2E orchestration; keep dev on 3000/5001 and test on 3001/5002.
- Provide an environment example documenting database path, allowed origin, optional Telegram credentials, and host timezone without real values.
- Ensure startup logs operationally useful, redacted records for start/shutdown/mutation/failure; fail clearly for unsafe required configuration and warn for incomplete optional notification configuration.
- Validate clean installation, all available checks, production client build, server startup, E2E web servers, data persistence, and git secret/data hygiene before release.

## Test Strategy and Release Gates

| Level | Scope and isolation | Required evidence |
|---|---|---|
| Unit | Pure backend logic; services with repository/client doubles; React hooks/components with fakes. No DB/network. | Boundary date/status/sort/filter/period/message/timer coverage. |
| Backend integration | Route → service → repository → fresh real SQLite; Telegram stubbed. | Contract success/errors, atomic writes, persistence, query boundaries, stats, PDF selection. |
| Frontend integration | Component → hook → mocked API transport. | Visible behavior, errors, i18n/a11y, filters, Undo, chart/export reactions. |
| E2E | Chromium only through configured frontend/backend test servers and independently reset data. | Seven POM journeys, no order dependency, no live Telegram calls. |
| Operational | Controlled failure and release checks. | CORS/secrets/redaction/configuration, 768/1024 responsiveness, reduced motion, performance targets, clean build. |

Release is blocked by a frozen-contract mismatch, a layer-direction violation, persistent derived status/period data, a backend-owned Undo timer, client-visible Telegram credentials, non-isolated tests, a failed relevant command, or unmet required journey/accessibility/security evidence.

## Complexity Tracking

No constitution violations or exceptional complexity are introduced.
