# Testing Guidelines

## Purpose

The project should have a testing strategy that catches regressions early, documents expected behavior, and gives contributors confidence when changing code. Tests should describe user-visible behavior and API contracts rather than internal implementation details, so they remain useful as the codebase evolves. The project uses distinct test levels—unit, integration, and end-to-end—each with its own scope, cost, and purpose.

## Unit Tests

Unit tests verify the behavior of a single function, module, or component in isolation. They should be fast, deterministic, and independent of external systems such as the database, the network, or the file system. When a unit under test depends on such a system, replace that dependency with a test double so the test focuses on the unit's own logic.

Write unit tests for pure functions (validation, sorting, status calculation, date formatting, filter logic), for individual React components (rendering, prop handling, event dispatch), and for backend helpers (message formatting, query builders). Prefer testing the observable output of a function or component given specific inputs rather than asserting on how it produced that output.

Each unit test should have a single clear assertion focus and a descriptive name that reads as a specification (for example, `sorts overdue bills before urgent bills`). Group related tests into `describe` blocks by unit and keep individual tests short. Avoid sharing mutable state between unit tests; each test should set up and tear down its own data.

The frontend uses Jest with React Testing Library; the backend uses Jest. Aim for high coverage of critical logic (sorting, validation, filtering, notification triggering) without chasing 100% coverage on trivial code paths.

## Integration Tests

Integration tests verify that several units work correctly together. On the backend, they typically exercise a route handler together with the database and the request-parsing middleware; on the frontend, they exercise a component together with its child components, hooks, and any state management involved in a user flow.

Backend integration tests should use a real SQLite database instance (created fresh for each test file or suite) rather than mocking the database layer, because the queries themselves are part of what integration tests should cover. Wrap each test or suite in setup and teardown that creates the schema, seeds any required data, and removes the database file afterward. External services such as the Telegram Bot API must be stubbed at the HTTP-client layer; never call the real Telegram API from a test.

Frontend integration tests should render a component tree with real child components, drive it through user interactions using React Testing Library queries (`getByRole`, `getByLabelText`), and assert on the resulting DOM or emitted callbacks. Stub the network layer (for example, using `msw` or a fetch mock) rather than replacing the component's data-fetching hook, so the test exercises the same code path as production.

