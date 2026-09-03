# Architectural and Product Decisions

## Purpose
This document records critical decisions about data semantics, behavior, and architecture that govern the Services App MVP. It serves as a reference for resolving ambiguities during implementation and ensures semantic consistency across the documentation set.

**Authority hierarchy:**

1. **Constitution** (`.specify/memory/constitution.md`) — governance and architectural principles.
2. **PRD** (`docs/prd-services-app.md`) — product scope and outcomes.
3. **`docs/spec.md`** — cross-feature functional behavior.
4. **`docs/api-contract.md`** — the HTTP contract.
5. **`docs/architecture.md`** — module ownership and dependency boundaries.
6. **`docs/spec-backend.md` / `docs/spec-frontend.md`** — implementation requirements.
7. **`docs/ui-guidelines.md`, `docs/testing-guidelines.md`, `docs/coding-guidelines.md`** — cross-cutting conventions.
8. **This document** — records cross-document decisions; it does not override the owning document.

The constitution is authoritative for governance and architectural principles; no lower-level document, including the PRD, overrides it on those concerns.

---

## Decision 1: paymentDate Semantics (CRITICAL)

**Issue:** The field `paymentDate` was overloaded to mean both "date paid" (for analytics) and "trigger date for creation notification" (for optional Undo behavior). This created ambiguity: what does it mean if a bill is created with `paymentDate` present but `paid: false`?

**Decision:** `paymentDate` is the service payment date. It may be supplied when creating an unpaid service and may therefore be non-null while `paid: false`. When a service is marked as paid, the backend sets it to the current date.

- `paymentDate` may be `null` or a valid date while `paid: false`.
- When marking a service as paid via PATCH, the backend shall set `paymentDate = today`, regardless of any `paymentDate` supplied in that same paid transition request.
- On creation, the presence of `paymentDate` determines whether the 8-second Undo/creation-notification flow starts. This is a creation-flow rule; there is no separate persisted notification-trigger field.

**Implications:**
- Billing-period chart (`GET /api/services/stats/type/{type}?periods=6`)
  derives periods from `dueDate` and service type, includes paid and unpaid
  records with non-null amounts, and does not prorate bimonthly amounts.
- Frontend form: users may provide or omit payment date at creation time; omitting it disables Undo and Telegram notification. Providing it enables Undo.
- API response always includes `paymentDate` (null or YYYY-MM-DD); no separate notification-trigger field.

**Related documents:**
- `docs/prd-services-app.md` (section 2.2: data model)
- `docs/api-contract.md` (Domain Model, Telegram Notification section)
- `docs/spec-backend.md` (FR-2, FR-10, FR-12)
- `docs/spec-frontend.md` (FR-4, FR-5, FR-11)

---

## Decision 2: Timezone for "Today"

**Issue:** Date comparison for urgency (overdue, urgent, normal) and default `paymentDate` on mark-as-paid depend on "today." Different timezone interpretations would produce inconsistent results between frontend and backend.

**Decision:** The backend uses the **server's local timezone** to determine "today" for all date calculations.

- "Today" is defined as midnight (00:00:00) in the server's local timezone.
- This timezone must be documented in deployment configuration and used consistently for:
  - Urgency calculation (dueDate < today = overdue)
  - Billing-period anchoring for consumption statistics
  - Default `paymentDate` when marking paid
- Frontend displays may localize timezone interpretation, but all filter and sort results derive from server calculations.

**Implications:**
- Backend must log its timezone on startup for debugging.
- If the server moves to a different timezone, date-dependent results may change transiently.
- Tests must use a fixed, known timezone or mock `today` explicitly.

**Related documents:**
- `docs/api-contract.md` (Date and Time Semantics section)
- `docs/spec-backend.md` (FR-3, FR-6, FR-8, FR-10, FR-12, FR-16)
- `docs/testing-guidelines.md` (E2E test setup)

---

## Decision 3: Telegram Notification Events

**Issue:** Multiple documents described Telegram behavior inconsistently (timer on mark-as-paid, unclear Undo closure semantics, varying message formats).

**Decision:** There are exactly **two** Telegram notification events, defined in `docs/api-contract.md` section "Telegram Notification and Undo Behavior":

