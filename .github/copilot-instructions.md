# Copilot Instructions for expense-tracker

This repository contains specifications, architecture documentation, and workflow templates for an expense tracker (Services App) — a personal utility bill manager with Telegram notifications, consumption-by-billing-period analytics, and PDF export.

## Project Overview

**What it is:** A React frontend + Node.js backend application for managing utility bills (electricity, gas, internet, mobile, water) with automatic Telegram notifications, due-date sorting, filtering, charts, and PDF export.

**Important:** This repository is primarily a documentation and planning repository using `.specify` workflow scaffolding. The actual implementation (Node.js backend, React frontend) will be in separate directories or repositories referenced by the functional specs, API contract, and architecture documentation.

## Documentation Structure

- **`docs/spec.md`** — Complete functional requirements (FR-1 through FR-16). Start here for "what should the app do?"
- **`docs/architecture.md`** — Layered architecture for both frontend and backend. Defines dependency direction, module responsibilities, and folder structure. **Read this before proposing structural changes.**
- **`docs/api-contract.md`** — HTTP API endpoints, request/response schemas, and status codes. The single source of truth for frontend-backend communication.
- **`docs/coding-guidelines.md`** — Formatting, imports, module patterns, testing practices, UI composition rules. Applies to implementation PRs.
- **`docs/testing-guidelines.md`** — Testing strategy: unit tests (Jest), integration tests (backend with real SQLite, frontend with React Testing Library), E2E tests (Playwright with Page Object Model). Defines coverage expectations and test isolation rules.
- **`docs/ui-guidelines.md`** — Color palette, typography, component library (shadcn/ui), and Framer Motion animations.
- **`.specify/memory/constitution.md`** — The ratified project constitution (v1.0.0, ratified 2026-09-03). It is authoritative for project governance and architectural principles and MUST NOT be overridden by lower-level guidance. If any document in this repository contradicts it, correct that document rather than reinterpreting the constitution.

## Build, Test, and Lint Commands

When implementation code is added, the following commands should exist and be used in PR validation:

### Backend (Node.js Express)

```bash
# Install dependencies
npm install

# Unit tests (Jest)
npm run test:unit

# Integration tests (with real SQLite)
npm run test:integration

# All tests
npm run test

# Lint
npm run lint

# Build/start development server
npm start
```

### Frontend (React + TypeScript)

```bash
# Install dependencies
npm install

# Unit tests (Jest + React Testing Library)
npm run test:unit

# Linting via Create React App
npm run lint

# Build
npm run build

# Start development server
npm start
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests (Chromium only)
npm run test:e2e

# Run a single E2E test
npm run test:e2e -- tests/example.spec.ts

# Run with UI mode (interactive debugging)
npm run test:e2e -- --ui
```

**Port Configuration (fixed, non-conflicting):**
- Development: Frontend 3000, Backend 5000
- Testing: Frontend 3001, Backend 5001
- Test database: `services.test.db` (separate from dev database)

## High-Level Architecture

### Layered Design (Backend and Frontend)

The project follows a **4-layer architecture** on both backend and frontend:

#### Backend Layers (Node.js Express)
1. **Routes** (`server/routes/`) — HTTP parsing, validation, status codes. No business logic.
2. **Services** (`server/services/`) — Business rules, coordination, Telegram notifications. No SQL, no HTTP.
3. **Repositories** (`server/repositories/`) — Data access only. Parameterized SQL, typed methods (`findAll`, `create`, `update`, `delete`). No business logic.
4. **External Services** (`server/external/`) — Telegram Bot API wrapper. Isolated and testable.

**Dependency direction:** Routes → Services → (Repositories, External Services) → Database. Never reverse.

#### Frontend Layers (React + TypeScript)
1. **Components** (`client/src/components/`) — UI rendering, user events. No direct fetch calls.
   - **`client/src/components/ui/`** — shadcn/ui primitives (installed via CLI, project-owned).
   - **`client/src/components/*.tsx`** — Feature components composing UI primitives.
