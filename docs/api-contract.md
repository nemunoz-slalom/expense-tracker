# API Contract

## Purpose

This document is the single source of truth for the HTTP contract between the React frontend and the Node.js/Express backend.

The contract is **frozen before parallel implementation begins**. Backend and frontend agents may implement independently against this contract, but neither agent may change it unilaterally.

If a contract change becomes necessary, update this document first, record the reason in the relevant GitHub Issue/PR, then update the affected implementation and feature specifications.

## Ownership

- Contract owner: project lead / architect.
- Backend owns implementation of the contract.
- Frontend consumes the contract.
- Telegram Bot API access is an internal backend integration. The `/api/services/:id/notify` HTTP endpoint is part of the application API and may be called by the frontend.

## Domain Model

### Persisted Entity

```ts
export type ServiceType =
  | "electricity"
  | "gas"
  | "internet"
  | "mobile"
  | "water";

export interface Service {
  id: number;
  name: string;
  type: ServiceType;
  amount: number | null;
  paymentDate: string | null; // YYYY-MM-DD; may be non-null while unpaid when supplied at creation
  dueDate: string; // YYYY-MM-DD
  paid: boolean;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}
```

### API Response Model

All successful JSON responses for service CRUD operations return a ServiceResponse with a derived `status` field:

```ts
export type ServiceStatus = "overdue" | "urgent" | "normal" | "paid";

export interface ServiceResponse extends Service {
  status: ServiceStatus;
}
```

Exceptions: `DELETE /api/services/:id` returns `204` with no body,
`POST /api/services/:id/notify` returns `204` with no body, the statistics
endpoint returns its own billing-period payload, and the PDF export endpoint
returns a binary `application/pdf` response.

**Derivation rules for `status`:**
- If `paid` is `true`: `status = "paid"`
- If `paid` is `false`:
  - If `dueDate < today`: `status = "overdue"`
  - If `today ≤ dueDate ≤ today + 7 days`: `status = "urgent"`
  - If `dueDate > today + 7 days`: `status = "normal"`

Date comparison uses the server's local timezone. The `status` field is calculated server-side on every response; it is not persisted.

## Validation Rules

- `name` is required and must not be blank or whitespace-only.
- `type` is required and must be one of the five `ServiceType` values.
- `amount` is optional; when provided it must be a finite number greater than or equal to 0.
- `paymentDate` is optional; when provided it must be `YYYY-MM-DD`.
- `dueDate` is required and must be `YYYY-MM-DD`.
- When `paymentDate` is present, `dueDate >= paymentDate`.
- `paid` is a boolean.
- When `paid` changes from `false` to `true`, the backend overrides `paymentDate` with today.

## Endpoints

### Create

`POST /api/services`

Request:

```json
{
  "name": "CFE",
  "type": "electricity",
  "amount": 450.00,
  "paymentDate": "2026-09-15",
  "dueDate": "2026-09-20"
}
```

Response `201`:

```json
{
  "data": {
    "id": 1,
    "name": "CFE",
    "type": "electricity",
    "amount": 450.00,
    "paymentDate": "2026-09-15",
    "dueDate": "2026-09-20",
    "paid": false,
    "status": "normal",
    "createdAt": "2026-09-02T12:00:00.000Z",
    "updatedAt": "2026-09-02T12:00:00.000Z"
  }
}
```

When `paymentDate` is supplied on create, the service is saved immediately and
the **frontend** starts a local eight-second Undo timer after the successful
response. The service remains `paid: false`. The backend does not create, own,
persist, schedule, or cancel this timer, and the timer is not represented in
the API response. The supplied `paymentDate` is retained as part of the service
record. See **Telegram Notification and Undo Behavior** section below.

### List

`GET /api/services`

Query parameters:

- `month=YYYY-MM` — filter by due date month.
- `from=YYYY-MM-DD&to=YYYY-MM-DD` — inclusive due date range.
- `type=electricity|gas|internet|mobile|water` — service type filter.
- `paid=true|false` — optional paid-status filter for API consumers.

If no date parameters are supplied, all records are eligible.