### Event A: Creation with paymentDate (frontend-owned 8-second Undo window)
1. User creates a bill with `paymentDate` present.
2. `POST /api/services` saves the bill immediately with `paid: false` and sends no notification.
3. The **frontend** starts a local 8-second timer after the successful response. The backend MUST NOT create, own, persist, schedule, cancel, or manage this timer.
4. **If the user clicks Undo within 8s:** the frontend cancels its local timer and calls `DELETE /api/services/:id`. The bill is deleted and no notification is sent. DELETE never sends a notification.
5. **If the local timer expires:** the frontend calls `POST /api/services/:id/notify` and the backend sends `"{name} ({type}) ${amount} created"`.
6. **If creation omits paymentDate:** No timer, no Undo UI, no notification.

### Event B: Mark as paid (immediate, no Undo)
1. User sends PATCH with `{ paid: true }`.
2. Backend sets `paymentDate = today`, regardless of any `paymentDate` supplied in the same paid-transition request.
3. Backend saves the bill.
4. Telegram notification is sent **immediately**: `"{name} ({type}) ${amount} paid on {paymentDate}"`.
5. Subsequent PATCHes with `paid: true` on an already-paid bill do **not** send notifications.

### Configuration
- Notifications are sent only if both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables are set and non-empty.
- If either is missing, notification sending is skipped silently; the primary operation (create/update) succeeds.
- Notification failures are logged but do not block the primary operation.

**Implications:**
- Frontend must handle two distinct UX flows: Undo toast for creation, immediate confirmation for mark-as-paid.
- Testing must verify frontend timer expiration (fake timers), Undo cancellation, and that DELETE sends nothing.
- Documentation must explicitly state that Undo is only available on creation, not mark-as-paid.

**Related documents:**
- `docs/api-contract.md` (Telegram Notification and Undo Behavior section)
- `docs/prd-services-app.md` (section 2.2: Telegram notifications)
- `docs/spec.md` (FR-7, FR-8)
- `docs/spec-backend.md` (FR-2, FR-5, FR-9, FR-10, FR-11)
- `docs/spec-frontend.md` (FR-4, FR-5, FR-7)

---

## Decision 4: Status Field in API Responses

**Issue:** The API contract declared `ServiceStatus` as a derived type but did not include it in the `Service` interface or response examples. Implementation specs required clients to render status, leading to type mismatch.

**Decision:** All successful API responses include a derived `status` field calculated server-side.

- **Persisted model:** `Service` (no status field; stored in DB).
- **Response model:** `ServiceResponse extends Service { status: ServiceStatus }`.
- **Derivation (server-side, on every response):**
  - If `paid = true`: `status = "paid"`
  - Else if `dueDate < today`: `status = "overdue"`
  - Else if `today ≤ dueDate ≤ today + 7`: `status = "urgent"`
  - Else: `status = "normal"`
- **Timezone:** "today" is determined in the server's local timezone (see Decision 2).

**Implications:**
- Frontend types must include `status` in all `Service` response objects.
- Backend must calculate status on every GET, POST, PATCH response.
- Status is NOT persisted; it is computed freshly each time.
- Change in server timezone or date may alter status values retroactively (expected behavior).

**Related documents:**
- `docs/api-contract.md` (Domain Model section)
- `docs/spec-backend.md` (FR-3, FR-4, FR-8)
- `docs/spec-frontend.md` (FR-2)

---

## Decision 5: Filter Schema Consistency

**Issue:** List and PDF export endpoints accepted different filter parameters, yet documentation stated they must show "the same filtered bill set."

**Decision:** Both `GET /api/services` (list) and `GET /api/services/export/pdf` (PDF export) accept an identical filter schema and return results with identical ordering and status calculation.

**Shared filter parameters:**
- `month=YYYY-MM` — filter by due date month (e.g., `2026-09`)
- `from=YYYY-MM-DD&to=YYYY-MM-DD` — inclusive due date range
- `type=electricity|gas|internet|mobile|water` — service type filter
- `paid=true|false` — paid status filter (optional)

**Behavior:**
- Filters are combined with AND logic.
- If both `month` and `from`/`to` are supplied, `month` takes precedence; alternatively, return HTTP 400 if ambiguous.
- Results are sorted by urgency (per FR-6), then due date, then id.
- Paid services are always last regardless of urgency.
- PDF uses the same ordering and calculates the same status values as the list endpoint.

