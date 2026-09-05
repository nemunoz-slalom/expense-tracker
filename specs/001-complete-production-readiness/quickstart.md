# Validation Quickstart

This repository currently contains planning/documentation only. The commands below are the runnable validation contract for the planned `server/`, `client/`, and root E2E packages once implementation lands. They use the commands documented by this repository and do not alter the frozen API contract.

## Prerequisites

- Node.js and npm compatible with the implementation package manifests.
- A local writable project directory for SQLite.
- No Telegram credentials are required for automated tests; Telegram transport is stubbed.
- Configure the repository-root development environment file before starting the server:

  ```bash
  cp .env.example .env
  ```

  Keep `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` server-only. Set the documented server-local timezone and allowed client origin.

## Install

From the repository root:

```bash
cd server && npm install
cd ../client && npm install
cd .. && npm install
```

The server uses `services.db` for development and `services.test.db` through `DATABASE_PATH` during tests. Never point test commands at development data.

## Package validation

Run targeted package checks before full-stack validation:

```bash
cd server && npm run test:unit && npm run test:integration && npm run lint && npm run test
cd ../client && npm run test:unit && npm run lint && npm run build
```

Expected results:

- Server tests use fresh `services.test.db` state and never contact Telegram.
- Client tests use mocked API transport and cover local Undo timing without a live backend.
- Lint and production build complete without errors.

## Full-stack E2E validation

From the repository root, run the documented Chromium E2E suite:

```bash
npm run test:e2e
```

Expected results:

- Playwright starts the backend at `http://localhost:5001` and frontend at `http://localhost:3001`.
- Each test resets data independently and uses Page Object Model classes in `tests/e2e/pages/`.
- The suite proves create/list, creation Undo, mark paid, edit/re-sort, confirmed delete, type-filtered consumption chart, and filtered PDF export.

## Manual development smoke test

Start the documented development processes in separate terminals:

```bash
cd server && npm start
```

```bash
cd client && npm start
```

Confirm the client at port 3000 talks only to the backend at port 5000. Exercise the following against the implementation commitments in [implementation-contract.md](contracts/implementation-contract.md), the data rules in [data-model.md](data-model.md), and the exact HTTP behavior in [`docs/api-contract.md`](../../docs/api-contract.md):

1. Create an unpaid bill with valid type/name/due date and reload to confirm persistence.
2. Create with a payment date, Undo before eight seconds, and confirm deletion with no notification request.
3. Create with a payment date and allow expiry; verify one notify request. Create without payment date and verify no Undo/notify behavior.
4. Mark an unpaid bill paid; verify server-local payment date, paid status, and no duplicate notification on repeated paid update.
5. Confirm overdue/urgent/normal/paid ordering; test month, custom inclusive range, all-time, type, and paid filters.
6. Select monthly and bimonthly types; verify six chronological zero-filled chart periods and zero-inclusive average.
7. Export the active filtered list; verify title, filter label, fields, counts, order, and descriptive filename.
8. At 768px and 1024px, complete key flows using keyboard only and reduced-motion settings. Check labels, visible focus, dialog focus return, and no horizontal scroll.

## Release checklist commands

Before release, rerun package checks and E2E from a clean dependency installation, then inspect repository hygiene:

```bash
git status --short
git ls-files | grep -E '(^|/)(\.env|services(\.test)?\.db)$' || true
```

Expected result: no environment files, SQLite data files, tokens, or chat identifiers are tracked. Record performance measurements for the documented 1,000-bill list, type statistics, and PDF targets, and retain accessibility/security/failure-mode verification evidence with the release review.
