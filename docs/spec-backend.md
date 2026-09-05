# Services App - Backend Specification

## Overview

The HTTP contract in `api-contract.md` is authoritative. This document defines backend implementation requirements and must not duplicate or diverge from that contract.

Related project documents:
- `../spec.md` — cross-feature functional requirements.
- `prd-services-app.md` — product scope.
- `api-contract.md` — HTTP contract.
- `architecture.md` — backend and frontend boundaries.
- `testing-guidelines.md` — test strategy.
- `coding-guidelines.md` — coding conventions.
The Services App backend shall provide a RESTful API for managing utility bills, storing data persistently in SQLite, and integrating with Telegram Bot API for automatic notifications. The backend follows the layered architecture defined in [architecture.md](architecture.md): routes → services → repositories → database, with external clients isolated in their own module.

## Contract Usage

`docs/api-contract.md` is the frozen frontend/backend boundary. This specification may describe implementation behavior, but it must not redefine endpoint names, HTTP methods, request shapes, response shapes, validation semantics, filter semantics, or date semantics. If a conflict is discovered, stop implementation and resolve the contract before proceeding.


---

# Functional Requirements

## Overview
The backend shall handle all CRUD operations for services, implement smart sorting and filtering logic, manage the Telegram notification lifecycle through the notification service, and persist all changes atomically.

---

## Requirements

### FR-1: Initialize database
The backend shall initialize and maintain a SQLite database with correct schema on startup.
- The database file shall be created at `./services.db` (configurable via .env).
- The database shall contain a `services` table with columns: id, name, type, amount, paymentDate, dueDate, paid, createdAt, updatedAt. `paymentDate` is nullable. Notification timer state is not persisted.
- The id column shall be a primary key with auto-increment.
- The paid column shall default to false (0).
- createdAt and updatedAt shall use CURRENT_TIMESTAMP.
- The database shall have indexes on: type, paid, dueDate, paymentDate for query performance.
- If the database already exists, the app shall verify schema correctness and log any mismatches.
- The database connection shall be established before the server starts accepting requests.
- The database shall not persist pending-notification state for created bills.
  The 8-second Undo window is frontend-owned local state (see FR-9).

### FR-2: Create bill (POST /api/services)
The backend shall accept a request to create a new bill and persist it to the database.
- **Request body:** `{ name: string, type: string, dueDate: string, amount?: number, paymentDate?: string }`
- The name field is required and shall reject empty or whitespace-only values (HTTP 400).
- The type field is required and shall accept only: electricity, gas, internet, mobile, water (HTTP 400 if invalid).
- The dueDate field is required and shall be a valid ISO 8601 date string (YYYY-MM-DD) (HTTP 400 if invalid).
- The amount field is optional. If provided, it shall be a finite decimal number greater than or equal to 0 (HTTP 400 if negative or non-numeric).
- The paymentDate field is optional. If provided, it shall be a valid ISO 8601 date string and dueDate shall be >= paymentDate (HTTP 400 if invalid).
- Upon successful creation, the backend shall assign a unique id and timestamps (createdAt, updatedAt).
- The paid field shall default to false.
- The backend shall return HTTP 201 using the response shape defined in `api-contract.md` (includes derived `status` field).
- If `paymentDate` is provided on creation, the frontend shall own an
  8-second local countdown. When it expires, the frontend shall request a
  Telegram creation notification. If the service is deleted during the window,
  no creation notification shall be sent. If `paymentDate` is omitted, no
  countdown is started and no creation notification is sent.
- If the database insert fails, return HTTP 500 with an error message.

