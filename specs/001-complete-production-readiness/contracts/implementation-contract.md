# Implementation Integration Contract

## Authority and freeze

[`docs/api-contract.md`](../../../docs/api-contract.md) is the frozen, authoritative HTTP contract. It exclusively defines endpoint paths, methods, request/response bodies, response envelopes, validation, status codes, error shape, filtering, sorting, server-local time semantics, statistics, PDF behavior, and notification behavior.

This artifact creates **no endpoint, field, error, or behavioral change**. Backend and Frontend workstreams implement against the authoritative contract and must not independently reinterpret or modify it. A needed contract change follows the change process stated in `docs/api-contract.md`: update that document first, record the reason in the relevant issue/PR, and update affected specifications/tests before implementation continues.

## Integration commitments

### Backend/API owner

- Implement all and only the API behaviors specified by the frozen contract, including JSON envelopes, no-content responses, binary PDF response, and client-safe error JSON.
- Register `/api/services/stats/type/:type` and `/api/services/export/pdf` before parameterized service-ID routes.
- Validate HTTP shape and route/query values, delegate to services, and translate typed errors; do not run SQL or business rules in routes.
- Calculate `status` server-side for every Service response and never persist it.
- Derive billing periods only during the statistics request. Do not add a `periodDate`, report, or notification-job data model.
- Preserve server-local time semantics consistently for status, false-to-true paid transitions, and statistics anchoring.
- Send Telegram only behind the external client boundary. Creation notifications are sent only when the notify endpoint is called; paid notifications occur only for false-to-true transitions; all delivery failures are non-blocking and redacted/logged.

### Frontend/UI owner

- Treat the frozen response types and error shape as the API-service boundary; browser `fetch` occurs only in `client/src/api/`.
- Include only contract-supported query values for list and export, and pass active date/type/paid filters consistently so the report represents the visible selection.
- Render server-returned `status`; do not create a competing client status authority.
- Own the creation Undo timer locally: start after successful create only when `paymentDate` is present, delete and cancel on Undo, notify once on natural expiry, and never expect an API timer field or server scheduling.
- Call statistics only for a selected concrete type, render contract period identifiers as localized labels without parsing display text, and never derive chart values from the filtered list.
- Keep Telegram tokens/chat IDs out of public runtime configuration, browser state, errors, diagnostics, and source artifacts.

### Shared integration behavior

- Use `YYYY-MM-DD` only for API date values and ISO 8601 datetimes for timestamps.
- Use contract ServiceType values exactly; UI labels are presentation/i18n concerns, not values transmitted in altered form.
- Preserve the contract's list/export ordering and inclusive due-date filter semantics. Do not introduce client-side ordering that changes server order.
- Keep API base URL configurable via public `REACT_APP_*` configuration only; configure backend CORS to accept explicitly allowed local client origins.
- Handle `400`, `404`, `409` when applicable, and `500` through typed API errors that are rendered as accessible localized feedback without exposing internals.

## Contract conformance evidence

| Boundary | Evidence before integration merge |
|---|---|
| Backend route boundary | Fresh-SQLite integration tests prove representative success, validation, missing-resource, and unexpected-failure outcomes per frozen endpoint. |
| Frontend API boundary | Mocked transport tests assert method, path, query/body serialization, typed parsing, and accessible error behavior. |
| Notifications | Fake-timer frontend tests and stubbed-Telegram backend tests prove creation/Undo/expiry and one-time paid-transition behavior. |
| Statistics/export | Deterministic date tests prove fixed-length zero-filled series and that list/export share selection/order. |
| Full stack | Chromium POM tests prove the documented seven critical journeys using test ports and no real Telegram delivery. |

## Non-negotiable boundaries

- No browser-to-Telegram communication.
- No backend creation Undo timer, timer handle, queue, schedule, or cancellation endpoint.
- No API-contract edits as part of parallel implementation without the documented owner-approved change process.
- No client secrets, no unparameterized SQL, no raw database errors, and no production database use from tests.
