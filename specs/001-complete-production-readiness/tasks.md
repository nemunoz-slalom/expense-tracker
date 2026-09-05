---

description: "Executable implementation tasks for Complete Production Readiness"
---

# Tasks: Complete Production Readiness

**Input**: Design artifacts in `specs/001-complete-production-readiness/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/implementation-contract.md`, `quickstart.md`, `docs/api-contract.md`, and `.specify/memory/constitution.md`

**Contract rule**: `docs/api-contract.md` is frozen and authoritative. These tasks implement it; none authorize a contract change.

**Organization**: Tasks are grouped by independently testable user story after the common setup and foundation. Work in separate worktrees by ownership boundary; do not concurrently edit a listed merge-hotspot file.

## Format

Every task below uses `- [ ] TNNN [P] [USN] Description with exact path`. `[P]` identifies work that may run in parallel after its stated hard prerequisites are complete. User-story labels are present only in story phases.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the coordinated package, runner, configuration, and source-layout boundaries without adding product behavior.

- [X] T001 Initialize root E2E orchestration scripts and dependencies in `package.json`
- [X] T002 Generate the root dependency lockfile for the coordinated E2E toolchain in `package-lock.json`
- [X] T003 Initialize server scripts and runtime dependencies in `server/package.json`
- [X] T004 Generate the server dependency lockfile in `server/package-lock.json`
- [X] T005 Initialize client scripts and frontend dependencies in `client/package.json`
- [X] T006 Generate the client dependency lockfile in `client/package-lock.json`
- [X] T007 Configure Chromium test servers, fixed test ports, and serialized reset ownership in `playwright.config.ts`
- [X] T008 Define safe environment examples and exclude environment and SQLite data files in `.env.example` and `.gitignore`

**Checkpoint**: Integration owns the manifests, lockfiles, environment example, ignore rules, and Playwright configuration. These files are serialized merge hotspots and no feature worktree edits them without rebasing through that owner.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the durable Service boundary, shared domain rules, isolated test support, and error/configuration seams required by every user story.

**Critical**: All work in this phase is a hard prerequisite for every user-story phase. Database/Data owns the schema, repository interface, and fixtures; Backend/API owns application wiring when routes are added later.

- [X] T009 Implement required server configuration validation and optional Telegram credential warnings in `server/config/env.js`
- [X] T010 [P] Implement isolated SQLite connection selection for development and test databases in `server/db/connection.js`
- [X] T011 Implement idempotent Service table constraints and documented query indexes in `server/db/schema.js`
- [X] T012 Implement startup migration initialization in `server/db/migrate.js`
- [X] T013 Implement parameterized Service repository mapping and transaction interface in `server/repositories/service.repository.js`
- [X] T014 [P] Create fresh-SQLite fixtures, database reset, and Telegram stubs in `server/__tests__/helpers/test-support.js`
- [X] T015 [P] Implement typed domain errors and redacted structured logging in `server/services/errors.js` and `server/utils/logger.js`
- [X] T016 [P] Write focused date, validation, filter, and sorting tests in `server/__tests__/unit/domain-utils.test.js`
- [X] T017 Implement strict calendar, server-local date, and identifier utilities in `server/utils/dates.js`
- [X] T018 Implement complete-Service and contract-query validation utilities, including HTTP 400 rejection of mixed `month` and `from`/`to` date-filter modes, in `server/utils/validation.js` and `server/utils/filters.js`
- [X] T019 Implement deterministic derived-status and urgency ordering utilities in `server/utils/sorting.js`

**Checkpoint**: A fresh `services.test.db` can initialize the sole durable Service model, repository results are plain domain objects, and pure domain rules have passing focused tests. No status, billing period, timer, queue, account, category, budget, or authentication data is persisted.

---

## Phase 2B: Frontend Platform (Blocking UI Prerequisites)

**Purpose**: Establish the required localization, component, theme, accessibility, and toast foundations before any feature component is implemented.