2. **Hooks** (`client/src/hooks/`) — State, data fetching coordination, actions. Uses API service layer.
3. **API Services** (`client/src/api/`) — Only place calling `fetch`. Typed request/response. Throws typed errors.
4. **Types** (`client/src/types/`) — TypeScript domain models. No dependencies.

**Dependency direction:** Components → Hooks → API Services → Backend. Types used everywhere, depend on nothing.

### Data Flow Examples

**Backend: Create a Bill (no notification)**
```
POST /api/services
  → routes/services.routes.js (validate body)
    → services/service.service.js (business rules)
      → repositories/service.repository.js (INSERT)
    → res.status(201).json(...)
```

**Creation notification (frontend-owned 8s timer)**
```
Frontend receives 201, starts local 8s timer (only if paymentDate provided)
  ├─ Undo clicked → cancel local timer → DELETE /api/services/:id (no Telegram)
  └─ timer expires → POST /api/services/:id/notify
       → routes/services.routes.js
         → notification.service.js (format message)
           → external/telegram.client.js (send)
         → res.status(204).end()
```

**Frontend: Mark as Paid**
```
User clicks "Mark as Paid"
  → useServices().markAsPaid(id) hook
    → servicesApi.updateService(id, {paid: true}) (PATCH)
      → Backend receives, processes, returns updated service
    → Hook refetches list, triggers success toast
  → ServiceList re-renders
```

### Key Modules

**Backend:**
- `server/db/` — SQLite init, schema, connection factory
- `server/config/` — Environment validation
- `server/app.js` — Express construction (no HTTP listen, testable)
- `server/server.js` — Process entry point (starts HTTP listener)

**Frontend:**
- `client/src/locales/` — i18n JSON files (react-i18next)
- `client/src/styles/` — Global CSS, Tailwind config, color palette
- `client/src/config/` — Runtime config from `REACT_APP_*` env vars
- `client/src/App.tsx` — Root component

**Testing:**
- Backend: `server/__tests__/` (unit + integration with real SQLite)
- Frontend: `client/__tests__/` (Jest + React Testing Library)
- E2E: `tests/e2e/` (Playwright, Page Object Model in `tests/pages/`)

## Key Conventions

### 1. Dependency Direction is Strict

A violation is a design smell, not a style choice.

```
Backend: routes → services → repositories → db (external ⊥ services)
Frontend: components → hooks → api → backend (types ⊤ all)
```

Route handlers do not query databases. Components do not call `fetch`. Repositories do not contain business rules. External services are isolated and testable.

### 2. Module Exports and Error Handling

**Backend (CommonJS):**
- Use `module.exports` and `require()`.
- Repositories return plain objects, not raw database rows.
- Services return domain objects and throw typed errors; routes translate these to HTTP status codes.
- External services handle errors gracefully (log, do not throw upstream unless the operation itself failed).

**Frontend (ES modules):**
- Use `import` / `export`.
- API services throw typed errors; hooks catch them and manage error state.
- Components never import route files or call `fetch` directly.

### 3. Database and SQL

