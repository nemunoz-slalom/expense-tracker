# Services App: Utility Bills Manager + Telegram Notifications

## Overview
The Services App shall allow users to manage utility bill records (electricity, gas, internet, mobile, water), receive automatic Telegram notifications, view billing-period trends, and export historical data.

---

# Functional Requirements

## Overview
The app shall provide complete bill management with smart sorting by urgency, Telegram notifications on creation and payment confirmation, billing-period analytics, and data export capabilities.

---

## Requirements

### FR-1: Create a bill
The user shall be able to create a new bill by providing service name, type, and due date, with an optional payment date.
- The service name is required and shall not be blank or whitespace-only.
- The service type is required and shall be one of: electricity, gas, internet, mobile, water.
- The payment date is optional; if provided, it shall be a valid calendar date.
- The due date is required and shall be a valid calendar date.
- When payment date is provided, the due date shall be greater than or equal to the payment date.
- After creation, the bill shall appear immediately in the bill list.
- Each bill shall have a unique identifier and a creation timestamp.
- A newly created bill shall default to unpaid status (`paid: false`).
- **Frontend-owned Undo timer:** When a bill is created with a `paymentDate`, the backend persists the bill immediately with `paid: false` and returns HTTP 201. The frontend then starts a local 8-second countdown timer. The user can click "Undo" to cancel this timer and delete the bill (no Telegram notification is sent). When the countdown expires naturally, the frontend calls `POST /api/services/:id/notify` to request the creation notification. If `paymentDate` is omitted, no timer is started and no creation notification is sent.

### FR-2: Read and list bills
The user shall be able to view all bills or filtered subsets of bills.
- The app shall display all bills if no filters are applied.
- Bills shall display: service name, type, payment date, due date, paid status, and status badge.
- Each bill shall be uniquely identifiable by its ID.
- The list shall load in under 2 seconds for up to 1000 bills.
- The user shall be able to view a single bill's details.

### FR-3: Sort bills by urgency
The app shall automatically sort bills by urgency without user action.
- Overdue bills (due date < today) shall appear first with a red badge (🔴 OVERDUE).
- Bills due within 7 days (today ≤ due date ≤ today + 7 days) shall appear second with a yellow badge (🟡 DUE SOON).
- Other bills (due date > today + 7 days) shall appear third with a gray badge (⚪ NORMAL).
- Paid bills shall always appear last with a green badge (✅ PAID), regardless of due-date urgency.
- Within each urgency group, bills shall be sorted by due date in ascending order (soonest first).
- Bills with the same due date shall use their unique identifier as a deterministic tie-breaker.
- The sorting shall be applied whenever the bill list is loaded, refreshed, or updated.

### FR-4: Edit a bill
The user shall be able to edit the service name, type, amount, payment date, due date, or paid state of an existing service, subject to the PATCH rules in `docs/api-contract.md`. Editing an existing service does not start or reset a creation notification timer.
- The app shall pre-fill the edit form with the current bill values.
- All field validations from FR-1 shall apply to edited values.
- After saving, the edited bill shall be reflected in the list.
- The updated bill shall maintain its unique identifier.
- An update operation shall fail if the bill no longer exists (clear error message).
- Editing one bill shall not modify any other bill.

### FR-5: Mark a bill as paid
The user shall be able to change a bill's status from unpaid to paid.
- The app shall update the paid status to true.
- After marking as paid, the bill shall display a green ✅ PAID badge.
- Marking an unpaid bill as paid shall set `paymentDate` to today on the backend, regardless of any payment date supplied in the same paid-transition request, and automatically trigger a Telegram notification (see FR-8).
- Marking a bill as paid shall not affect other bills.
- The user shall be able to view which bills are paid and which are unpaid.

### FR-6: Delete a bill
The user shall be able to delete an existing bill.
- The app shall display a confirmation dialog before deletion.
- After deletion, the bill shall no longer appear in the list.
- Deleting one bill shall not modify any other bill.
- Attempting to delete a bill that does not exist shall return a clear error message.
- A deleted bill shall be permanently removed from storage.