**Critical**: These tasks may proceed in parallel with Phase 2 after T005, but T032–T036, T044–T045, T055, T064, and T073 must not begin until this platform is stable. Frontend/UI owns these shared files and merges them as one coordinated platform PR.

- [X] T025 [P] Define frozen-contract Service, DTO, filter, and typed API-error models in `client/src/types/services.ts`
- [X] T069 [P] Initialize localization and load the English catalog at the application entry point in `client/src/index.tsx` and `client/src/locales/en.json`
- [X] T070 [P] Install and configure project-owned accessible shadcn primitives in `client/src/components/ui/`
- [X] T071 [P] Define contrast-compliant dark theme tokens, focus states, touch targets, responsive rules, and reduced-motion overrides in `client/src/styles/globals.css`
- [X] T072 Implement persistent actionable error toasts and announced success/loading feedback in `client/src/hooks/useToasts.ts`

**Checkpoint**: The client has a working i18n provider, project-owned shadcn primitives, theme and accessibility tokens, and an announced toast surface. Feature components must consume these foundations rather than create substitutes.

---

## Phase 3: User Story 1 - Manage Household Bills (Priority: P1) 🎯 MVP

**Goal**: Deliver durable create, retrieve, edit, mark-paid, and confirmed-delete bill management through the frozen contract and an accessible initial interface.

**Independent Test**: With a fresh database, create each supported type, restart and retrieve it, update one record only, mark one unpaid record paid, and confirm or cancel deletion while invalid and missing requests show client-safe feedback.

### Tests for User Story 1

- [X] T020 [P] [US1] Write CRUD, complete-PATCH validation, and paid-transition unit tests in `server/__tests__/unit/service.service.test.js`
- [X] T021 [P] [US1] Write fresh-SQLite CRUD success, validation, not-found, restart-durability, and atomic-failure integration tests in `server/__tests__/integration/services-crud.test.js`
- [X] T022 [P] [US1] Write typed CRUD request, envelope parsing, and API-error serialization tests in `client/__tests__/services.api.test.ts`
- [X] T023 [P] [US1] Write mocked-transport form, list, edit, paid-action, and deletion-feedback integration tests in `client/__tests__/manage-services.test.tsx`
- [ ] T024 [P] [US1] Write independent create/list, mark-paid, edit/re-sort, and confirmed-delete Chromium journeys in `tests/e2e/manage-services.spec.ts`

### Implementation for User Story 1

- [X] T026 [US1] Implement the sole CRUD and application-notify browser-fetch boundary, without Telegram credentials or direct Telegram transport, in `client/src/api/services.api.ts`
- [X] T027 [US1] Implement create, get, update, paid-transition, delete, response-status projection, and complete-state validation in `server/services/service.service.js`
- [X] T028 [US1] Implement CRUD HTTP parsing, validation translation, no-content deletion, and client-safe errors in `server/routes/services.routes.js`
- [X] T029 [US1] Construct Express middleware, error handling, and core service-route mounting without listener startup in `server/app.js`
- [X] T030 [US1] Start the configured HTTP listener separately from application construction in `server/server.js`
- [X] T031 [US1] Implement typed list state, CRUD actions, refetching, and stale-result protection in `client/src/hooks/useServices.ts`
- [X] T032 [US1] Implement localized create and edit validation controls using shadcn primitives in `client/src/components/ServiceForm.tsx`
- [X] T033 [US1] Implement the bill collection loading, empty, and action surface in `client/src/components/ServiceList.tsx`
- [X] T034 [US1] Implement bill identity, amount/date details, and valid paid/edit/delete actions in `client/src/components/ServiceItem.tsx`
- [X] T035 [US1] Implement cancellation-safe destructive confirmation with focus return in `client/src/components/DeleteConfirmation.tsx`
- [X] T036 [US1] Compose the MVP bill-management flow and mutation feedback in `client/src/App.tsx`