### FR-3: Read all bills (GET /api/services)
The backend shall return a list of all bills with optional filtering and sorting.
- **Response:** HTTP 200 using the response shape defined in `api-contract.md` (includes derived `status` field for each service).
- Each bill shall include: id, name, type, amount, paymentDate, dueDate, paid, status, createdAt, updatedAt.
- The backend shall calculate a `status` field for each bill according to the derivation rules in `api-contract.md`. Paid services are always ordered last.
- Bills shall be sorted by urgency (see FR-6) regardless of filters applied; paid services are always last.
- The endpoint shall accept optional query parameters:
  - `month=YYYY-MM` (filter by due date month)
  - `from=YYYY-MM-DD&to=YYYY-MM-DD` (filter by due date range, inclusive per `api-contract.md`)
  - `paid=true|false` (optional filter by paid status)
  - `type=electricity|gas|internet|mobile|water` (filter by type)
- Multiple filters shall be combined with AND logic.
- The response shall include only fields defined by the API contract; derived counts belong to dedicated responses or the frontend.
- If no bills match the filters, return HTTP 200 with an empty array.
- The endpoint shall handle up to 1000 bills without exceeding 2 seconds response time.

### FR-4: Read single bill (GET /api/services/:id)
The backend shall return details for a specific bill by ID.
- **Response:** HTTP 200 with the bill object including the derived `status` field (per `api-contract.md`).
- If the bill does not exist, return HTTP 404 with an error message.

### FR-5: Update bill (PATCH /api/services/:id)
The backend shall accept updates to bill fields and persist changes atomically.
- **Request body:** Any subset of `{ name, type, amount, paymentDate, dueDate, paid }`
- All field validations from FR-2 shall apply if the field is being updated.
- The updatedAt timestamp shall be set to the current time. Validation shall use the complete resulting service state, including existing fields that are not present in the PATCH body.
- The app shall save only the fields that are included in the request body.
- Upon successful update, return HTTP 200 with the updated bill object (includes derived `status` field per `api-contract.md`).
- If the bill does not exist, return HTTP 404.
- If validation fails, return HTTP 400 with a descriptive error message.
- If the `paid` field changes from false to true (unpaid → paid transition), the backend shall set `paymentDate` to today, regardless of any `paymentDate` value supplied in that same request, then trigger an immediate Telegram notification (see `api-contract.md` "Telegram Notification and Undo Behavior").
- The update shall be atomic (either all changes succeed or none do).
- Repeated PATCH requests with `paid: true` on an already-paid service do not send duplicate notifications.

### FR-6: Sort bills by urgency
The backend shall return bills sorted consistently in all list responses.
- Paid bills shall always appear last.
- Unpaid overdue bills (`dueDate < today`) shall appear first.
- Other unpaid bills due within 7 days (`today ≤ dueDate ≤ today + 7 days`) shall appear second.
- Other unpaid bills shall appear third.
- Within each group, bills shall be sorted by `dueDate` ascending.
- Bills with the same `dueDate` shall be sorted by `id` ascending.
- The sorting shall be applied server-side after filtering.

### FR-7: Delete bill (DELETE /api/services/:id)
The backend shall delete a bill and remove it from persistent storage.
- Upon successful deletion, return HTTP 204 (no content, no body).
- If the bill does not exist, return HTTP 404 with an error message.
- Deleting a bill shall not affect any other bills.
- The deletion shall be atomic and permanent.
- Deleting a bill sends no Telegram notification. It is also the Undo path (see api-contract.md "Telegram Notification and Undo Behavior"). The backend has no timer to cancel.
- Failed deletions shall not partially remove data.

### FR-8: Calculate bill status
The backend shall calculate and return a `status` field for each bill based on date comparison per `api-contract.md` "Domain Model" section.
- Status derivation: paid → "paid"; unpaid with dueDate < today → "overdue"; unpaid with today ≤ dueDate ≤ today+7 → "urgent"; unpaid with dueDate > today+7 → "normal".
- The status shall be calculated server-side on each API response.
- The backend shall use the server's local timezone for date comparison (see `api-contract.md` "Date and Time Semantics").

