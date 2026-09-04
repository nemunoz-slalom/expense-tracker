# Data Model: Complete Production Readiness

## Durable entity: Service

`Service` is the only product entity persisted by the MVP. It represents one utility bill and maps directly to the Service model in the frozen API contract.

| Field | Durable representation | Required | Rules |
|---|---|---:|---|
| `id` | SQLite integer primary key | generated | Stable, positive identifier; never changes after creation. |
| `name` | text | yes | Trimmed/non-blank; whitespace-only is invalid. |
| `type` | text | yes | Exactly `electricity`, `gas`, `internet`, `mobile`, or `water`. |
| `amount` | nullable numeric | no | `null` or finite number greater than or equal to zero. Zero is valid. |
| `paymentDate` | nullable `YYYY-MM-DD` text | no | A real calendar date when present; must not be later than `dueDate`. May be present while `paid` is false after creation. |
| `dueDate` | `YYYY-MM-DD` text | yes | A real calendar date. |
| `paid` | boolean-compatible integer | yes | `false` on create; represented safely as 0/1 at storage boundary. |
| `createdAt` | ISO 8601 UTC datetime text | generated | Set once during successful insert. |
| `updatedAt` | ISO 8601 UTC datetime text | generated/updated | Set during successful insert and every successful update. |

Repository mapping converts storage booleans/numerics into the plain Service domain object. It must not expose raw driver rows or storage-specific names.

## Non-durable derived entities

| Entity | Inputs | Rule and use |
|---|---|---|
| `ServiceStatus` | `paid`, `dueDate`, server-local today | `paid` wins; otherwise overdue before today, urgent through seven calendar days ahead, normal after that. Returned on every CRUD/list response and used for ordering; never stored. |
| `ServiceFilter` | `month`, `from`, `to`, `type`, `paid` query values | A validated selection definition. Date conditions apply to `dueDate`, are inclusive, and combine with type/paid by AND. `month` follows the frozen contract's precedence/ambiguity rule. |
| `BillingPeriod` | `type`, `dueDate`, server-local current month, requested period count | Derived at statistics query time. Monthly types use one prior calendar month; electricity/gas use the two prior calendar months. The requested series is generated oldest-to-newest before aggregation and is never stored. |
| `ConsumptionStats` | `ServiceFilter` is not an input; Service records and `BillingPeriod` are | Contract statistics response: requested type, exactly N zero-filled periods, full non-null amounts, and average across all N values. Paid state/payment date do not affect it. |
| `NotificationAttempt` | Service, trigger (`creation` or `paid`) | Ephemeral, best-effort external effect. It has no table, job, timer, retry queue, or durable delivery status. Redacted operational records may document attempts/failures. |
| `ExportReport` | validated list filter plus ordered Service responses | Ephemeral PDF binary with title, active period/all-dates label, selected Services, statuses, and paid/pending counts. |

## Relationships

- One `Service` can produce many ephemeral response projections over time; these are not database relationships.
- A `BillingPeriod` aggregates zero or more Services of one selected type during a statistics request.
- A `NotificationAttempt` refers to an existing Service at send time. Deleting a Service prevents a later notify endpoint call from finding it; the request returns the contract's not-found outcome.
- An `ExportReport` is a snapshot generated from one filtered ordered Service selection and is not retained.

## State transitions

### Paid state

| Current state | Request/effect | Next state | Required behavior |
|---|---|---|---|
| New input | valid create | unpaid (`paid: false`) | Persist immediately. A supplied `paymentDate` does not mark the record paid. |
| Unpaid | PATCH that does not set `paid: true` | unpaid | Merge permitted supplied fields, validate complete resulting Service, update timestamp. |
| Unpaid | PATCH `paid: true` | paid | Backend overrides `paymentDate` with server-local today, persists atomically, then attempts one immediate paid notification. Delivery failure does not reverse persistence. |
| Paid | PATCH `paid: true` | paid | Update only permitted supplied values after complete-state validation; do not send a duplicate paid notification. |
| Paid | PATCH `paid: false` if allowed by the frozen request model | unpaid | Validate resulting state; do not create a creation Undo timer or notification. |
| Any existing state | DELETE | absent | Permanently delete without a Telegram notification. |

### Creation-notification lifecycle

This lifecycle is client-local and does not change Service persistence state.

| Condition | Browser action | Server action |
|---|---|---|
| Create response has `paymentDate` | Start independent 8-second local timer and show Undo. | No timer and no notification. |
| Undo before expiry | Cancel local timer, call DELETE, restore form values/feedback. | Delete the Service; no notification. |
| Timer natural expiry | Call `POST /api/services/:id/notify` once. | Look up existing Service and best-effort send creation message; return no content on valid request. |
| Create response has no `paymentDate` | No timer, no Undo UI, no notify call. | No notification. |
| Service absent at notify | Stop local lifecycle and surface appropriate recoverable feedback. | Return contract not-found response; no notification. |

## Validation and consistency rules

1. Validate body/query shape and identifiers before database access or Telegram calls.
2. Calendar validation must reject malformed and impossible dates, including invalid leap-day values; a format-only regular expression is insufficient.
3. On create, reject omitted required fields, invalid type/paid values, non-finite/negative amount, blank name, and `paymentDate > dueDate`.
4. On PATCH, merge supplied allowed fields into the persisted Service and validate the **complete resulting record** before the transaction. Unknown/invalid fields receive the documented validation response.
5. A false-to-true `paid` transition substitutes server-local today before complete-state validation/persistence, regardless of a conflicting supplied payment date.
6. All durable mutations are transactions: success changes exactly the targeted record, failure changes none.
7. Derived status, filter selection, report selection, and billing period are recalculated rather than saved.
8. Error responses never serialize driver exceptions, database paths, tokens, chat identifiers, or internal stack details.

## Storage indexes and query support

| Index/constraint | Supports | Reason |
|---|---|---|
| Primary key on `id` | get/update/delete/notify lookup | Stable direct targeting. |
| Type constraint | all type-based data validity | Rejects values outside the closed ServiceType set at storage boundary. |
| Paid boolean constraint | valid durable state | Prevents invalid values from bypassing service validation. |
| Non-negative amount check permitting null | amount integrity | Reinforces domain validation while preserving absent amounts. |
| Index on `(dueDate)` | month/range list and export filters | Primary date-selection predicate. |
| Index on `(type, dueDate)` | type-filtered lists and statistics source reads | Supports type/date access without storing a billing period. |
| Index on `(paid, dueDate)` | paid/date combined consumer filters | Supports optional paid filtering plus ordered selection. |

Final index selection is validated using query plans and representative 1,000-Service data. No index exists for derived status or billing period because neither is durable.