### FR-7: Undo Telegram notification (on bill creation)
The user shall be able to undo a bill creation before its automatic Telegram notification is sent.
- After creating a bill, the app shall display an 8-second countdown timer.
- The user shall have an "Undo" button visible during the countdown.
- If the user clicks "Undo" before the countdown reaches zero, the Telegram notification shall not be sent.
- If the countdown reaches zero without cancellation, the Telegram notification shall be sent automatically.
- The countdown timer shall be visually clear (circle animation or numeric display).
- If the user clicks "Undo", the bill creation shall be reverted and the app shall display a confirmation toast message.

### FR-8: Send Telegram notification
The app shall send automatic Telegram notifications in two scenarios.
- **Scenario A (on bill creation):** After creating a bill, following an 8-second Undo window (see FR-7 for Undo behavior).
  - The message shall include: service name and type.
  - Example message: "CFE (Electricity) $450.00 created"
- **Scenario B (on mark as paid):** Immediately when the user marks a bill as paid.
  - The message shall include: service name, type, and payment date.
  - Example message: "CFE (Electricity) $450.00 paid on Sep 15"
- The Telegram notification shall be sent only if a valid bot token and chat ID are configured.
- If the notification fails to send, the app shall log the error but not block the user action.
- The Telegram message shall be sent to the configured chat ID only.

### FR-9: Date filter
The app shall provide a single date-filter control with four presets and an optional custom range.
- Default on load: "This month" (day 1 through last day of the current month).
- Preset options: "This month", "Last month", "Custom range..." (opens Range Calendar), "All time".
- Trigger text adapts: month name for full months, date range for custom, "All time" when cleared.
- Selecting any option shall filter the bill list by due date in the corresponding date range. This ensures unpaid bills remain visible in the default current-month view.
- The filtered list shall remain sorted by urgency (per FR-3).

### FR-10: Filter by service type
The app shall provide a dropdown to filter bills by service type.
- Options: All, Electricity, Gas, Internet, Mobile, Water.
- Default: "All" (no filter).
- When a type filter is applied, the billing-period chart shall be displayed (see FR-11).

### FR-11: View billing-period chart
The app shall display a bar chart showing billing periods for a selected service type.
- The chart shall only appear when the user has filtered by a specific service type (FR-10).
- The chart shall show six billing periods derived from `dueDate` and service type.
- Electricity and gas shall use bimonthly periods; other service types shall use
  monthly periods.
- Paid and unpaid bills shall contribute when `amount` is not null.
- Bimonthly amounts shall be assigned in full and shall not be prorated.
- X-axis: billing periods. Y-axis: total amount per period, formatted as $X,XXX.
- The chart shall display the average across all six periods, including zeros.
- The chart shall use the palette tokens defined in `docs/ui-guidelines.md`.
- The chart shall render with smooth animations.
- The chart shall load in under 1 second.

### FR-12: Export bills to PDF
The user shall be able to download a PDF report of the currently displayed bills.
- The app shall provide an "Export to PDF" button in the filter panel.
- The PDF shall include:
  - Title: "Services Report"
  - Active filter period or "All Dates"
  - Table with columns: Service Name | Type | Payment Date | Due Date | Status
  - Count of paid bills and count of pending bills (no monetary total summed)
- The PDF shall use the same data as the current filtered view.
- The PDF download shall complete in under 5 seconds.
- The file shall be named descriptively using the active date range (e.g., "services_2026-09-01_2026-09-30.pdf").

### FR-13: Persist bill changes
The app shall persist every successfully added, edited, or deleted bill so that changes are reflected in subsequent requests.
- Failed operations shall not partially update the bill list.
- The app shall provide a clear error message if an operation cannot be completed.
- All bill data (including paid status and timestamps) shall be stored persistently.
- The app shall recover gracefully if the database is unavailable (clear error message).
- Deleting a bill shall permanently remove it from storage.