### FR-9: Telegram notification trigger (Undo window on bill creation)
The **frontend** owns the eight-second local Undo timer for creation
notifications per `api-contract.md`. The backend MUST NOT create, own, persist,
schedule, cancel, or manage this timer.
- `POST /api/services` saves the bill immediately and returns `201`. It sends no notification.
- When a bill is created with a `paymentDate`, the frontend starts a local 8-second timer after the successful response.
- If the user clicks Undo, the frontend cancels its local timer and calls `DELETE /api/services/:id`. DELETE MUST NOT send a Telegram notification.
- If the timer expires without cancellation, the frontend calls `POST /api/services/:id/notify` and the backend sends the creation notification.
- **Endpoint:** `POST /api/services/:id/notify` — no request body, `204` on success, `404` when the bill no longer exists.
- If `paymentDate` is omitted at creation, there is no timer, no Undo UI, and no creation notification.
- Notification message format per api-contract.md: "{name} ({type}) ${amount} created" (or without ${amount} if null).
- If the Telegram API call fails, log the error but do not retry or block the API response.
- No timer state is persisted server-side; a backend restart cannot lose a pending notification because the backend holds none.

### FR-10: Telegram notification (on mark as paid)
The backend shall trigger a Telegram notification immediately when a bill transitions from unpaid to paid per `api-contract.md` "Telegram Notification and Undo Behavior" section.
- When a bill transitions from unpaid to paid via PATCH, set `paymentDate` to today, regardless of any `paymentDate` value supplied in that same paid-transition request.
- Send a Telegram notification immediately (no Undo window).
- Notification message format per api-contract.md: `"{name} ({type}) ${amount} paid on {paymentDate}"` (or without ${amount} if null).
- If the Telegram API fails, log the error and keep the successful database update.
- Telegram failure shall never turn a successful payment update into an HTTP error.
- Repeated PATCH requests for an already-paid bill do not send duplicate notifications.

### FR-11: Telegram API integration
The backend shall send HTTP POST requests to the Telegram Bot API per `api-contract.md` "Telegram Notification and Undo Behavior" section.
- **Telegram Bot API endpoint:** `https://api.telegram.org/bot{token}/sendMessage`
- **Request body:** `{ "chat_id": "{chatId}", "text": "{message}" }`
- The bot token and chat ID shall be read from environment variables: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
- If either variable is missing, skip sending silently (do not error; do not send notification).
- The backend shall handle Telegram API errors gracefully (log and continue).
- The message text shall be plain text (no markdown or special formatting).
- The HTTP request timeout shall be 5 seconds.
- If the Telegram API is unreachable, log the error but do not retry automatically.

### FR-12: Get consumption by billing period for a type
The backend shall return consumption amounts grouped by billing period for a
specific service type per `api-contract.md`.
- **Endpoint:** `GET /api/services/stats/type/{type}?periods=6`
- **Path parameter:** `type = electricity|gas|internet|mobile|water`
- **Query parameter:** `periods` optional, must be integer 1–12, default 6.
- Return exactly N billing periods derived from `dueDate` and service type.
- Billing frequency: electricity 2 months, gas 2 months, internet 1 month, mobile 1 month, water 1 month.
- `periodEnd` = the calendar month immediately before the `dueDate` month; monthly services use `periodStart = periodEnd`, bimonthly services use `periodStart = periodEnd` minus one calendar month.
- Series anchoring (independent of whether any matching bill exists): with `M` = server-local current calendar month and `anchorEnd` = `M` minus one calendar month, monthly period `k` has `periodEnd = periodStart = anchorEnd` minus `k` months, and bimonthly period `k` has `periodEnd = anchorEnd` minus `2k` months with `periodStart = periodEnd` minus one month, for `k = 0 .. N-1`.
- Return periods oldest to newest.
- Every bill MUST be aggregated exclusively into the billing period derived from its own `dueDate` and service type; a bill MUST NOT be remapped into a different period.
- A bill whose derived billing period is not one of the N returned periods MUST be excluded from the response. Example: `dueDate 2026-02-10` for electricity/gas derives `2025-12..2026-01`, which is not on the returned bimonthly series, so it is excluded.
- Period identifiers: `YYYY-MM` for monthly periods, `YYYY-MM..YYYY-MM` for bimonthly periods.
- A bimonthly bill is one period entry carrying its full amount; never prorate or split it.
- Include bills with a non-null `amount` regardless of `paid`.
- `paymentDate` MUST NOT affect the result; `paid` MUST NOT affect the result; the list's due-date filter MUST NOT affect the result.
- Periods with no matching records return `amount: 0` (not omitted).
- Include the average across all N periods, including zero-value periods.
- The billing period is derived at query time and MUST NOT be persisted as a `periodDate` column or DTO field.
- The calculation shall complete in under 1 second for the MVP dataset.
- Use the server's local timezone for month boundaries per `api-contract.md` "Date and Time Semantics".