Integration tests are slower than unit tests but faster than end-to-end tests; use them to cover flows where the interaction between units matters (for example: `POST /api/services creates a row; a due-date filter change refetches the bill list; and a type filter updates the billing-period chart).

## End-to-End (E2E) Tests
End-to-end tests exercise the full application from the user's perspective: a real browser drives a running frontend that communicates with a running backend and database. Because they are the slowest and most brittle test level, keep the E2E suite small and focused on the critical user journeys that would cause the most user harm if broken.

**Limit the E2E suite to 5–8 critical user journeys.** Suggested journeys for this app:

1. Create a bill and see it appear in the sorted list.
2. Undo the creation of a bill within the frontend-owned 8-second Undo window and verify the bill is deleted and no notification is sent.
3. Mark an existing bill as paid and verify the badge changes.
4. Edit a bill and confirm the updated values persist and re-sort correctly.
5. Delete a bill after confirming in the dialog.
6. Filter bills by service type and confirm the consumption-by-billing-period chart appears.
7. Export the current filtered view to PDF and confirm the file downloads.

Anything narrower (a specific validation error, a specific button style, a specific animation timing) belongs in a unit or integration test, not the E2E suite.

### Playwright Configuration

The project uses Playwright for E2E tests. **Playwright tests must use one browser only** (Chromium) to keep the suite fast and avoid maintaining browser-specific selectors or workarounds. Add other browsers only if a real cross-browser bug motivates it.

Configure the test runner to start the frontend and backend automatically (via `webServer` in `playwright.config.ts`) so tests do not depend on the developer remembering to start each process. Use fixed, non-conflicting ports (see Port Configuration below).

### Page Object Model (POM) Pattern

**Playwright tests must use the Page Object Model pattern for maintainability.** Each page or major UI region in the app has a corresponding page object class that encapsulates its locators and its user-facing actions. Tests import these page objects and call their methods, rather than referring to selectors directly.

A page object should:

- Expose locators as private or protected fields, not to the test.
- Expose user-facing actions as methods (`createBill(name, type, ...)`, `markAsPaid(billName)`, `openEditModal(billName)`).
- Return either `void`, a new page object (for navigation), or a data value (for reads), never a raw `Locator`.
- Not contain assertions; keep assertions in the test file so failures point at what the test expected, not what the page object did.

Store page objects under a `tests/pages/` directory, one file per page or region (`BillListPage.ts`, `BillFormPage.ts`, `DeleteConfirmationPage.ts`, `FilterPanelPage.ts`). When a selector changes, update it in one place.

### Test Isolation

**All tests must be isolated and independent.** No test should depend on another test having run first, and running any single test in isolation should produce the same result as running the whole suite. Avoid shared mutable state, ordered test dependencies, and reliance on data created by earlier tests.

For E2E tests, reset the backend database between tests (or between test files, if per-test reset is too slow). For integration and unit tests, use `beforeEach` and `afterEach` hooks to establish and clean up state.

### Setup and Teardown Hooks

**Setup and teardown hooks are required** for any test that touches shared state. Use `beforeEach` for per-test setup (fresh database, fresh browser context, fresh component render) and `afterEach` for cleanup (delete database file, close browser context). Use `beforeAll` and `afterAll` for expensive one-time setup that can safely be shared (starting the test server, seeding immutable reference data).

Never rely on test-file execution order or on state leaked from a previous test. If a test needs a bill to exist, it should create that bill in its setup or use a factory helper, not assume a prior test left one behind.

## Port Configuration

To avoid conflicts with the development environment and between test runs, the project uses distinct, fixed ports for each context:

| Context | Frontend | Backend |
|---------|----------|---------|
| Development | 3000 | 5000 |
| Test (integration + E2E) | 3001 | 5001 |

Test configuration (Playwright's `webServer`, backend test setup) shall start each process on its test port. Tests shall connect to `http://localhost:3001` for the frontend and `http://localhost:5001` for the backend, driven by an environment variable (`TEST_FRONTEND_URL`, `TEST_BACKEND_URL`) so the ports can be changed in one place if needed.

The test database shall live in a separate file (`services.test.db`, configured through `DATABASE_PATH`) so test runs never touch development data.

## Feature Changes and Test Coverage

**All new features shall include appropriate tests before merging.** "Appropriate" means:

- **Pure logic (validation, sorting, formatting):** at least one unit test per meaningful behavior.
- **API endpoint or React component with meaningful interactions:** at least one integration test covering the primary success path plus at least one error path.
- **Critical user journey (something a real user would notice if it broke):** consider whether the E2E suite should cover it, and add a Playwright test only if it fits within the 5–8 journey budget.

A pull request that adds behavior without adding tests should explain in the description why tests were not warranted. A change that fixes a bug should include a test that would have caught the bug.

## Maintainability and Best Practices

Tests are code and follow the project's coding guidelines: consistent formatting, descriptive names, small focused functions, no duplication of business rules or selectors. Prefer helper factories (`createBillFixture({...overrides})`) over copy-pasted setup blocks. Keep test names descriptive enough that a failure message identifies the broken behavior without reading the test body.

Avoid testing implementation details—internal function names, private state, exact DOM structure—that will change without changing user-visible behavior. Assert on rendered text, ARIA roles, API response bodies, and other stable contracts. When a test is flaky, fix the underlying cause (a race condition, a timing assumption, an ordering dependency); do not add retries or arbitrary waits to mask the problem.

Keep the test suite fast enough to run frequently. Slow unit tests point at a design problem: too many dependencies, too much setup, or an integration test masquerading as a unit test. Move it to the right level and simplify.

Update tests when the behavior they describe intentionally changes. Delete tests for behavior that no longer exists. A test that always passes because its assertions are trivial provides false confidence and should be removed or fixed.

A change is ready for review when its tests pass locally, cover the behavior it introduces or modifies, do not depend on other tests or on ambient state, and use the project's established patterns (POM for E2E, factories for setup, mocks for external services).

## Required Test Coverage

The following behaviors are mandatory coverage. They encode decisions that are
easy to regress, so each one MUST have at least one automated test.

### Creation Undo timer (frontend-owned)

1. Frontend fake-timer test: creating a bill with a `paymentDate` starts a local 8-second timer.
2. Clicking Undo cancels the local timer and issues `DELETE /api/services/:id`; no notification request is made.
3. When the timer expires without cancellation, the frontend calls `POST /api/services/:id/notify` exactly once.
4. Creating a bill **without** a `paymentDate` starts no timer, shows no Undo affordance, and issues no `/notify` call.
5. Backend test: `POST /api/services` and `DELETE /api/services/:id` send no Telegram message and hold no timer handle.

### Mark as paid

6. A `false → true` paid transition sends the Telegram notification immediately, with no Undo window.
7. Repeated PATCH requests with `paid: true` on an already-paid bill send no duplicate notification.

### Consumption by billing period

8. Billing-period derivation for monthly services: `dueDate 2026-03-10` for internet, mobile, or water yields period identifier `2026-02`.
9. Billing-period derivation for bimonthly services: `dueDate 2026-03-10` for electricity or gas yields period identifier `2026-01..2026-02`.
10. A bimonthly bill contributes its full amount to one period; the amount is never prorated or split.
11. Both paid and unpaid bills with a non-null `amount` are included; null-amount bills are excluded.
12. Statistics are independent of `paymentDate`, of `paid`, and of the bill list's due-date filter.
13. Periods with no matching bills are returned with `amount: 0` rather than omitted.
14. The average is computed across all returned periods, counting zero-value periods in the denominator.
15. `periods` defaults to 6, accepts 1–12, and rejects values outside that range.
16. The series is anchored to the server-local current month and returns exactly N periods, oldest to newest, even when no bills match.

### UI primitives

17. Date selection renders a shadcn/ui `Calendar` inside a `Popover`; no native `<input type="date">` exists in the rendered output.

---

**Version:** 1.1  
**Status:** Testing Guidelines Complete  
**Last Updated:** September 2026
