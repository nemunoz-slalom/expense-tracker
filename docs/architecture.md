# System Architecture

## Purpose

The frontend/backend API boundary is defined by `api-contract.md`, which is the single source of truth for HTTP contracts. This document defines module ownership and dependency boundaries.

This document describes the architectural pattern used across the Services App. The project follows a **Layered Architecture** (also called n-tier) on both the backend and the frontend. Layers isolate concerns—HTTP handling, business logic, data access, external services, presentation, state, and network—so each part can be reasoned about, tested, and changed independently.

The pattern is chosen for its simplicity: it isolates concerns into a small number of well-named layers without the ceremony that a stricter Clean Architecture would bring to a single-user app.

---

## Guiding Principles

- **Separation of concerns.** Each layer has one responsibility and does not spill into the others. Route handlers do not run SQL; components do not call `fetch` directly; repositories do not talk to Telegram.
- **Dependency direction is inward and downward.** A higher layer may depend on a lower layer, never the reverse. UI depends on hooks; hooks depend on API services; API services depend on the backend contract. Routes depend on services; services depend on repositories; repositories depend on the database.
- **Testability follows from isolation.** Because each layer talks to the one below through a narrow interface, tests can replace that lower layer with a double. Unit tests exercise a single layer; integration tests exercise a few layers together with a real database.
- **The pattern is uniform.** Both packages follow the same idea, so switching between backend and frontend does not require learning a new mental model.

---

## Backend Layers

The backend is a Node.js Express application organized into four layers.

### 1. Routes (HTTP layer)
Route handlers translate between HTTP and the rest of the app. They parse and validate the incoming request, delegate to a service, and shape the response with the right status code and JSON body. They contain no business rules and no direct database calls.

- **Location:** `server/routes/`
- **Depends on:** services
- **Responsibilities:**
  - Parse route parameters and request bodies.
  - Validate input shape and required fields (400 on failure).
  - Delegate to the appropriate service method.
  - Translate service results and errors into HTTP responses (200, 201, 204, 400, 404, 500).
- **Example files:** `services.routes.js`, `stats.routes.js`, `export.routes.js`

### 2. Services (business logic)
Services own business rules: sorting services by urgency, calculating status,
deriving billing periods, sending the creation notification when the frontend
calls `POST /api/services/:id/notify`, and sending the immediate mark-as-paid
notification. `telegram.client.js` owns the external Telegram API call.

The backend notification service MUST NOT own the browser's 8-second Undo
timer. It does not create, own, persist, schedule, cancel, or manage it, and it
holds no timer handles. Services coordinate repositories and external services
but do not know about HTTP or SQL.

`stats.service.js` owns billing-period logic. It generates the returned period
series from the server-local current month, independent of whether any matching
bill exists, and derives each bill's own period from `dueDate` + service type.
The anchoring algorithm and period identifier format are defined authoritatively
in `docs/api-contract.md` ("Consumption by billing period"); this layer
implements that contract and MUST NOT introduce a second definition. Billing
periods are computed at query time and are never persisted.

- **Location:** `server/services/`
- **Depends on:** repositories, external services (Telegram)
- **Responsibilities:**
  - Apply business rules (status calculation, sort order, billing-period derivation).
  - Coordinate one or more repository calls to fulfill a use case.
  - Trigger side effects (Telegram notifications) at the right moments.
  - Return domain objects, not HTTP responses.
- **Example files:** `service.service.js`, `notification.service.js`, `stats.service.js`, `pdf.service.js`

### 3. Repositories (data access)
Repositories are the only layer that runs SQL. They expose typed methods (`findAll`, `findById`, `create`, `update`, `delete`, `findByFilters`) that hide the database mechanics from services. They use parameterized statements exclusively.

- **Location:** `server/repositories/`
- **Depends on:** the database module
- **Responsibilities:**
  - Read and write services using parameterized SQL.
  - Build filtered queries from a plain-object filter description.
  - Return plain domain objects, not raw rows.