### FR-13: Export bills to PDF
The backend shall generate a PDF containing the same filtered bill set shown by the list endpoint using identical filtering, sorting, and status calculation.
- **Endpoint:** `GET /api/services/export/pdf`
- **Query parameters:** identical to list endpoint: `month`, `from`, `to`, `type`, `paid` (all optional).
- Date filters apply to `dueDate` per `api-contract.md` "Date and Time Semantics".
- The PDF shall include:
  - Title: "Services Report"
  - Active filter period or "All Dates"
  - Table with columns: Service Name, Type, Payment Date, Due Date, Status (derived per FR-8)
  - Count of paid bills and count of pending bills (no monetary grand total)
- The PDF shall use the same data and ordering as the current filtered view (by urgency, then due date, then id).
- The response shall be HTTP 200 with `Content-Type: application/pdf`.
- The filename shall be descriptive and based on the active period when available (e.g., `services_2026-09-01_2026-09-30.pdf`).
- If no records match, return a clearly defined no-data response (e.g., empty report with "No services found" message).
- The PDF download shall complete in under 5 seconds.

### FR-14: Environment variables
The backend shall read configuration from environment variables at startup.
- **Configuration:**
  - `PORT` (HTTP server port, default 5001)
  - `TELEGRAM_BOT_TOKEN` (optional; notification sending is skipped when absent)
  - `TELEGRAM_CHAT_ID` (optional; notification sending is skipped when absent)
  - `DATABASE_PATH` (path to SQLite database, default `./services.db`)
  - `CLIENT_ORIGIN` (allowed frontend CORS origin, for example `http://localhost:3000`)
  - `NODE_ENV` (development|production, default development)
- The app shall read these from a `.env` file if it exists.
- Missing Telegram variables shall log a warning but shall not crash the application.
- The app shall not hardcode secrets in source code.

### FR-15: Error handling
The backend shall handle errors gracefully and return appropriate HTTP status codes.
- **400 Bad Request:** Invalid input, validation failure.
- **404 Not Found:** Bill does not exist.
- **500 Internal Server Error:** Database error, unexpected exception.
- All error responses shall include:
  - HTTP status code
  - JSON object with `error` and `message` fields
  - Example: `{ "error": "ValidationError", "message": "dueDate must be >= paymentDate" }`
- Errors in Telegram API calls shall log but not return error to client (transparent).
- Database connection errors shall return HTTP 500 with "Database unavailable" message.

### FR-16: Request/Response format
The backend shall use JSON for all API communication with bodies.
- All request bodies shall be parsed as JSON.
- All response bodies shall be returned as JSON, wrapped in `{ "data": ... }` format (or `{ "error": ..., "message": ... }` for errors).
- The Content-Type header shall be `application/json` for all JSON responses.
- **Exception:** DELETE responses are HTTP 204 with no body; PDF responses are `application/pdf`.
- Dates in requests and responses (paymentDate, dueDate) shall use ISO 8601 format: `YYYY-MM-DD` per `api-contract.md` "Date and Time Semantics".
- Timestamps (createdAt, updatedAt) shall be ISO 8601 with timezone: `YYYY-MM-DDTHH:mm:ss.sssZ`.
- All date comparisons and calculations use the server's local timezone per `api-contract.md`.

