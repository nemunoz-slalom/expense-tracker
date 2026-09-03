# Product Requirements Document (PRD) - Services App

## 1. Overview

We are building a web app to manage recurring utility bills (electricity, gas, internet, mobile, water) with automatic Telegram notifications, smart sorting by urgency, and billing-period tracking. The app targets a single user managing personal household services, so it keeps things simple: no accounts, no cloud sync, and a local SQLite database. The MVP includes bill CRUD, Telegram notifications with an 8-second Undo window on create, urgency-based sorting, date/type filters, billing-period charts, PDF export, responsive UI, i18n, and accessibility.

---

## 2. MVP Scope

- **Bill CRUD**: Users can create, read, edit, and delete utility bills.
- **Data model & validation**:
  - `name`: required, non-empty string (e.g., "CFE", "Claro", "Infinitum")
  - `type`: `"electricity" | "gas" | "internet" | "mobile" | "water"`, required
  - `paymentDate`: optional ISO `YYYY-MM-DD`; when provided on creation the bill remains unpaid and enters the 8-second Undo/creation-notification flow; when omitted there is no creation notification
  - `dueDate`: required ISO `YYYY-MM-DD`, must be `>= paymentDate` when both are present
  - `amount`: optional decimal number (bill total in MXN, e.g., 450.50)
  - `paid`: boolean, defaults to `false`
- **Date filter**: A single dropdown with four presets — "This month" (default on load), "Last month", "Custom range..." (opens a Range Calendar), and "All time". The trigger text adapts: full month name when a whole month is selected, date range when custom, "All time" when cleared.
- **Smart sorting by urgency**: Bills displayed in this order:
  - Overdue first (`dueDate < today`)
  - Then urgent (`dueDate` within next 7 days)
  - Then normal (`dueDate > today + 7 days`)
  - Within each group, sorted by `dueDate` ascending
  - Ties broken by bill `id` (deterministic)
- **Status badges**: Visual indicators in every list view:
  - 🔴 OVERDUE (overdue)
  - 🟡 DUE SOON (urgent)
  - ⚪ NORMAL
  - ✅ PAID
- **Mark as paid**: Single-click action; changes bill status and triggers immediate Telegram notification.
- **Telegram notifications**:
  - On create with payment date filled: bill is saved immediately and an Undo toast appears with an 8-second countdown. If the user clicks "Undo" within that window, the bill is deleted and the form reopens with the previous values. If the countdown expires, the notification is sent and the bill remains.
  - On create without payment date: bill is saved immediately with no Undo toast and no notification.
  - On mark as paid: auto-fills payment date to today and sends notification immediately (no undo).
  - Message format: `"{name} ({type}) ${amount} paid on {date}"`
- **Delete confirmation**: Destructive action requires explicit confirmation in a dialog.
- **UI language**: User-facing labels in English, delivered via i18n key/value files (`react-i18next` with JSON locale files). Only English is shipped in the MVP, but the key-based architecture makes adding more locales a drop-in change.
- **Local storage only**: SQLite database file stored locally; no backend cloud, no cross-device sync.
- **Dark theme**: Fixed dark theme applied throughout the app, using the defined application palette.
- **UI component library**: [shadcn/ui](https://ui.shadcn.com/) is the design system for all interactive components (Button, Input, Select, Dialog, Toast, Table, Badge, Card, DatePicker, etc.). Components are copied into the codebase (not imported as a package), theming is done through CSS variables mapped to the defined application palette, and behavior is powered by Radix UI primitives + Tailwind CSS. Custom components extend shadcn/ui rather than replacing it.
- **Code and docs language**: All code, documentation, API endpoints, and technical text in English.

---

## 2.1 Reference Documents

- `docs/spec.md` — cross-feature functional requirements.
- `docs/api-contract.md` — authoritative frontend/backend HTTP contract.
- `docs/architecture.md` — system architecture and ownership.
- `docs/spec-backend.md` — backend implementation requirements.
- `docs/spec-frontend.md` — frontend implementation requirements.

## 3. Future Enhancements

- Physical consumption fields and measurements.
- Recurring bill templates and automatic bill generation.
- Additional analytics beyond billing-period analytics by service type.

---

## 4. Out of Scope

- Notifications by email or channels other than Telegram
- Recurring bill templates or auto-generation
- Multi-user support and authentication
- Cloud sync or cross-device access
- Native mobile apps
- Integration with banking or payment APIs
- Budget alerts, spending limits, or multi-currency support
- Light theme or dark/light mode toggle (theme is fixed dark)
- Backup and restore functionality
