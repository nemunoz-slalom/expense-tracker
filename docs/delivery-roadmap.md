# Delivery Roadmap

## Objective

Deliver the complete Services App MVP through dependency-driven parallel development using GitHub Issues, isolated Git worktrees, Spec Kit feature artifacts, pull requests, and a controlled integration branch.

The roadmap is organized by **dependencies, feature ownership, and integration gates**, not by calendar phases.

## Documentation Authority and Scope

Each document owns a specific concern. The authority hierarchy is:

1. **Constitution** (`.specify/memory/constitution.md`) — governance and architectural principles.
2. **PRD** (`docs/prd-services-app.md`) — product scope and user outcomes.
3. **Functional specification** (`docs/spec.md`) — cross-feature functional behavior.
4. **API contract** (`docs/api-contract.md`) — the authoritative HTTP boundary between frontend and backend.
5. **Architecture guide** (`docs/architecture.md`) — module ownership and dependency boundaries.
6. **Backend/Frontend specs** (`docs/spec-backend.md` / `docs/spec-frontend.md`) — implementation requirements within their respective packages.
7. **Guidelines** (`docs/ui-guidelines.md`, `docs/testing-guidelines.md`, `docs/coding-guidelines.md`) — cross-cutting implementation conventions.
8. **Feature artifacts** (`specs/<feature>/spec.md`, `plan.md`, `tasks.md`, etc.) — feature-specific implementation detail consistent with the documents above.
9. **Decisions** (`docs/decisions.md`) — records cross-document decisions and explains how ambiguities were resolved; does not replace the owning document.

If two documents conflict, do not let an agent choose an interpretation independently. Identify the concern involved, update the authoritative document first, then synchronize affected lower-level documents and feature artifacts.

## Contract Freeze

`docs/api-contract.md` is the boundary that allows backend and frontend work to proceed independently.

Before creating implementation Issues:

- Freeze the `Service` domain model.
- Freeze endpoint names and HTTP methods.
- Freeze request and response shapes.
- Freeze validation rules.
- Freeze date semantics.
- Freeze filtering and sorting semantics.
- Freeze billing-period statistics semantics.
- Freeze PDF export behavior.
- Freeze Telegram delivery ownership as a backend concern. The creation notification timer remains frontend-owned.

After the contract is frozen, a change requires explicit project-lead approval. Update `docs/api-contract.md` first, record the reason in `docs/decisions.md` when the decision is cross-cutting, then synchronize affected specifications and feature artifacts before implementation continues.

## Git Strategy

`main` remains releasable. Feature branches merge into `integration` through pull requests.

```text
main
  └── integration
       ├── chore/001-foundation
       ├── feature/002-backend-services
       ├── feature/003-frontend-services
       ├── feature/004-telegram
       ├── feature/005-filters
       ├── feature/006-spending-chart
       └── feature/007-pdf-export
```

Use one worktree per active agent and branch. Never switch branches inside another agent's worktree.

## Workstreams

### Foundation

Owner: project lead / architect.

Responsibilities:

- initialize the repository and Spec Kit integration;
- install the project documentation;
- establish the constitution;
- validate the frozen API contract;
- define feature ownership and file ownership;
- create GitHub Issues.

The foundation does not implement application features.

### Backend Services

Owns:

- SQLite schema and indexes;
- repository layer;
- business services;
- REST routes;
- validation;
- filtering and sorting;
- status calculation;
- billing-period statistics;
- PDF generation if the implementation assigns PDF generation to the backend;
- backend unit and integration tests.

### Frontend Services

Owns:

- React application shell;
- shadcn/ui primitives;
- service table/cards;
- create/edit forms;
- mark-as-paid and delete actions;
- API client and hooks;
- loading, error, and empty states;
- toast and Undo UI;
- dark theme;
- i18n;
- responsive and accessibility behavior.

The frontend implements against `docs/api-contract.md` and may use mocks while the backend is unavailable.

### Telegram

Owns:

- Telegram client;
- backend notification endpoint (`POST /api/services/:id/notify`);
- notification service (message formatting and delivery only);
- immediate mark-as-paid notification;
- best-effort failure handling and logging.

Does **not** own the 8-second create timer. That timer is a frontend-local
timer owned by the Frontend workstream; Undo cancellation happens in the
browser and results in `DELETE /api/services/:id`, which sends no notification.

Telegram internals must not become a second public API contract.

### File Ownership Rules

To keep parallel worktrees mergeable:

- Backend owns `server/db/`, `server/repositories/`, `server/routes/`, `server/services/service.service.js`, `server/services/stats.service.js`, and backend tests.
- Telegram owns `server/services/notification.service.js`, `server/external/telegram.client.js`, and Telegram-specific tests.
- Frontend owns `client/src/components/`, `client/src/hooks/`, `client/src/api/`, `client/src/types/`, `client/src/locales/`, and frontend tests.
- PDF backend generation belongs to `server/services/pdf.service.js` and its route; PDF download behavior belongs to the frontend API/client and UI.
- Global documentation is not owned by feature agents. Changes follow the documentation ownership rules below.
- If two workstreams require changes to the same file, stop and coordinate the ownership before implementation rather than allowing both agents to modify it independently.

### Filters, Spending Chart, and PDF

Filters can proceed against the frozen API contract using mocks. The spending chart depends on the filter/type-selection behavior and the statistics contract. PDF generation is owned by the backend; PDF download UI is owned by the frontend. These workstreams must have explicit file ownership to prevent agents from editing the same modules concurrently.

## Dependency Graph

```text
Foundation / Contract
        │
        ├───────────────┬───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
     Backend         Frontend        Telegram        Filters
        │               │               │               │
        │               │               │               ▼
        │               │               │             Chart
        │               │               │               │
        ├───────────────┴───────────────┴───────────────┤
        │                                               │
        └──────────────────────┬────────────────────────┘
                               ▼
                         PDF Integration
                               │
                               ▼
                         Integration / E2E
                               │
                               ▼
                              main
```

The graph represents technical dependencies, not a calendar schedule. A workstream may start as soon as its inputs and contracts are frozen; it does not need to wait for unrelated implementation work.

## GitHub Issue Strategy

Use one Issue per coherent feature or workstream. Do not create an Issue for every individual Spec Kit task.

Recommended feature Issues:

1. Foundation & project setup
2. Backend service management
3. Frontend service management
4. Telegram notifications
5. Date/type filters and sorting behavior
6. Consumption-by-billing-period chart
7. PDF export integration
8. Integration and E2E verification
9. Release readiness

The exact Issue body and labels come from the project's GitHub Issue template.

## Spec Kit Workflow Per Feature

Each implementation Issue gets its own feature directory under `specs/` and follows the Spec Kit lifecycle:

```text
GitHub Issue
    ↓
Create branch + worktree
    ↓
/speckit.specify
    ↓
/speckit.clarify
    ↓
/speckit.plan
    ↓
/speckit.checklist
    ↓
/speckit.tasks
    ↓
/speckit.analyze
    ↓
/speckit.implement
    ↓
/speckit.converge
    ↓
Tests
    ↓
Commit + push
    ↓
Pull request → integration
```

For small, unambiguous features, `clarify`, `checklist`, and `analyze` may be omitted only when the project lead intentionally accepts that trade-off. For this project, use the full flow for the main feature Issues.

## Feature Documentation Ownership

Feature-specific Spec Kit artifacts live in `specs/<feature>/` and are owned by the agent implementing that feature.

Global documents have narrower ownership:

- PRD: product scope changes only.
- `docs/spec.md`: cross-feature requirements changes only.
- `docs/api-contract.md`: HTTP contract changes only.
- `docs/architecture.md`: structural boundary changes only.
- Backend/frontend specs: implementation requirements changes only.
- UI/testing/coding guidelines: cross-cutting convention changes only.

Do not make every agent rewrite global documents.

## Pull Request Rules

Every feature PR must:

- reference its GitHub Issue;
- state the implemented scope;
- identify tests run and their results;
- identify any documentation changes;
- explicitly call out API contract changes;
- avoid unrelated refactors or formatting changes.

Feature PRs target `integration`. The final release PR targets `main`.

## Integration Order

Merge feature PRs according to dependency and conflict risk. A typical order is:

1. Foundation/contract implementation.
2. Backend service management.
3. Frontend service management.
4. Telegram integration.
5. Filters and sorting.
6. Consumption-by-billing-period chart.
7. PDF export integration.
8. Integration/E2E fixes.

The integration owner resolves conflicts centrally. Do not ask two feature agents to edit the same files concurrently unless that ownership is explicitly coordinated.

## Verification Gate

Before `integration` is merged to `main`, verify:

- create without payment date;
- create with payment date and Undo;
- create with payment date and notification after the Undo window;
- mark as paid and automatic payment date assignment;
- immediate mark-as-paid notification;
- edit;
- delete with confirmation;
- current-month, last-month, custom-range, and all-time filters;
- type filter;
- urgency sorting;
- billing-period chart;
- PDF export;
- persistence across restart;
- Telegram failure does not block the primary operation;
- responsive layouts;
- loading, empty, and error states;
- keyboard accessibility and reduced motion.

## Change Control

When behavior changes:

```text
Change request
     ↓
Update owning requirement/contract document
     ↓
Update affected Spec Kit feature artifacts
     ↓
Run /speckit.analyze
     ↓
Implement
     ↓
Run /speckit.converge
     ↓
PR
```

This keeps the repository, Issues, and implementation aligned without creating unnecessary documentation conflicts.