**Checkpoint**: US1 is demoable and independently passing: valid bills survive restart, only the targeted bill mutates, paid records no longer expose the paid action, and confirmed deletion permanently removes only the selected record.

---

## Phase 4: User Story 2 - Prioritize and Find Bills (Priority: P1)

**Goal**: Make the list trustworthy through server-authoritative urgency order and inclusive current-month, previous-month, custom-range, all-time, type, and paid filtering.

**Independent Test**: Seed paid, overdue, urgent, normal, and same-due-date bills; apply every supported filter combination and verify inclusive boundaries, AND behavior, deterministic server order, and a recoverable empty result.

### Tests for User Story 2

- [X] T037 [P] [US2] Write status grouping, due-date/id tie-breaker, and mixed-date-filter HTTP 400 unit tests in `server/__tests__/unit/list-selection.test.js`
- [X] T038 [P] [US2] Write real-SQLite month, inclusive-range, type, paid, malformed mixed-date-filter query, and ordered-list integration tests in `server/__tests__/integration/services-list.test.js`
- [X] T039 [P] [US2] Write mocked-transport current-month, custom-calendar, type, empty-state, and localized status UI tests in `client/__tests__/filters-and-list.test.tsx`
- [ ] T040 [P] [US2] Write the independent filtered-list and consumption-entry Chromium journey in `tests/e2e/filter-services.spec.ts`

### Implementation for User Story 2

- [X] T041 [US2] Serialize exactly one contract-supported date-filter mode, prevent mixed modes in the UI, and preserve returned order in `client/src/api/services.api.ts`
- [X] T042 [US2] Implement reusable filtered ordered Service selection for list consumers in `server/services/service.service.js`
- [X] T043 [US2] Delegate validated list query filters and preserve server ordering in `server/routes/services.routes.js`
- [X] T044 [US2] Implement Calendar-in-Popover date presets and Select-based type filtering in `client/src/components/DateFilter.tsx` and `client/src/components/TypeFilter.tsx`
- [X] T045 [US2] Compose active filter state, priority status text/icons, and empty-result recovery in `client/src/components/FilterPanel.tsx`, `client/src/components/ServiceItem.tsx`, and `client/src/App.tsx`

**Checkpoint**: US2 independently returns and renders the documented urgency order for every valid filter selection; range endpoints are included, all filters combine with AND, and an empty list still leaves creation available.

---

## Phase 5: User Story 3 - Receive Controlled Bill Notifications (Priority: P1)

**Goal**: Provide a browser-owned, independent eight-second creation Undo window and best-effort, non-duplicated paid notifications without exposing Telegram configuration.

**Independent Test**: Using fake timers and stubbed Telegram delivery, create with and without a payment date, Undo before expiry, allow expiry once, simulate missing/failed delivery, and repeat a paid update without a duplicate send.

### Tests for User Story 3

- [X] T046 [P] [US3] Write creation and paid message formatting plus false-to-true transition-guard unit tests in `server/__tests__/unit/notification.service.test.js`
- [X] T047 [P] [US3] Write stubbed-Telegram notify, missing-service, missing-credential, delivery-failure, and duplicate-paid integration tests in `server/__tests__/integration/notifications.test.js`
- [X] T048 [P] [US3] Write fake-timer independent-window, cancel, expiry-once, and teardown tests in `client/__tests__/useUndoTimer.test.ts`
- [X] T049 [P] [US3] Write mocked-transport Undo form-restoration and notification-feedback integration tests in `client/__tests__/undo-notifications.test.tsx`
- [ ] T050 [P] [US3] Write the independent creation-Undo Chromium journey in `tests/e2e/undo-creation.spec.ts`

### Implementation for User Story 3