- **Single source of truth:** SQLite (dev database at `services.db`, test database at `services.test.db`).
- **Parameterized statements exclusively.** Never interpolate user input into SQL.
- **Repository pattern:** All SQL lives in `server/repositories/`. Services call methods like `findAll()`, `findById(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `findByFilters(filters)`.
- **Atomic transactions:** CRUD operations are all-or-nothing.

### 4. HTTP Contracts and Validation

- **API Contract:** `docs/api-contract.md` is the single source of truth. Both frontend and backend must comply.
- **Request validation:** Route handlers validate shape and required fields first (400 on failure) before calling services.
- **Status codes:** 200/201 (success), 204 (no content), 400 (client error), 404 (not found), 500 (server error).
- **Error responses:** Consistent JSON format (`{ error, message }`).

### 5. Notification Timing (8-Second Undo Window)

The **frontend** owns the 8-second creation Undo timer. The backend never creates, owns, persists, schedules, or cancels it.

- **On bill creation:** `POST /api/services` saves the bill immediately and sends no notification. If `paymentDate` was supplied, the frontend starts a local 8-second timer after the successful response.
- **Within 8 seconds:** User clicks "Undo"; the frontend cancels its local timer and calls `DELETE /api/services/:id`. DELETE sends no Telegram message.
- **After 8 seconds:** The frontend calls `POST /api/services/:id/notify` and the backend sends the Telegram message.
- **No `paymentDate` at creation:** no timer, no Undo UI, no creation notification.
- **On mark as paid:** Immediate Telegram notification (no undo window).

The backend `notificationService` sends messages only; it MUST NOT hold 8-second timer handles.

### 6. UI Composition and Styling

- **Component Library:** shadcn/ui only. No parallel libraries (Chakra, MUI, etc.).
- **Date selection:** shadcn/ui `Calendar` inside a `Popover`. Native `<input type="date">` is forbidden. Type selection uses `Select`, destructive deletion uses `AlertDialog`, Undo feedback uses the Sonner toast pattern, and the countdown uses `Progress`. Semantic HTML is fine for document structure, but interactive controls must use shadcn/ui primitives.
- **Styling:** Tailwind CSS. Global tokens (color palette) as CSS variables in `client/src/styles/`.
- **Color Palette (fixed dark theme):**
  ```
  Background: #282a36
  Surface: #44475a
  Primary text: #f8f8f2
  Secondary text: #6272a4
  Accent: #8be9fd
  Status: Overdue #ff5555, Urgent #f1fa8c, Normal #8be9fd, Paid #50fa7b
  ```
- **All user text:** From i18n keys via `react-i18next` (`t('key')`). Never hardcoded in JSX.
- **Animations:** Framer Motion for smooth entrance/exit and interactions. Respect `prefers-reduced-motion`.

### 7. Sorting and Filtering

**Sorting (FR-3):** Bills sorted by urgency group, then by due date, then by ID as tiebreaker.
- **Overdue** (due < today): Red badge (🔴)
- **Due Soon** (today ≤ due ≤ today + 7): Yellow badge (🟡)
- **Normal** (due > today + 7): Gray badge (⚪)
- **Paid** (always last): Green badge (✅)

**Filtering:**
- **Date filter:** 4 presets (This month [default], Last month, Custom range, All time) filtering on `dueDate`. Custom range uses a shadcn/ui `Calendar` in a `Popover` (never a native `<input type="date">`).
- **Type filter:** Dropdown (All, Electricity, Gas, Internet, Mobile, Water).
- **Consumption chart:** Appears only when the type filter is applied. `GET /api/services/stats/type/:type?periods=6`. Billing periods are derived from `dueDate` + service frequency (electricity/gas bimonthly, internet/mobile/water monthly); `periodEnd` is the calendar month before the `dueDate` month. Includes paid and unpaid bills with a non-null `amount`; `paymentDate` and `paid` do not affect it. Zero-value periods are included, and the average spans all returned periods including zeros. Bimonthly amounts are never prorated.

### 8. Testing Strategy

**Unit tests:**
- Pure functions: validation, sorting, status calculation, date formatting.
- Individual components and hooks in isolation (with mocked dependencies).
- Jest + React Testing Library (frontend), Jest (backend).

**Integration tests:**
- Backend: Route + Service + Repository + real SQLite (per-test fresh DB).
- Frontend: Component + Hook + mocked API layer.
- Backend external services (Telegram) stubbed at HTTP layer; never call real API.

**E2E tests (Playwright, Chromium only):**
- **Budget: 5–8 critical user journeys.** Examples:
  1. Create a bill, see it in sorted list
  2. Undo creation within 8-second window
  3. Mark as paid, badge updates
  4. Edit and re-sort
  5. Delete with confirmation
  6. Filter by type, chart appears
  7. Export to PDF
- **Page Object Model (POM):** Each page has a class under `tests/pages/` with private locators and public action methods.
- **Isolation:** Tests independent, database reset between runs, no test ordering dependency.

### 9. Formatting and Code Style

- **Indentation:** 2 spaces (both backend and frontend).
- **Quotes:** Single quotes (`'`) in JS/TS.
- **Semicolons:** Yes.
- **Imports:** Group external packages before local modules. Remove unused imports.
- **Comments:** Sparingly. Clarify intent, constraints, non-obvious decisions. Prefer renaming/restructuring over commenting confusing code.
- **TypeScript:** Explicit types on function signatures and exports; inference for local variables. Avoid `any`; document when unavoidable.
- **ESLint:** Frontend uses Create React App ESLint config. No broad rule suppressions; use inline `eslint-disable-next-line RULE` with explanation.