**Implications:**
- Frontend can use identical filter state (month, from, to, type, paid) for both list view and export.
- PDF export always reflects the current filtered view exactly.
- Testing must verify filter consistency between list and export endpoints.

**Related documents:**
- `docs/api-contract.md` (List and PDF export sections)
- `docs/spec-backend.md` (FR-3, FR-13)

---

## Decision 6: Date Filter Boundaries

**Issue:** Filter documentation did not specify whether `from` and `to` are inclusive, exclusive, or mixed. This led to potential off-by-one errors in boundary tests.

**Decision:** All date filters are **inclusive** on both boundaries.

- `from=2026-09-01&to=2026-09-30` includes all services with `dueDate >= 2026-09-01` **AND** `dueDate <= 2026-09-30`.
- `month=2026-09` is equivalent to `from=2026-09-01&to=2026-09-30` (first and last days of the month).
- All dates are compared in YYYY-MM-DD form; time of day is not considered.

**Implications:**
- Off-by-one errors in test date ranges must be caught.
- Filter boundary tests (e.g., exact `from` and `to` dates) are critical.

**Related documents:**
- `docs/api-contract.md` (Date and Time Semantics section)
- `docs/testing-guidelines.md` (feature coverage)

---

## Decision 7: Consumption by Billing Period

**Issue:** Aggregating by `paymentDate` into calendar months did not represent
the service's billing cycle, especially for bimonthly electricity and gas bills.

**Decision:** The endpoint `GET /api/services/stats/type/{type}?periods=N`
returns exactly N billing periods (default 6, valid range 1–12) derived from
`dueDate` and service type. Electricity and gas bill every 2 months; internet,
mobile, and water bill every 1 month.

Bill derivation (per bill, from `dueDate` + service type):
- `periodEnd` = the calendar month immediately before the `dueDate` month.
- Monthly services: `periodStart = periodEnd`.
- Bimonthly services: `periodStart = periodEnd` minus one calendar month.
- Example: `dueDate 2026-03-10` → electricity/gas `2026-01..2026-02`; internet/mobile/water `2026-02`.

Series anchoring (which N periods are returned, independent of whether any bill
exists, so the response always has exactly N entries):
- `M` = server-local current calendar month; `anchorEnd` = `M` minus one calendar month.
- Monthly services: period `k` has `periodEnd = periodStart = anchorEnd` minus `k` calendar months, for `k = 0 .. N-1`.
- Bimonthly services: period `k` has `periodEnd = anchorEnd` minus `2k` calendar months, with `periodStart = periodEnd` minus one calendar month, for `k = 0 .. N-1`.
- Example with current month `2026-09` (`anchorEnd = 2026-08`): monthly → `2026-08`, `2026-07`, `2026-06`, …; bimonthly → `2026-07..2026-08`, `2026-05..2026-06`, `2026-03..2026-04`, …

Period identifiers: `YYYY-MM` for monthly periods, `YYYY-MM..YYYY-MM` for
bimonthly periods. The UI formats them for display (`Feb 2026`, `Jan–Feb 2026`).

Rules:
- Every bill belongs exclusively to the billing period derived from its own `dueDate` and service type. A bill is never remapped to a different period.
- A bill whose derived billing period is not one of the N generated periods is excluded from that statistics response. Example: `dueDate 2026-02-10` for electricity/gas derives `2025-12..2026-01`, which is not on the generated bimonthly series, so that bill is excluded.
- A bimonthly bill is one period entry carrying its full amount; never prorated or split.
- Services with a non-null `amount` are included regardless of `paid`.
- Services with a null `amount` are excluded.
- `paymentDate` does not affect statistics.
- `paid` does not affect statistics.
- The list's due-date filter does not affect statistics.

**Behavior:**
- For each period, sum the full `amount` of matching services.
- If a period has no matching records, return `amount: 0` (not omitted).
- Calculate and return the average amount across all N periods, including zeros.

**Implications:**
- Billing periods always include zeros (no sparse data).
- Period ordering is chronological from oldest to newest.
- The billing period is derived at query time; no `periodDate` is persisted in
  the database model, API model, or any DTO.