- [X] T051 [US3] Implement server-only, redacted, best-effort Telegram transport in `server/external/telegram.client.js`
- [X] T052 [US3] Implement creation and payment notification formatting and sending without timer ownership in `server/services/notification.service.js`
- [X] T053 [US3] Trigger payment notification only after a successful false-to-true atomic transition in `server/services/service.service.js`
- [X] T054 [US3] Implement application-notify endpoint delegation and no-notification DELETE behavior in `server/routes/services.routes.js`
- [X] T055 [US3] Implement local keyed timers, accessible Undo countdown feedback, restored form values, and toast actions in `client/src/hooks/useUndoTimer.ts`, `client/src/hooks/useToasts.ts`, `client/src/hooks/useServices.ts`, and `client/src/components/UndoToast.tsx`

**Checkpoint**: US3 has no backend creation timer, queue, schedule, or cancellation endpoint. Undo deletes without delivery; natural expiry requests exactly one notification; paid delivery is immediate only on the first false-to-true transition and cannot fail the saved mutation.

---

## Phase 6: User Story 4 - Understand Service Spending and Export Results (Priority: P2)

**Goal**: Show contract-derived consumption periods for a selected type and download a PDF matching the active filtered, ordered bill view.

**Independent Test**: With monthly and bimonthly bills across in/out-of-series periods, null/zero amounts, and mixed paid states, verify exact chronological zero-filled series and average, then export a filtered report that matches the visible selection and handles no data honestly.

### Tests for User Story 4

- [X] T056 [P] [US4] Write monthly/bimonthly period derivation, zero filling, null exclusion, full bimonthly amount, and average unit tests in `server/__tests__/unit/stats.service.test.js`
- [X] T057 [P] [US4] Write shared-selection report fields, counts, filter labels, and valid HTTP 200 empty-result PDF unit tests in `server/__tests__/unit/pdf.service.test.js`
- [X] T058 [P] [US4] Write fresh-SQLite statistics and binary-PDF contract integration tests, including valid HTTP 200 empty exports, in `server/__tests__/integration/stats-export.test.js`
- [ ] T059 [P] [US4] Write mocked-transport chart visibility, period labeling, average, export query, download, and localized empty-report success-feedback UI tests in `client/__tests__/stats-export.test.tsx`
- [ ] T060 [P] [US4] Write independent type-filtered chart and filtered-PDF Chromium journeys in `tests/e2e/stats-export.spec.ts`

### Implementation for User Story 4

- [X] T061 [US4] Implement server-local, series-first billing-period aggregation without durable periods in `server/services/stats.service.js`
- [X] T062 [US4] Implement binary PDF rendering from the reusable filtered ordered selection, including filter context, zero counts, no rows, and an explicit no-data statement for a valid empty result, in `server/services/pdf.service.js`
- [X] T063 [US4] Implement static statistics and PDF route handlers before parameterized service-ID routes in `server/routes/stats.routes.js`, `server/routes/export.routes.js`, and `server/app.js`
- [ ] T064 [US4] Implement typed statistics/export fetches, selected-type state, localized period formatting, chart display, and filtered download actions in `client/src/api/stats.api.ts`, `client/src/api/export.api.ts`, `client/src/hooks/useConsumptionStats.ts`, `client/src/components/ConsumptionByPeriodChart.tsx`, and `client/src/App.tsx`

**Checkpoint**: US4 returns exactly the requested server-anchored periods regardless of list filters or paid state, shows no chart for All types, and exports the same active filtered order with accurate status and paid/pending counts.

---

## Phase 7: User Story 5 - Use the Application Reliably and Inclusively (Priority: P1)

**Goal**: Make primary flows safe and operable at supported viewport sizes with localized accessible feedback, reduced-motion support, controlled operational failures, CORS protection, and no secret exposure.

**Independent Test**: At 768px and 1024px, a keyboard-only user completes bill actions, filters, export, and deletion confirmation under reduced motion; controlled persistence, network, and notification failures remain actionable without data corruption or sensitive output.

### Tests for User Story 5