### FR-14: Display feedback and error messages
The app shall provide clear, immediate feedback for all user actions.
- On successful create: "✅ Service created"
- On successful edit: "✅ Service updated"
- On successful mark as paid: "✅ Paid"
- On successful delete: "✅ Deleted"
- On successful notification undo: "Reverted — edit and save again"
- On error: Clear message indicating what went wrong (e.g., "❌ Error saving")
- Toast messages shall auto-dismiss after 3 seconds.
- Form validation errors shall appear inline.

### FR-15: Responsive design
The app shall be usable on desktop and tablet devices.
- The bill list shall be readable on screens 768px wide or larger.
- Form inputs shall be touch-friendly (minimum 44px height).
- Charts shall resize responsively.
- Modal dialogs shall be centered and readable on all screen sizes.
- All animations shall be smooth and jank-free (60fps target).

### FR-16: Theme and styling
The app shall use the defined dark palette with consistent visual hierarchy. No off-palette hex values shall be introduced.
- Background: `#282a36`.
- Surface: `#44475a`.
- Primary text: `#f8f8f2`.
- Secondary text: `#6272a4`.
- Accent (interactive): `#8be9fd`.
- Accent hover/pressed: `#bd93f9`.
- Highlight: `#ff79c6`.
- Status badges shall use the defined palette colors:
  - Overdue: `#ff5555`
  - Urgent: `#f1fa8c`
  - Normal: `#8be9fd`
  - Paid: `#50fa7b`
  - Info (optional): `#ffb86c`
- All UI elements shall follow the defined color palette.
- UI labels for users shall be in English, sourced from i18n locale files via `react-i18next` (no hardcoded strings in components).
- All documentation, code, endpoints, and technical text shall be in English.

---

# Non-Functional Requirements

## Performance
- Bill list shall load in under 2 seconds (up to 1000 bills).
- Filters shall apply instantly without page reload.
- Charts shall render in under 1 second.
- PDF export shall complete in under 5 seconds.
- Animations shall run at 60fps (no jank).

## Data & Privacy
- All bill data shall be stored locally in SQLite (no cloud sync).
- Users shall own and manage their own Telegram bot token and chat ID.
- No data shall be shared externally.
- No user authentication required (personal use only).

## Reliability
- The app shall handle up to 1000 bills without performance degradation.
- Failed Telegram notifications shall log errors but not block user actions.
- The app shall recover gracefully if the database is unavailable.
- All CRUD operations shall be atomic (all-or-nothing).

## Compatibility
- The app shall work on modern browsers (Chrome, Firefox, Safari, Edge).
- The app shall work on tablet devices.

---

# Open Questions

1. Should users be able to add custom service types (beyond the 5 predefined)?
2. Should old bills archive automatically after a certain period?
3. Should the app suggest common service names (CFE, Claro, Infinitum, etc.)?
4. Should the app add physical consumption fields and metrics in a future version?
5. Should due date reminders be sent (e.g., 3 days before due date)?

---

# Out of Scope (Future Versions)

- Native mobile app
- Multiple user accounts
- Cloud sync across devices
- Integration with banking APIs
- Recurring bill templates
- Budget alerts and spending limits
- Multi-currency support
- Dark mode toggle (theme is fixed dark)
- Backup/restore functionality

---

# Acceptance Criteria: MVP

**All FRs (FR-1 through FR-16) must pass testing before release.**

- [ ] All CRUD operations work correctly
- [ ] Telegram notifications send on 8s delay and on mark as paid
- [ ] Notifications can be cancelled within 8s window
- [ ] Bills sort correctly by urgency
- [ ] All filters work individually and in combination
- [ ] Consumption-by-billing-period chart displays for selected type
- [ ] PDF export generates with correct data
- [ ] Defined palette applied throughout
- [ ] Framer Motion animations are smooth (60fps)
- [ ] All error cases handled with clear messages
- [ ] Unit tests pass (core logic)
- [ ] Integration tests pass (user flows)
- [ ] No console errors
- [ ] App is responsive on tablet (768px+)

---

**Version:** 3.0  
**Format:** Functional Requirements Specification  
**Status:** Ready for Development  
**Last Updated:** September 2026