- "Today" is determined per Decision 2 (server local timezone).

**Related documents:**
- `docs/api-contract.md` (Consumption by billing period section)
- `docs/spec-backend.md` (FR-12)
- `docs/spec-frontend.md` (FR-11)

---

## Decision 8: HTTP Response Codes and Body Formats

**Issue:** Some documents mandated "JSON for all responses" while others expected DELETE to return 204 (no body) and PDF to use `application/pdf`.

**Decision:** Response format varies by operation:

- **Successful responses with bodies** (`POST`, `GET`, `PATCH`): HTTP 200 or 201 (per operation), `application/json`, wrapped in `{ "data": ... }`.
- **DELETE:** HTTP 204 (No Content), no body.
- **PDF export:** HTTP 200, `application/pdf`, binary body.
- **Errors:** HTTP 400/404/500, `application/json`, `{ "error": "...", "message": "..." }`.

**Implications:**
- Frontend must handle 204 responses (no JSON to parse).
- Frontend must handle PDF blob downloads correctly.
- JSON wrapping (`{ "data": ... }`) is consistent for all JSON responses.

**Related documents:**
- `docs/api-contract.md` (Error Contract section)
- `docs/spec-backend.md` (FR-7, FR-13, FR-16)

---

## Decision 9: Service vs. Bill Terminology

**Issue:** Documentation mixed "Service" (API/types) and "bill" (UI/colloquial) inconsistently, risking semantic drift and naming confusion during implementation.

**Decision:** Use **"Service"** as the canonical technical term; use **"bill"** only in user-facing text where it improves clarity.

- **Technical names:** `Service`, `ServiceType`, `ServiceStatus`, `/api/services`, `services.db` table, `service.service.js` module.
- **User-facing text:** Buttons ("Delete bill?"), toasts ("Service created" → prefer "Bill created"), labels ("Service name" → consider "Billing service").
- **Code:** Favor `Service` in types, variables, and function names.

**Implications:**
- Module and file naming should reflect `Service` terminology in code.
- UI labels may localize "bill" for user clarity without affecting domain model terminology.
- Architecture and coding guides must enforce this convention consistently.

**Related documents:**
- `docs/architecture.md` (data flow examples)
- `docs/spec-backend.md` (module structure)
- `docs/spec-frontend.md` (component names)
- `docs/coding-guidelines.md`

---

## Decision 10: Documentation Authority Hierarchy

**Issue:** Multiple documents claimed authority over the same concerns (e.g., API response shape, date handling), risking conflicting implementations.

**Decision:** Documentation follows an explicit authority hierarchy per `docs/delivery-roadmap.md`:

1. `docs/prd-services-app.md` — product scope and user outcomes.
2. `docs/spec.md` — cross-feature functional requirements.
3. `docs/api-contract.md` — authoritative HTTP contract (frontend/backend boundary).
4. `docs/architecture.md` — module ownership and boundaries.
5. `docs/spec-backend.md`, `docs/spec-frontend.md` — implementation requirements.
6. `docs/ui-guidelines.md`, `docs/testing-guidelines.md`, `docs/coding-guidelines.md` — cross-cutting rules.

**Conflict resolution:**
- If two documents conflict, the higher-authority document takes precedence.
- Lower-authority documents must reference (not duplicate) decisions from higher levels.
- Changes to the API contract require synchronization with all lower-authority documents.

**Implications:**
- Implementations must check this hierarchy when resolving ambiguities.
- Pull request reviews must verify that changes don't violate hierarchy (e.g., backend spec claiming authority over a contract decision).

**Related documents:**
- `docs/delivery-roadmap.md` (Source of Truth Hierarchy section)

---

## When to Update This Document

Update `docs/decisions.md` when:
- A new architectural or product decision affects multiple documents.
- An existing decision is refined or reversed (record the reason and date).
- A semantic ambiguity discovered during implementation clarifies a term or behavior.

Do NOT update when:
- Making routine changes to code examples or rewording explanations (update the source document).
- Fixing typos or formatting (edit the source document directly).

Reviewers should ask: "Does this change affect a decision documented here?" If yes, update `docs/decisions.md` in the same PR.

---

**Version:** 1.0  
**Status:** Decisions Documented  
**Last Updated:** September 2026