- **Example files:** `service.repository.js`

### 4. External Services
External-service modules wrap third-party APIs (the Telegram Bot API today). They expose a small, app-specific interface so the caller does not need to know about HTTP methods, tokens, or endpoints, and so tests can stub them at one clear seam.

- **Location:** `server/external/`
- **Depends on:** environment configuration, an HTTP client
- **Responsibilities:**
  - Send Telegram messages with the configured token and chat ID.
  - Handle transport errors gracefully (log, do not throw upstream).
- **Example files:** `telegram.client.js`

### Supporting Modules

- **`server/db/`** — database initialization, schema creation, and a shared connection factory.
- **`server/config/`** — reads and validates environment variables.
- **`server/app.js`** — constructs the Express application (middleware, routes) without starting the HTTP listener, so it can be imported directly by tests.
- **`server/server.js`** — imports `app.js` and starts the HTTP listener; this is the process entry point.

#### Route Registration

Register static routes (`/api/services/stats/type/:type` and `/api/services/export/pdf`) before the parameterized `/api/services/:id` route to prevent route shadowing in Express.

## Backend Data Flow: Create a Service

```
POST /api/services
  │
  ▼
routes/services.routes.js
  ├─ validates body { name, type, amount, paymentDate?, dueDate }
  └─ calls serviceService.create(dto)
        │
        ▼
     services/service.service.js
       ├─ calls serviceRepository.create(service)
       │     │
       │     ▼
       │  repositories/service.repository.js
       │     └─ INSERT INTO services ... (parameterized)
       │        returns { id, ...service }
       │
       └─ returns created service (no notification, no timer)
  │
  ▼
routes/services.routes.js
  └─ res.status(201).json({ data: serviceResponse })
```

### Creation notification (frontend-owned 8-second timer)

There is exactly one creation-timer architecture. The frontend owns the local
8-second timer. The backend has no timer of any kind: it does not create, own,
persist, schedule, or cancel one, and `notification.service.js` only formats
and sends Telegram messages.

```
Frontend receives 201 (only when paymentDate was supplied)
  └─ starts a local 8-second timer (browser)
        │
        ├─ user clicks Undo → cancel local timer
        │     └─ DELETE /api/services/:id
        │           → routes/services.routes.js
        │             → services/service.service.js
        │               → repositories/service.repository.js (DELETE)
        │           → res.status(204).end()   [no Telegram]
        │
        └─ timer expires → POST /api/services/:id/notify
              → routes/services.routes.js
                → services/notification.service.js (format message only)
                  → external/telegram.client.js → Telegram Bot API
              → res.status(204).end()
```

---

## Frontend Layers

The frontend is a React + TypeScript application organized into four layers.
The frontend never calls Telegram directly and owns the local creation Undo
countdown.

### 1. Components (presentation)
Components render UI and dispatch user events. They do not fetch data directly and do not contain business rules. When they need data or an action, they consume a hook.

Components live in two subfolders:
- **`client/src/components/ui/`** — project-owned canonical shadcn/ui sources. Files use shadcn's lowercase kebab-case convention (`alert-dialog.tsx`, `button.tsx`, `calendar.tsx`, etc.) and are imported as `@/components/ui/button`. Edit them to tune the theme or add project-specific behavior.
- **`client/src/components/`** — feature components that compose the ui primitives: `App.tsx`, `FilterPanel.tsx`, `DateFilter.tsx`, `TypeFilter.tsx`, `ServiceForm.tsx`, `ServiceList.tsx`, `ServiceItem.tsx`, `DeleteConfirmation.tsx`, `UndoToast.tsx`, `ConsumptionByPeriodChart.tsx`.

- **Depends on:** hooks, i18n, theme, ui primitives
- **Responsibilities:**
  - Render props into DOM using shadcn/ui primitives and themed styles.
  - Handle user interactions and dispatch them to hooks or callbacks.
  - Manage local UI-only state (modal open/closed, form input values before submit).
  - Read all user-facing text from i18n keys.