### FR-17: Database transactions
The backend shall ensure all database operations are atomic and consistent.
- Create, update, and delete operations shall succeed or fail completely (no partial updates).
- If a bill update fails validation after reading from the database, the bill shall not be modified.
- If a database write fails, return an error response and do not partially save data.
- Concurrent requests to the same bill shall not cause race conditions (handle with row-level logic).

### FR-18: Logging
The backend shall log important events for debugging and monitoring.
- Log level: INFO for operations (create, update, delete), ERROR for failures.
- Log format: timestamp, level, message.
- Log all Telegram API calls (success and failure).
- Log database errors.
- Log startup and shutdown.
- Log validation failures.
- Do not log sensitive data (tokens, chat IDs).

### FR-19: Performance and scalability
The backend shall handle moderate load efficiently.
- API responses (create, read, update, delete) shall return in under 500ms.
- Listing endpoint shall handle up to 1000 bills in under 2 seconds.
- Statistics endpoint shall calculate in under 1 second.
- PDF export shall complete in under 5 seconds.
- Concurrent Telegram notification requests shall not degrade performance.
- SQLite database shall not require configuration tuning for up to 1000 bills.

### FR-20: CORS and security
The backend shall implement basic CORS to allow frontend requests.
- The API shall accept requests from `http://localhost:3000` (frontend dev server).
- The allowed CORS origin shall be configured through `CLIENT_ORIGIN`.
- No authentication is required (personal use only).
- The backend shall not expose sensitive information in error messages.

---

# Non-Functional Requirements

## Reliability
- Database operations shall be atomic (all-or-nothing).
- Failed API calls shall not corrupt data.
- Telegram notification failures shall not block user actions.
- The app shall recover gracefully from database unavailability.

## Performance
- Bill list query: < 2 seconds (up to 1000 bills)
- Single bill read: < 100ms
- Create/update/delete: < 500ms
- Statistics calculation: < 1 second
- PDF generation: < 5 seconds
- Telegram API call: < 5 seconds (with timeout)

## Data Persistence
- All bill changes shall be persisted to SQLite immediately.
- Deletes shall be permanent.
- No data shall be lost on application restart.

## Maintainability
- Code shall be modular (db.js, routes.js, telegram.js, server.js).
- Tests shall cover all critical logic (CRUD, sorting, Telegram).
- Errors shall be logged with context for troubleshooting.

---

# API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/services` | Create bill |
| GET | `/api/services` | List bills (with filters) |
| GET | `/api/services/:id` | Get single bill |
| PATCH | `/api/services/:id` | Update bill |
| DELETE | `/api/services/:id` | Delete bill (no notification; Undo path) |
| POST | `/api/services/:id/notify` | Send creation notification (called by frontend timer) |
| GET | `/api/services/stats/type/{type}?periods=6` | Consumption by billing period |
| GET | `/api/services/export/pdf` | Export to PDF |

---

# Test Coverage

**Unit Tests:**
- Database schema initialization
- Bill validation (name, type, dates)
- Status calculation logic
- Sorting logic (overdue → urgent → normal → by dueDate)
- Filter logic (month, date range, type, paid)
- Telegram message formatting
- Billing-period derivation (monthly and bimonthly)

**Integration Tests:**
- Create bill → verify in database, no notification sent
- Update bill → verify changes
- Delete bill → verify removal, no notification sent
- `POST /api/services/:id/notify` → Telegram sent
- `POST /api/services/:id/notify` for a deleted bill → `404`, Telegram not sent
- Mark paid → Telegram sends immediately
- Filter bills → correct results returned
- Export PDF → file generated with correct data

---

# Out of Scope (Future Versions)

- User authentication and authorization
- Multi-user support
- Cloud database (PostgreSQL, MongoDB)
- Real-time WebSocket updates
- Advanced analytics and reporting
- Integration with banking APIs
- Email notifications (only Telegram)
- Rate limiting and API quotas

---

**Version:** 2.0  
**Format:** Backend Functional Requirements Specification  
**Status:** Ready for Development  
**Last Updated:** September 2026