### 10. Testing Utilities and Fixtures

- **Backend:** Test doubles for external services (Telegram); real SQLite for integration tests.
- **Frontend:** `msw` or fetch mock for API layer; React Testing Library queries (`getByRole`, `getByLabelText`).
- **Factories:** `createBillFixture({...overrides})` pattern for setup; avoid copy-pasted test data.

### 11. Changes to Architecture or Contracts

- **API Contract changes:** Update `docs/api-contract.md` and all tests that depend on it before merging.
- **Structural changes** (new layer, new module responsibility): Document in `docs/architecture.md` and explain rationale.
- **Coding convention changes:** Update `docs/coding-guidelines.md` so future PRs follow the new standard.

### 12. Telegram Notifications

- **Configuration:** Bot token and chat ID read from environment variables.
- **Failures:** Logged but do not block the user action (bill creation/update succeeds even if Telegram fails).
- **Messages:**
  - On creation (after 8s): "Service Name (Type) $Amount created"
  - On mark as paid: "Service Name (Type) $Amount paid on Sep 15"

## When to Check the Docs

- **Adding a route or endpoint?** Check `docs/api-contract.md` first.
- **Changing data models?** Sync with `docs/api-contract.md` and repository interfaces.
- **Adding a component or hook?** Ensure it fits the layer definition in `docs/architecture.md`.
- **Uncertain about testing approach?** Read `docs/testing-guidelines.md`.
- **Styling a component?** Use `docs/ui-guidelines.md` color palette; never hardcode hex values.

## Quick Repo Navigation

```
expense-tracker/
├── docs/                           # Authoritative design docs
│   ├── spec.md                     # Full functional requirements
│   ├── architecture.md             # Layer definitions, data flows
│   ├── api-contract.md             # HTTP endpoints (source of truth)
│   ├── coding-guidelines.md        # Formatting, module patterns
│   ├── testing-guidelines.md       # Test levels, coverage rules
│   ├── ui-guidelines.md            # Component library, palette
│   ├── decisions.md                # ADRs and rationale
│   └── delivery-roadmap.md         # Release plan
├── .specify/                       # Workflow scaffolding (.specify configs, templates, scripts)
│   ├── integrations/               # Copilot/speckit manifests
│   ├── templates/                  # Markdown templates (spec, plan, tasks, checklist)
│   ├── scripts/bash/               # Feature creation, setup automation
│   ├── workflows/                  # Workflow definitions
│   └── memory/                     # Ratified project constitution
├── .github/skills/                 # .specify skills (agent-callable workflows)
└── README.md
```

## Integration with .specify Workflow

This repository uses `.specify` for structured specification and workflow management. Key elements:

- **Skills** (`.github/skills/speckit-*/`) — Callable workflows for specifying, planning, implementing, testing.
- **Copilot Integration** (`.specify/integrations/copilot.manifest.json`) — Copilot can invoke skills and contribute to workflows.
- **Templates** (`.specify/templates/`) — Spec, plan, task, and checklist templates guide structured PRs and planning. These are scaffolds; the constitution at `.specify/memory/constitution.md` is already ratified and is not a template.
- **Constitution** (`.specify/memory/constitution.md`) — Ratified governance baseline. Every feature plan and PR MUST comply with it.

When creating a feature, consider starting with a `speckit-plan` or `speckit-specify` skill invocation to ensure requirements and acceptance criteria are clear before implementation.