- **Example files:** `ServiceForm.tsx`, `ServiceList.tsx`, `ServiceItem.tsx`, `ConsumptionByPeriodChart.tsx`, with toast behavior provided by the Sonner integration.

### 2. Hooks (state and data orchestration)
Hooks own the state a component needs, expose actions the component can call, and coordinate with API services to fetch and mutate remote data. They contain any client-side rules (optimistic updates, retry logic, derived state).

- **Location:** `client/src/hooks/`
- **Depends on:** API services
- **Responsibilities:**
  - Fetch current data from the backend; do not introduce a client-side cache for the MVP.
  - Expose typed actions (`createBill`, `markAsPaid`, `deleteBill`) that components call on user interaction.
  - Manage loading, error, and success states.
  - Trigger refetches when filters or dependencies change.
- **Example files:** `useServices.ts`, `useConsumptionStats.ts`, `useUndoTimer.ts`, `useToasts.ts`

### 3. API Services (network layer)
API service modules are the only place that calls `fetch`. Each function corresponds to one backend endpoint, returns typed data, and throws typed errors. Components and hooks never call `fetch` directly; they call an API service function.

- **Location:** `client/src/api/`
- **Depends on:** the API base URL from configuration, TypeScript types
- **Responsibilities:**
  - Build and send HTTP requests to the backend.
  - Parse responses into typed domain objects.
  - Translate HTTP error responses into typed errors the hooks can handle.
- **Example files:** `services.api.ts`, `stats.api.ts`, `export.api.ts`

### 4. Types (domain models)
Types define the shape of every object crossing a boundary: request bodies, response bodies, domain entities, filter descriptions, error shapes. They are shared across components, hooks, and API services so the whole stack agrees on data shape.

- **Location:** `client/src/types/`
- **Depends on:** nothing
- **Responsibilities:**
  - Declare `Bill`, `ServiceType`, `ServiceStatus`, `CreateBillDTO`, `UpdateBillDTO`, `Filters`, etc.

### Supporting Modules

- **`client/src/locales/`** — i18n JSON files (`en.json`).
- **`client/src/styles/`** — global Tailwind layers and Dracula semantic color tokens.
- **`client/tailwind.config.js`** and **`client/postcss.config.js`** — Tailwind/PostCSS configuration for canonical shadcn utilities.
- **`client/craco.config.js`** — Create React App configuration for the `@/` alias in Webpack and Jest.
- **`client/src/config/`** — runtime configuration read from `REACT_APP_*` environment variables. The API base URL defaults to `http://localhost:5000`.
- **`client/src/lib/`** — framework-independent UI helpers, including `cn` and date-key/display formatting.
- **`client/src/App.tsx`** — root component composing the layout.

### Frontend Data Flow: Mark a Service as Paid

```
User clicks "Mark as paid" on ServiceItem
  │
  ▼
components/ServiceItem.tsx
  └─ calls useServices().markAsPaid(serviceId)
        │
        ▼
     hooks/useServices.ts
       ├─ optimistically updates local state
       ├─ calls servicesApi.updateService(id, { paid: true })
       │     │
       │     ▼
       │  api/services.api.ts
       │     └─ PATCH /api/services/:id  { paid: true }
       │        parses response, returns typed Service
       │
       ├─ refetches list to confirm state
       └─ triggers useToasts().success('toast.paid')
  │
  ▼
components/ServiceList.tsx re-renders with updated service
the Sonner integration displays success and error messages
```

---

## Dependency Rules

The dependency direction is strict. A violation of these rules is a design smell, not a stylistic preference.

**Backend:**
```
routes → services → repositories → db
                 ↘ external
```

**Frontend:**
```
components → hooks → api → (backend)
     ↓
   types (used everywhere, depends on nothing)
```