- [ ] T065 [P] [US5] Write CORS, required-config, unavailable-database, redacted-error, and structured-operational-log integration tests in `server/__tests__/integration/operational-safety.test.js`
- [ ] T066 [P] [US5] Write localized accessible-name, live-feedback, focus, touch-target, responsive, and reduced-motion component tests in `client/__tests__/accessibility-and-responsiveness.test.tsx`
- [ ] T067 [P] [US5] Write keyboard-only 768px/1024px and reduced-motion Chromium checks in `tests/e2e/accessibility.spec.ts`

### Implementation for User Story 5

- [ ] T068 [US5] Apply configured CORS, startup/shutdown records, and safe unexpected-error translation in `server/app.js`, `server/server.js`, `server/config/env.js`, and `server/utils/logger.js`
- [ ] T073 [US5] Apply localized labels, error associations, live regions, responsive layout, and motion-safe composition across primary flows in `client/src/App.tsx`

**Checkpoint**: US5 completes the listed primary flows without keyboard traps, unlabeled controls, horizontal scrolling at supported widths, client-visible Telegram credentials, raw server details, or loss of a successfully persisted bill when a notification fails.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Assemble the workstreams, verify release gates, and record reproducible readiness evidence without expanding product scope.

- [ ] T074 [P] Add isolated E2E data-reset and test-server helpers in `tests/helpers/test-environment.ts`
- [ ] T075 [P] Add list, statistics, and PDF target timing measurements for 1,000 Services in `tests/e2e/performance.spec.ts`
- [ ] T076 [P] Add browser secret-absence and ignored-file hygiene checks in `client/__tests__/secret-boundary.test.ts` and `.gitignore`
- [ ] T077 Reconcile root E2E startup, data reset, and test-port behavior in `playwright.config.ts` and `package.json`
- [ ] T078 Run server unit, integration, lint, and aggregate validation from `server/package.json`
- [ ] T079 Run client unit, lint, and production-build validation from `client/package.json`
- [ ] T080 Run the isolated Chromium critical-journey suite from `package.json`
- [ ] T081 Verify documented installation, runtime configuration, test isolation, and release commands in `specs/001-complete-production-readiness/quickstart.md`
- [ ] T082 Record final contract, architecture, accessibility, security, performance, and clean-tree release evidence in `specs/001-complete-production-readiness/quickstart.md`

**Checkpoint**: Release is blocked until all package checks, seven independently reset Chromium journeys, operational checks, accessibility/responsive evidence, performance targets, and secret/data hygiene checks pass. Do not change `docs/api-contract.md` during this assembly.

---

## Dependencies & Execution Order

### Hard dependencies

1. Phase 1 is hard-blocking: the Integration owner serializes `package.json`, all lockfiles, `.env.example`, `.gitignore`, and `playwright.config.ts`.
2. Phase 2 is hard-blocking for backend feature work: configuration, fresh test support, schema/migration, repository, and shared domain rules must be stable before feature routes and services. Phase 2B is hard-blocking for frontend feature-component work.
3. Phase 2B may begin after T005 in parallel with Phase 2. T025 and T069–T071 may proceed in parallel; T072 follows T069–T070. Core UI composition must use this platform rather than create duplicate primitives, locale setup, theme values, or feedback surfaces.
4. US1 requires Phase 2; its frontend components also require Phase 2B. US1 is the hard prerequisite for US3 because notifications rely on create, update, and delete semantics.
5. US2 requires Phase 2 and is a hard prerequisite for US4 because statistics/export reuse the validated filtered, ordered selection and active filter state.
6. US4 route wiring requires US1 application construction and must register its static routes before the parameterized `/:id` routes.
7. US5 reliability implementation can begin after the relevant backend or Phase 2B foundations, but its full verification depends on the implemented primary flows of US1–US4.
8. Phase 8 requires all selected stories to have passed their own checkpoints; its shared runner and Playwright hotspot work is serialized through Integration and QA/Security.

### Soft dependencies and permissible parallelism