The response is sorted by urgency, then due date, then `id` ascending. Paid services are always last and use the `paid` status.

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "name": "CFE",
      "type": "electricity",
      "amount": 450.00,
      "paymentDate": null,
      "dueDate": "2026-09-05",
      "paid": false,
      "status": "overdue",
      "createdAt": "2026-09-02T12:00:00.000Z",
      "updatedAt": "2026-09-02T12:00:00.000Z"
    }
  ]
}
```

### Get one

`GET /api/services/:id`

Response `200`:

```json
{
  "data": {
    "id": 1,
    "name": "CFE",
    "type": "electricity",
    "amount": 450.00,
    "paymentDate": null,
    "dueDate": "2026-09-05",
    "paid": false,
    "status": "overdue",
    "createdAt": "2026-09-02T12:00:00.000Z",
    "updatedAt": "2026-09-02T12:00:00.000Z"
  }
}
```

### Update

`PATCH /api/services/:id`

Request may contain any subset of:

```json
{
  "name": "CFE",
  "type": "electricity",
  "amount": 500.00,
  "paymentDate": "2026-09-15",
  "dueDate": "2026-09-20",
  "paid": true
}
```

Response `200`:

```json
{
  "data": {
    "id": 1,
    "name": "CFE",
    "type": "electricity",
    "amount": 500.00,
    "paymentDate": "2026-09-02",
    "dueDate": "2026-09-20",
    "paid": true,
    "status": "paid",
    "createdAt": "2026-09-02T12:00:00.000Z",
    "updatedAt": "2026-09-02T13:15:00.000Z"
  }
}
```

When `paid` changes from `false` to `true`, the backend sets `paymentDate` to today, regardless of any `paymentDate` value supplied in that same request, and triggers a Telegram notification immediately. This is the only automatic change to `paymentDate` performed by a paid-state transition. The notification is best-effort and never blocks the successful service update.

### Delete

`DELETE /api/services/:id`

Deletes the service. This endpoint MUST NOT send any Telegram notification. It
is also the Undo path: when the frontend's local 8-second timer is still
running and the user clicks Undo, the frontend cancels its timer and calls this
endpoint.

Response `204` with no body.

### Send creation notification

`POST /api/services/:id/notify`

Sends the creation Telegram notification for an existing service. The frontend
calls this endpoint when its local 8-second Undo timer expires without being
cancelled.

The backend does not create, own, persist, schedule, or cancel any 8-second
timer. It only sends the message when this endpoint is called.

Request: no body.

Response `204` with no body.

Errors:

- `404` when the service does not exist (for example, it was deleted via Undo).
- Telegram delivery failure is logged and does not turn a valid request into an
  error response.

### Consumption by billing period

`GET /api/services/stats/type/:type?periods=6`

Returns exactly the requested number of billing periods (default 6, range 1–12),
anchored as defined below and including periods with zero amounts.

**Billing frequency by service type:**

| Type | Frequency | Months per period |
|------|-----------|-------------------|
| `electricity` | Bimonthly | 2 |
| `gas` | Bimonthly | 2 |
| `internet` | Monthly | 1 |
| `mobile` | Monthly | 1 |
| `water` | Monthly | 1 |

**Billing period derivation** (from `dueDate` and service type):

- `periodEnd` = the calendar month immediately **before** the `dueDate` month.
- Monthly services: `periodStart = periodEnd`.
- Bimonthly services: `periodStart = periodEnd` minus one calendar month.

Examples for `dueDate = 2026-03-10`:

| Type | `period` identifier | UI label |
|------|---------------------|----------|
| `electricity` | `2026-01..2026-02` | Jan–Feb 2026 |
| `gas` | `2026-01..2026-02` | Jan–Feb 2026 |
| `internet` | `2026-02` | Feb 2026 |
| `mobile` | `2026-02` | Feb 2026 |
| `water` | `2026-02` | Feb 2026 |

**Period identifier format:**

- Monthly period: `YYYY-MM` (for example `2026-02`).
- Bimonthly period: `YYYY-MM..YYYY-MM`, `periodStart` first (for example `2026-01..2026-02`).

The identifier is the machine-readable contract value. The UI formats it for
display (`Jan–Feb 2026`, `Feb 2026`) and MUST NOT rely on the display string.

**Period series anchoring** (which N periods are returned):

The series is generated from the server-local current date alone. It MUST NOT
depend on whether any matching bill exists, so the response always contains
exactly N periods.

Let `M` = the server-local current calendar month, and let `anchorEnd` = `M`
minus one calendar month. `anchorEnd` is the `periodEnd` of the most recent
period, matching the derivation rule above for a bill due in the current month.

- **Monthly services:** period `k` (for `k = 0 .. N-1`) has
  `periodEnd = periodStart = anchorEnd` minus `k` calendar months.
- **Bimonthly services:** period `k` (for `k = 0 .. N-1`) has
  `periodEnd = anchorEnd` minus `2k` calendar months, and
  `periodStart = periodEnd` minus one calendar month.

Periods are returned **oldest to newest** (`k = N-1` first, `k = 0` last).

Every bill MUST belong exclusively to the billing period derived from its own
`dueDate` and service type. A bill whose derived billing period is outside the
returned N-period series is excluded from the response.

A bimonthly bill is **one** chart point carrying its **full** amount. Amounts
are never prorated or split across the two months of a bimonthly period.

Response `200` (bimonthly example, server-local current month `2026-09`, so
`anchorEnd = 2026-08`):

```json
{
  "data": {
    "type": "electricity",
    "periods": [
      { "period": "2025-09..2025-10", "amount": 0 },
      { "period": "2025-11..2025-12", "amount": 450.00 },
      { "period": "2026-01..2026-02", "amount": 450.00 },
      { "period": "2026-03..2026-04", "amount": 0 },
      { "period": "2026-05..2026-06", "amount": 300.00 },
      { "period": "2026-07..2026-08", "amount": 450.00 }
    ],
    "average": 275.00
  }
}
```

Response `200` (monthly example, same current month, so `anchorEnd = 2026-08`):

```json
{
  "data": {
    "type": "internet",
    "periods": [
      { "period": "2026-03", "amount": 0 },
      { "period": "2026-04", "amount": 60.00 },
      { "period": "2026-05", "amount": 60.00 },
      { "period": "2026-06", "amount": 60.00 },
      { "period": "2026-07", "amount": 0 },
      { "period": "2026-08", "amount": 60.00 }
    ],
    "average": 40.00
  }
}
```

The chart represents consumption by billing period. It aggregates services by
the period derived from their `dueDate` and `type`.

Inclusion rules:

- Services with a non-null `amount` are included **regardless of `paid`**.
- Services with a null `amount` are excluded.
- `paymentDate` MUST NOT affect this endpoint.
- `paid` MUST NOT affect this endpoint.
- The service list's due-date filter MUST NOT affect this endpoint.

Periods with no matching records return `amount: 0` (not omitted). The average
is calculated across all N returned periods, including zero-value periods.

The billing period is **derived**, never persisted. There is no `periodDate`
field in the database model, the API model, or any DTO.

### PDF export

`GET /api/services/export/pdf`

Accepts the same filtering parameters as the list endpoint:

- `month=YYYY-MM`
- `from=YYYY-MM-DD&to=YYYY-MM-DD`
- `type=...`
- `paid=true|false`

The response is `200` with `Content-Type: application/pdf` and contains the currently filtered services.
When no services match valid filters, the endpoint still returns `200` with
`Content-Type: application/pdf`. The report includes the active filter context,
zero paid and pending counts, and the statement `No services match the selected
filters.` It contains no service rows.

## Telegram Notification and Undo Behavior

### Creation Notification (Optional Undo Window)

The 8-second creation Undo timer is **owned entirely by the frontend**. The
backend never creates, owns, persists, schedules, cancels, or manages it.

When a service is created with a `paymentDate`:
1. `POST /api/services` saves the service immediately with `paid: false` and returns `201`.
2. After the successful response, the **frontend** starts a local 8-second timer and shows the Undo affordance.
3. **Undo path:** If the user clicks Undo before 8 seconds, the frontend cancels its local timer and calls `DELETE /api/services/:id`. DELETE sends no Telegram notification. The frontend may reopen the form with the user's original input.
4. **Timeout path:** If the local timer expires without cancellation, the frontend calls `POST /api/services/:id/notify` and the backend sends:
   ```
   {name} ({type}) ${amount} created
   ```
   If `amount` is null, format as: `{name} ({type}) created`
   Example: `"CFE (Electricity) $450.00 created"`

When a service is created **without** a `paymentDate`:
- No timer is started.
- No Undo affordance is shown.
- No creation notification is sent (regardless of configuration).
- The service is saved immediately.

### Mark as Paid Notification (Immediate)

Mark-as-paid has **no** Undo timer. The notification is sent immediately.

When a service transitions from `paid: false` to `paid: true` via PATCH:
1. The backend sets `paymentDate` to today, regardless of any `paymentDate` value supplied in that same request.
2. The service is saved to the database.
3. A Telegram notification is sent immediately:
   ```
   {name} ({type}) ${amount} paid on {paymentDate}
   ```
   If `amount` is null, format as: `{name} ({type}) paid on {paymentDate}`
   Example: `"CFE (Electricity) $450.00 paid on Sep 02"`

Repeated PATCH requests with `paid: true` on an already-paid service **do not send duplicate notifications**.

### Telegram Configuration

- Notifications are sent only if both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables are set.
- If either is missing, notifications are skipped silently (no error to the client).
- If sending fails, the error is logged but does not block the primary operation (create, update, delete).

## Date and Time Semantics

### Date Format and Validation

- All dates in the API use ISO 8601 format: `YYYY-MM-DD`.
- Dates must pass calendar validation (e.g., February 31 is rejected; leap years are handled correctly).
- Backend validates real dates; frontend should also validate before submission.

### Timezone for "Today"

The backend uses the **server's local time** to determine "today" for:
- Urgency calculation (overdue, urgent, normal status).
- Default `paymentDate` when marking as paid.
- Billing-period anchoring for consumption statistics.

If the server runs in UTC, "today" is UTC midnight. If the server runs in a different timezone, "today" is midnight in that zone. This must be consistent and documented in deployment configuration.

### Date Filter Boundaries

Query parameters `from` and `to` define an **inclusive date range** for `dueDate`:
- `from=2026-09-01&to=2026-09-30` includes all services with `dueDate >= 2026-09-01` AND `dueDate <= 2026-09-30`.
- `month=2026-09` is shorthand for `from=2026-09-01&to=2026-09-30`.
- `month` cannot be combined with `from` or `to`. A request that combines them
  returns `400` with `ValidationError`.
- All dates are compared in `YYYY-MM-DD` form; time of day is irrelevant.

### Consumption by Billing Period

Billing-period anchoring, period derivation, period identifiers, ordering, and
aggregation rules are defined once in the **Consumption by billing period**
subsection under **Endpoints**. That subsection is authoritative; this section
intentionally does not restate it.

## Error Contract

Errors use:

```json
{
  "error": "ValidationError",
  "message": "dueDate must be >= paymentDate"
}
```

Minimum status mapping:

- `400` validation / malformed query
- `404` service not found
- `409` conflict when applicable
- `500` unexpected server/database failure

## Date and Number Conventions

- Dates exchanged by the API are `YYYY-MM-DD`.
- Timestamps are ISO 8601 datetimes.
- Monetary values are JSON numbers representing the amount in the app's configured currency (MVP: MXN).
- The API does not localize display strings.

## Contract Freeze Rules

Before parallel agents start:

1. Review this document against the PRD, architecture, backend spec, and frontend spec.
2. Freeze endpoint names, request shapes, response shapes, validation, filtering, sorting, and date semantics.
3. Create the implementation Issues from the frozen contract.
4. Backend and frontend agents may work in parallel.
5. A contract change requires an explicit update to this document and the affected specs before implementation continues.

## Non-Goals

- No authentication or authorization.
- No direct browser access to the Telegram Bot API, Telegram credentials, or a
  client-configured Telegram transport. The frontend may call the application
  endpoint `POST /api/services/:id/notify`; only the backend communicates with
  Telegram.
- No persistent notification-job table; creation Undo countdowns are owned by
  the frontend in local state.