- A layer may import from the layers below it.
- A layer must not import from the layers above it.
- Types (frontend) and shared utilities are leaves of the dependency graph; anything can import them and they import nothing app-specific.

---

## Folder Structure

```
services-app/
├── server/
│   ├── routes/           # HTTP layer
│   ├── services/         # business logic
│   ├── repositories/     # data access
│   ├── external/         # third-party clients (Telegram)
│   ├── db/               # SQLite init and connection
│   ├── config/           # env variables
│   ├── app.js            # Express app construction
│   ├── server.js         # process entry point
│   └── __tests__/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # canonical shadcn/ui primitives (kebab-case files)
│   │   │   └── *.tsx         # feature components (compose ui/)
│   │   ├── hooks/            # state and data orchestration
│   │   ├── api/              # network layer (fetch calls)
│   │   ├── types/            # shared TypeScript types
│   │   ├── locales/          # i18n JSON files
│   │   ├── styles/           # CSS, color palette, Tailwind config
│   │   ├── config/           # runtime config
│   │   ├── lib/              # shadcn/ui utils (cn helper, etc.)
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── __tests__/
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── craco.config.js
│
└── tests/
    └── e2e/              # Playwright tests + Page Object Model
        ├── pages/
        └── *.spec.ts
```

---

## Layer-to-Test-Level Mapping

The layered structure aligns naturally with the test strategy documented in `testing-guidelines.md`.

- **Unit tests** target a single layer in isolation: a service with a stubbed repository, a hook with a stubbed API module, a repository with a real in-memory database.
- **Integration tests** cover a slice through several layers with a real dependency at the bottom: a route → service → repository → SQLite chain; a component → hook → mocked API chain.
- **E2E tests** exercise the full stack from a real browser through the running frontend and backend.

---

## When to Add a New Layer or Module

Add a new module inside the existing layer rather than creating a new layer whenever possible. Ask:

- **Is this a new HTTP endpoint?** Add to `routes/` and delegate to an existing or new service.
- **Is this a new business rule?** Add to an existing service, or create a new service if the responsibility is genuinely separate.
- **Is this a new database concern?** Add a repository method, or create a new repository if a new entity is introduced.
- **Is this a new third-party integration?** Create a new module in `external/`.
- **Is this a new UI screen or reusable widget?** Add a component; extract a hook if the state or fetching logic is non-trivial.

Introducing a new architectural layer is a significant change and should be documented here first, with the rationale for why the existing four layers are insufficient.

---

## What This Architecture Does Not Prescribe

- **A specific dependency-injection framework.** Modules import each other directly; wiring is done in `app.js` (backend) and at the top of hook definitions (frontend). This is enough for a single-user app.
- **A specific state-management library.** The MVP uses React's built-in hooks (`useState`, `useReducer`, `useEffect`) and does not require Redux, Zustand, or similar. If cross-cutting state becomes complex, revisit this decision and document the choice here.
- **A strict domain model separated from persistence.** Bill objects returned by the repository are the same shape used by services and returned to the frontend. If the two shapes diverge, introduce a mapper in the service layer.

## What This Architecture Does Prescribe

- **shadcn/ui as the sole UI component library** (see `ui-guidelines.md` and `docs/spec-frontend.md`). All buttons, dialogs, inputs, selects, tables, badges, toasts, tooltips, and popovers come from shadcn/ui. No parallel library.
- **Tailwind CSS as the styling engine** (bundled with the shadcn setup). Component-level styles use Tailwind classes; global tokens (color palette, typography) live as CSS variables consumed by Tailwind's theme.
- **react-i18next for localization** (see `docs/spec-frontend.md`). All user-facing text goes through `t('key')`.
- **shadcn Chart (Recharts-based) for charts.** Auto-themed with CSS variables.
- **Framer Motion for animations.** Layered on top of shadcn primitives without altering their behavior.

---

**Version:** 2.0  
**Status:** Architecture Documented  
**Last Updated:** September 2026
