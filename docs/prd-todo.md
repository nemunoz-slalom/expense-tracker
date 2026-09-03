# Product Requirements Document (PRD) - Services App Utility Bill Manager

## 1. Overview

The Services App is a personal web application for managing household utility
bills such as electricity, gas, internet, mobile, and water. It gives the user
a reliable view of upcoming and overdue obligations, supports quick bill
updates, and provides lightweight spending visibility.

The MVP is designed for a single user and stores data locally in SQLite. It
combines CRUD management, urgency-based sorting, date and service-type
filtering, billing-period analytics, PDF export, and best-effort Telegram
notifications. The product prioritizes clear status feedback, responsive
tablet-friendly interaction, accessibility, and predictable behavior over
multi-user or cloud capabilities.

## 2. MVP Scope

- **Bill management**
  - Create, view, edit, and permanently delete utility bills.
  - Support service types: electricity, gas, internet, mobile, and water.
  - Persist each service with a unique ID, creation and update timestamps,
    name, type, amount, payment date, due date, and paid state.
  - Default newly created services to unpaid.
  - Require a non-blank name and valid calendar dates in `YYYY-MM-DD` format.
  - Require a due date and enforce `dueDate >= paymentDate` when a payment date
    is provided.
  - Accept an optional finite, non-negative amount in MVP currency (MXN).
  - Apply edits only to the selected service and return a clear not-found error
    when it no longer exists.
  - Require confirmation before deletion and ensure failed operations do not
    partially change stored data.

- **Service API and persistence**
  - Provide the documented REST endpoints for create, list, get-one, update,
    delete, monthly statistics, and PDF export.
  - Use SQLite as the sole persistence store, with atomic CRUD operations and
    indexes needed for the supported filters and list size.
  - Use the frozen API contract in `docs/api-contract.md` as the source of
    truth for request shapes, response shapes, validation, status codes,
    filtering, sorting, and date semantics.
  - Return consistent JSON error objects containing `error` and `message`,
    except for `204 No Content` deletes and binary PDF responses.
  - Calculate response status server-side and do not persist it:
    `overdue`, `urgent`, `normal`, or `paid`.

- **Urgency sorting and status**
  - Sort unpaid overdue services first, followed by services due today through
    the next seven days, followed by other unpaid services.
  - Always place paid services last, regardless of due date.
  - Sort within each group by due date ascending and use service ID as the
    deterministic tie-breaker.
  - Display status using text labels and icons/badges as well as palette colors:
    overdue, due soon, normal, and paid.
  - Reapply sorting whenever the list is loaded, filtered, refreshed, or
    updated.

- **Paid-state workflow**
  - Provide a direct action to mark an unpaid service as paid.
  - On the unpaid-to-paid transition, set `paymentDate` to the server's local
    current date, ignoring any conflicting payment date in that request.
  - Send the mark-as-paid Telegram notification immediately and do not send a
    duplicate notification for repeated updates to an already-paid service.

- **Telegram notifications and creation Undo**
- When a service is created with a payment date, save it immediately. The
  frontend owns a local, service-specific eight-second notification countdown.
  - Show an eight-second countdown and an **Undo** action during that window.
  - If Undo is selected before the timer expires, delete the created service,
    cancel its notification, and reopen the form with the original values.
  - If the timer expires, send the creation notification and keep the service.
  - When a service is created without a payment date, do not start a timer or
    send a creation notification.
  - Send notifications only when both `TELEGRAM_BOT_TOKEN` and
    `TELEGRAM_CHAT_ID` are configured.
  - Format messages with service name, type, amount when present, and payment
    date when applicable.
  - Treat Telegram failures as best-effort: log the failure without blocking
    or rolling back the primary bill operation, and never expose credentials.

- **Filtering and billing-period analytics**
  - Provide a date filter defaulting to **This month**, with **Last month**,
    **Custom range**, and **All time** options.
  - Filter the list by inclusive due-date boundaries while preserving urgency
    sorting.
  - Provide a service-type filter with **All** and each of the five supported
    service types; combine filters with AND semantics.
  - Display a billing-period chart only when a specific service type is
    selected.
  - Derive billing periods from due dates and service type. Electricity and gas
    use bimonthly periods; other services use monthly periods.
  - Include paid and unpaid services when `amount` is not null, without
    prorating bimonthly amounts.
  - Request six billing periods, include zero-value periods, and calculate the
    average across all six periods.

- **PDF export**
  - Provide an **Export to PDF** action in the filter panel.
  - Export exactly the currently filtered and urgency-sorted service set.
  - Include the title **Services Report**, active date period or **All Dates**,
    a table of service name, type, payment date, due date, and status, plus
    paid and pending counts.
  - Use a descriptive filename based on the active date range and complete the
    download within five seconds for the MVP dataset.

- **User experience, accessibility, and localization**
  - Use a fixed dark theme with the palette defined in
    `docs/ui-guidelines.md`; do not introduce off-palette colors.
  - Build interactive controls from shadcn/ui primitives with Tailwind CSS,
    Radix accessibility behavior, and Framer Motion enhancements.
  - Keep the interface usable at widths of 768px and above, with touch-friendly
    controls and responsive charts and dialogs.
  - Provide loading, empty, success, validation, and error feedback; success
    toasts auto-dismiss after three seconds.
  - Source all user-facing strings, including labels, toasts, errors, and
    accessible names, from English i18n locale files via react-i18next.
  - Preserve keyboard navigation, focus management, screen-reader semantics,
    WCAG 2.1 AA contrast, and reduced-motion preferences.

- **Quality and operational expectations**
  - Load up to 1,000 services in under two seconds, render statistics in under
    one second, and complete PDF export in under five seconds.
  - Keep frontend and backend layers separated according to
    `docs/architecture.md`; components do not call `fetch`, and repositories
    contain all SQL.
  - Cover core validation, sorting, status, filtering, persistence,
    notification timing, API flows, and critical user journeys with isolated
    unit, integration, and E2E tests.
  - Use Chromium-only Playwright E2E coverage for the critical journeys,
    including create, Undo, payment, edit, delete, filtering/chart, and export.

## 3. Post-MVP Scope

- Support custom service types in addition to the five predefined MVP types.
- Archive old services automatically after a configurable retention period.
- Suggest common service names such as CFE, Claro, and Infinitum.
- Add physical consumption fields, measurements, and related metrics.
- Add due-date reminders, such as notifications three days before a due date.
- Add recurring bill templates and automatic bill generation.
- Add advanced analytics and reporting beyond billing-period analytics by
  service type.
- Add additional localization files beyond the English MVP locale.

## 4. Out of Scope

- User authentication, authorization, accounts, or multi-user collaboration.
- Cloud synchronization, cloud databases, or cross-device access.
- Native mobile applications.
- Banking, payment-provider, or financial-account integrations.
- Email notifications or notification channels other than Telegram.
- Real-time WebSocket updates.
- Budget alerts, spending limits, or multi-currency support.
- A light theme or a user-selectable theme; the MVP theme is fixed dark.
- Backup and restore functionality.
- Persistent notification-job storage; creation countdowns remain frontend-owned
  local state.
- Exposing Telegram operations as a public frontend API.