After T005, Frontend/UI establishes Phase 2B in a dedicated worktree while Database/Data and Backend/API complete Phase 2. US1 frontend components begin only after Phase 2B and may use frozen-contract mocks while backend core proceeds. US2 server selection work and its client filter controls may proceed in parallel after US1’s contract-facing list seam is stable. After US1, US3 backend transport/formatting and browser timer tests may proceed separately, then converge only at the shared `useServices.ts` and `services.routes.js` files. After US2, US4 server statistics/PDF work and client chart/download work may proceed separately, then converge at `server/app.js` and `client/src/App.tsx`. QA may write `[P]` tests against fixtures and mocked transport while implementation owners work in their owned worktrees.

### User-story dependency table

| Story | Hard prerequisite | Soft collaboration | Independently releasable outcome |
|---|---|---|---|
| US1 Manage Household Bills | Phase 2 | Frontend mocks may precede live backend | Durable CRUD bill manager |
| US2 Prioritize and Find Bills | Phase 2 and stable US1 list seam | Filter UI and backend selection | Trustworthy filtered urgency list |
| US3 Receive Controlled Bill Notifications | US1 mutation semantics | Timer UI and server delivery implementation | Controlled local Undo and best-effort notices |
| US4 Understand Service Spending and Export Results | US2 selection/filter semantics and US1 app wiring | Server reporting and client visualization | Consumption insight and matching report |
| US5 Use the Application Reliably and Inclusively | Phase 2; complete-flow proof waits for US1–US4 | Can harden shared seams during feature work | Accessible, safe release behavior |

### Merge-hotspot ownership

Integration alone coordinates `package.json`, `package-lock.json`, `server/package.json`, `server/package-lock.json`, `client/package.json`, `client/package-lock.json`, `.env.example`, and `.gitignore`. Database/Data alone changes `server/db/schema.js`, `server/repositories/service.repository.js`, and `server/__tests__/helpers/test-support.js`. Backend/API serializes every `server/app.js` and route-registration edit. Frontend/UI serializes every `client/src/App.tsx`, `client/src/styles/globals.css`, `client/src/locales/en.json`, and `client/src/components/ui/` edit. QA/Security and Integration serialize `playwright.config.ts` and root E2E startup/reset changes.

## Concrete Parallel Examples

### Phase 2 foundation worktrees

```text
Database/Data worktree: T010, T011, T012, T013, T014
Backend/API worktree: T009, T015, T016, T017, T018, T019
```

Merge the Database/Data interface before Backend/API starts repository-backed service work.

### Frontend platform and US1 worktrees

```text
Frontend platform worktree: T025, T069, T070, T071, T072
Backend test worktree: T020 and T021
Frontend test worktree: T022 and T023
QA worktree: T024
```

After the platform and tests establish the expected behavior, serialize T026–T036 where they touch the same API, route, and App entrypoint files.

### US3 split ownership

```text
Backend notification worktree: T046, T047, T051, T052
Frontend timer worktree: T048, T049
QA worktree: T050
```

Coordinate T053–T055 as a single integration sequence because they modify shared mutation and hook paths.

### US4 split ownership

```text
Backend reporting worktree: T056, T057, T058, T061, T062
Frontend reporting worktree: T059, T064
QA worktree: T060
```

The Backend/API owner performs T063 last so `/stats/type/:type` and `/export/pdf` are mounted before `/:id`.

## Implementation Strategy

### MVP first

Complete Phases 1, 2, and 2B, then complete and independently validate US1 through T036. This is the smallest deployable increment: durable bill management with tested error handling and no unimplemented notification behavior implied to users.

### Incremental delivery

Add US2 for reliable prioritization and filtering, then US3 for controlled notifications. Add US4 only after the reusable filter/ordering seam is proven. Apply US5 throughout where it protects an active seam, then complete its full-flow proof and the Phase 8 release gate after all product increments merge.

### Task validation

There are 82 unchecked tasks with continuous IDs T001 through T082. Setup, Foundational, Frontend Platform, and Polish tasks have no user-story label; every remaining story task has exactly one `[US1]` through `[US5]` label. Every task includes at least one exact planned path, and `[P]` appears only on independently ownable work.
