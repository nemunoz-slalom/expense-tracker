# Research: Complete Production Readiness

This research resolves the implementation choices needed to build the documented MVP while preserving the frozen API contract. Authoritative behavior remains in `docs/api-contract.md`; this file records implementation decisions, not competing API rules.

## Architecture and package boundary

**Decision**: Use separate `server/` and `client/` packages with root-level Playwright orchestration.

**Rationale**: The constitution and architecture prescribe separate Node.js/CommonJS backend and React/TypeScript frontend layers. Separate packages keep server-only Telegram credentials and SQLite dependencies out of browser artifacts, while root E2E configuration can start both applications on fixed test ports.

**Alternatives considered**:
- A single full-stack package: rejected because it weakens server/client dependency and secret boundaries.
- A monorepo workspace with additional shared domain package: rejected for MVP because contract-aligned frontend types and backend plain objects avoid a new shared-package release/ownership burden.

## SQLite representation and database access

**Decision**: Store one `services` table, initialize it idempotently, use parameterized repository queries, and run real SQLite integration tests against a distinct `services.test.db`.

**Rationale**: Service is the sole durable entity. SQLite meets the local-first product requirement, and a repository boundary supports atomic CRUD, test isolation, and no SQL in routes/services. Date-only values remain canonical `YYYY-MM-DD` text, allowing lexicographic range comparisons only after strict real-calendar validation.

**Alternatives considered**:
- ORM: rejected because the documented repository pattern and small schema favor transparent parameterized SQL.
- In-memory-only persistence: rejected because restart durability is mandatory.
- Persisting status or billing periods: rejected because the frozen contract declares both derived and non-persisted.

## Date, status, sort, and filter semantics

**Decision**: Centralize date-only validation and server-local date calculations in pure backend utilities; calculate status and sort at response/selection time.

**Rationale**: The contract makes server-local time authoritative for status, paid transition, and period anchoring. A single utility avoids divergent leap-year, timezone, range-boundary, and urgency logic among routes, services, PDF export, and statistics. The server returns a fresh status, so stale persisted classifications cannot occur.

**Alternatives considered**:
- Browser-calculated status: rejected because server-local time is contractually authoritative and API consumers need a consistent value.
- JavaScript `Date` parsing alone: rejected because it can silently normalize invalid dates or introduce timezone shifts for date-only values.
- Sorting only in SQL with a stored status: rejected because status changes with today and belongs to domain behavior.

## Notifications and Undo

**Decision**: Put all eight-second timer handles in `client/src/hooks/useUndoTimer.ts`; implement a server notification service that only formats/sends a message when explicitly invoked or after the specified paid transition.

**Rationale**: This is an explicit constitutional rule and contract freeze condition. A local hook permits multiple independent windows, deterministic fake-timer tests, cleanup on unmount, and delete-before-notify behavior. The server remains stateless regarding creation countdowns.

**Alternatives considered**:
- Queue, cron, or persisted notification jobs: rejected because persistent notification jobs and server scheduling are out of scope.
- Server `setTimeout`: rejected by the constitution and fails on restart/multi-process deployment.
- Direct Telegram call from the browser: rejected because credentials must remain server-only.

## Statistics computation

**Decision**: Generate the requested calendar period series from server-local current month first, then aggregate eligible stored Services into their derived period.

**Rationale**: The contract requires exactly N chronological periods even with no records, and says the anchor must not depend on records. A series-first algorithm naturally produces zero entries and computes average over all returned periods. Bimonthly values remain a single full amount.

**Alternatives considered**:
- Grouping only existing database rows: rejected because it omits zero periods and creates variable-length output.
- Persisted reporting period: rejected by the contract.
- Prorating two-month bills: rejected by explicit product behavior.

## PDF generation

**Decision**: Keep PDF rendering server-side in `pdf.service.js` and feed it the same reusable filtered, sorted Service selection used by list behavior.

**Rationale**: The browser receives the contractually required binary response, and shared selection eliminates visible-list/report drift. Server generation centralizes title, filter label, table and paid/pending count rules.

**Alternatives considered**:
- Client-only PDF generation: rejected because export is an API binary endpoint in the frozen contract.
- A reporting table or report cache: rejected because data volume is limited and it would introduce unnecessary persistence and invalidation.

## Frontend composition and accessibility

**Decision**: Compose feature components from project-owned shadcn/ui primitives, Tailwind token classes, react-i18next keys, and Framer Motion with reduced-motion support.

**Rationale**: This satisfies the constitution's sole-component-library requirement and yields built-in semantic patterns for dialogs, selects, popovers, progress, and toasts. The locale catalog includes visual and accessible text so neither can drift from localization.

**Alternatives considered**:
- Native date input: rejected explicitly; date selection must use Calendar within Popover.
- A second UI library: rejected by the constitution.
- Hardcoded English JSX: rejected because all user-visible and accessible text must be localizable.

## Testing and operational controls

**Decision**: Use Jest unit/integration tests, React Testing Library with mocked API transport, and a seven-journey Chromium Playwright suite using Page Objects; validate required startup config and redact operational logs.

**Rationale**: This matches the mandatory test architecture and limits E2E to the user-critical paths. A real test SQLite store covers actual query behavior; stubbing Telegram gives deterministic failure and delivery tests. Structured redacted logs preserve operator visibility without secret/bill data exposure.

**Alternatives considered**:
- Mocking SQLite in backend integration tests: rejected because repository SQL needs real coverage.
- Calling Telegram in tests: rejected for safety and repeatability.
- Broad browser matrix: rejected by the documented Chromium-only E2E budget.
- Authentication as a security control: rejected because local single-user MVP explicitly excludes it; deployment/CORS/input/secret controls apply instead.
