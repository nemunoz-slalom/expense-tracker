# Services App - Frontend Specification

## Overview
The Services App frontend shall provide a responsive, dark-themed web interface for managing utility bills with intuitive forms, smart sorting visualization, real-time filtering, billing-period charts, and smooth animations powered by Framer Motion. The frontend follows the layered architecture defined in `architecture.md`: components → hooks → API services → backend, with shared types as a leaf module.

Related project documents:
- `../spec.md` — cross-feature functional requirements.
- `prd-services-app.md` — product scope.
- `api-contract.md` — authoritative HTTP contract.
- `architecture.md` — frontend and backend boundaries.
- `ui-guidelines.md` — UI and accessibility rules.
- `testing-guidelines.md` — test strategy.
- `coding-guidelines.md` — coding conventions.

## Contract Usage

`docs/api-contract.md` is the frozen frontend/backend boundary. This specification may describe implementation behavior, but it must not redefine endpoint names, HTTP methods, request shapes, response shapes, validation semantics, filter semantics, or date semantics. If a conflict is discovered, stop implementation and resolve the contract before proceeding.


---

# Functional Requirements

## Overview
The frontend shall render bill management UI, handle user interactions, communicate with the backend API, display status-based visual feedback, and implement smooth animations throughout the application.

---

## Requirements

### FR-1: Initialize application
The frontend shall load and display the app with correct theme on first render.
- The app shall load in under 2 seconds (initial page load).
- The defined dark palette shall be applied to all elements on startup.
- The main layout shall display: header, filter panel, bill list, and charts (if filtered).
- The app shall make a GET request to `/api/services` as defined by `api-contract.md` to load initial bill data.
- If the API is unavailable, display an error message: "Could not connect to server".
- The app shall store the API base URL in an environment variable (REACT_APP_API_URL).
- The page title shall be "Services App" or similar.

### FR-2: Display bill list
The frontend shall render a list of bills with all relevant information.
- Each bill shall display: service name, type, amount (formatted as `$ X,XXX.XX` if set), payment date (if set), due date, and status badge.
- Due and payment dates shall be displayed in English as `Weekday DD, Mon.` (for example, `Tuesday 04, Aug.`). If the payment date is the current local date, it shall be displayed as `Today`.
- Display formatting shall not alter the `YYYY-MM-DD` values exchanged with the API.
- The list shall use shadcn `Table` on desktop and tablet (≥768px) and shadcn `Card` on mobile (<768px, graceful degradation).
- Bills shall be sorted by urgency as received from the backend.
- Each bill item shall have a unique visual identifier.
- The bill list shall refresh whenever filters change or operations complete.
- While loading data from the backend, the list shall display shadcn `Skeleton` placeholders matching the row/card layout.
- The app shall display a message "No bills recorded" if the list is empty (after loading completes). The "+ New bill" button shall always remain at the top of the page, not inside the empty state.
- The list shall handle up to 1000 bills without performance degradation.
- Each bill row/card shall display a "Mark as paid" button (visible, primary action) and a kebab menu (⋮) containing "Edit" and "Delete".
- If the bill is already paid, the "Mark as paid" button shall not appear; only the kebab menu (⋮) with "Edit" and "Delete" shall be visible.
- The kebab menu shall use shadcn `DropdownMenu` triggered by an icon button (`Button` variant ghost, size icon) with an accessible label.

#### Table row column order (desktop/tablet ≥768px)

Columns shall appear in this exact order, left to right:

| # | Column | Content | Format | Notes |
|---|--------|---------|--------|-------|
| 1 | Name | Service name | Plain text | Left-aligned, font-weight 500 |
| 2 | Type | Service type | Plain text | Electricity, Gas, Internet, Mobile, Water |
| 3 | Status | Urgency badge | `Badge` component | OVERDUE (red), DUE SOON (orange), UPCOMING (cyan), PAID (green) |
| 4 | Amount | Bill total | `$ X,XXX.XX` or "—" if not set | Right-aligned |
| 5 | Payment Date | Date paid | `MMM DD` (e.g., "Sep 15") or "—" if not set | Center-aligned |
| 6 | Due Date | Deadline | `MMM DD` (e.g., "Sep 20") | Center-aligned |
| 7 | Actions | Action buttons | Buttons, right-aligned | See layout below |

#### Actions column layout

The actions cell shall use `display: flex`, `justify-content: flex-end`, `align-items: center`, and a fixed `gap` between elements. The kebab button (⋮) is always the rightmost element and does not shift position regardless of whether "Mark as paid" is visible.

**Unpaid bill:**
```
[Mark as paid]  [⋮]
```

**Paid bill:**
```
                [⋮]
```

- "Mark as paid": `Button` variant `default`, visible only when `paid === false`.
- Kebab ⋮: `Button` variant `ghost`, size `icon`, always present, always anchored to the right edge of the cell.
- The kebab menu (`DropdownMenu`) contains two items: "Edit" and "Delete".

#### Card layout (mobile <768px)

Each bill renders as a shadcn `Card`. Content is stacked vertically:

```
┌─────────────────────────────────┐
│ CFE                     OVERDUE │  ← CardHeader: name (left) + Badge (right)
│ Electricity · $ 450.00          │  ← CardContent line 1: type + amount
│ Due: Sep 05 · Paid: Sep 15      │  ← CardContent line 2: dates
│                [Mark as paid] [⋮]│  ← CardFooter: actions (right-aligned)
└─────────────────────────────────┘
```

- **CardHeader:** Service name (left-aligned, font-weight 600) and status `Badge` (right-aligned).
- **CardContent line 1:** Type and amount separated by " · ". Amount shows "—" if not set.
- **CardContent line 2:** "Due: MMM DD" always shown. "Paid: MMM DD" shown only if payment date is set; otherwise omitted.
- **CardFooter:** Actions right-aligned, same layout as table (Mark as paid + kebab ⋮, or just kebab ⋮ if paid).
- Cards are separated by 8px vertical gap.
- Cards use the defined Surface (`#44475a`) background with 1px border.

### FR-3: Display status badges
The frontend shall show visual status indicators for each bill using badges.
- Overdue bills (dueDate < today) shall show a red OVERDUE badge.
- Bills due within 7 days shall show an orange DUE SOON badge.
- Bills due more than 7 days away shall show a cyan UPCOMING badge.
- Paid bills shall show a green PAID badge.
- Badge colors shall match the defined palette (red: #ff5555, orange: #ffb86c, cyan: #8be9fd, green: #50fa7b)
- Badge styling shall be consistent across all bill items.
- The badge shall update immediately when a bill's status changes.

### FR-4: Create bill form
The frontend shall provide a form to create new bills with validation feedback.
- The form shall be displayed in a modal (shadcn `Dialog`).
- Form fields (English labels):
  - "Service name" (text input) - required
  - "Service type" (select dropdown) - required, options: Electricity, Gas, Internet, Mobile, Water
  - "Amount" (currency-formatted text input with decimal keypad) - optional; displayed as `$ X,XXX.XX` when present and normalized to a number before the API request
  - "Due date" (shadcn `Calendar` in a `Popover`) - required
  - "Payment date" (shadcn `Calendar` in a `Popover`) - optional and shown after Due date; when omitted the bill is saved without triggering a Telegram notification or Undo toast
- A selected date shall render in the trigger as `Weekday DD, Mon.` (for example, `Tuesday 09, Sep.`), while the submitted value remains `YYYY-MM-DD`.
- Choosing a date closes its `Popover`.
- When Payment date is selected, an accessible inline X action within the date field shall clear it; this action is not shown while the optional field is empty.
- The "Save" button shall be disabled until all required fields (name, type, due date) are filled. Payment date does not block Save.
- Form buttons: "Save" (primary, disabled until valid), "Cancel" (outline)
- Clicking "Cancel" while the form has unsaved changes shall prompt a confirmation ("Discard changes?"); on confirm the modal closes without saving, on cancel the modal stays open with values intact.
- The form shall validate on submit:
  - Name, type, and due date required (show inline error if empty)
  - If payment date is filled, due date >= payment date (show error if invalid)
  - Service name must not be whitespace-only
- On successful submit, POST to `/api/services` with form data.
- After creation:
  - If payment date was filled → the modal closes, the bill appears in the list, and an Undo toast is displayed (see FR-5).
  - If payment date was empty → the modal closes, the bill appears in the list, a simple success toast "✅ Service created" is displayed (no Undo, no countdown).
- On error, keep the form open, re-enable inputs, and display an error toast with the error message so the user can correct and retry.

### FR-5: Undo toast (on bill creation)
The frontend shall display a persistent Undo toast for 8 seconds after creating
a bill, allowing the user to revert the creation. The 8-second timer is a
**frontend-local timer owned entirely by the frontend**; the backend does not
create, own, persist, schedule, or cancel it.
- The toast shall appear in the bottom-right of the viewport, above any other toasts already visible.
- The local timer starts only after `POST /api/services` returns `201` and only when a `paymentDate` was supplied.
- Toast contents:
  - Message: "✅ Service created — Sending notification in {N}s" where {N} counts down 8 → 0 in whole seconds.
  - A horizontal progress bar (shadcn `Progress`) that depletes smoothly over 8 seconds.
  - An "Undo" button, always enabled during the countdown.
- Clicking "Undo" within the 8-second window:
  - Cancels the local timer so `/notify` is never called.
  - Sends DELETE to `/api/services/:id` for the just-created bill. DELETE sends no Telegram notification.
  - Closes the Undo toast.
  - Removes the bill from the list.
  - Reopens the create-bill form pre-filled with the values the user just submitted, so they can correct and resubmit.
  - Displays a brief info toast: "Reverted — edit and save again".
- If the countdown reaches 0 without action:
  - The frontend calls `POST /api/services/:id/notify` exactly once, and the backend sends the Telegram notification.
  - The toast fades out.
  - A `404` from `/notify` (the bill was already deleted) is ignored silently.
- Multiple Undo toasts may stack if the user creates several bills in quick succession; each toast owns its own independent local timer and Undo action.
- Pending local timers are lost on page reload; no creation notification is sent for them, and no server-side state is affected.
- The countdown display shall use Framer Motion for smooth animation.
- The Undo action shall be keyboard-accessible: the toast shall be focusable and the Undo button reachable via Tab.
- The toast shall not block the user from interacting with the rest of the app; other bills can be created, edited, or deleted while an Undo toast is visible.

### FR-6: Edit bill form
The frontend shall provide a form to edit existing bills with pre-filled data.
- The edit form shall use the same field structure and validation rules as the create form, but editing an existing service shall never start or reset the creation notification timer. Its title shall be "Edit service".
- The form shall pre-fill all fields with current bill data.
- On successful submit, PATCH to `/api/services/:id` with the updated data. The frontend shall send only the fields being edited and shall follow the PATCH semantics in `api-contract.md`.
- If the due date changes, validation rules apply (due date >= payment date).
- After successful edit, close the form and refresh the bill list.
- Display a success toast: "✅ Service updated"
- On error, display an error toast with the error message.
- The "Cancel" button shall close the form without saving.

### FR-7: Mark bill as paid
The frontend shall allow marking a bill as paid with a single click.
- Each unpaid bill shall display a visible "Mark as paid" button (outside the kebab menu for quick access).
- Clicking the button shall:
  - Disable the button temporarily (show loading state).
  - Send PATCH to `/api/services/:id` with `{ paid: true }`. The backend owns the payment date assignment and preserves the existing amount.
  - On success, refresh the bill list and display a success toast: "✅ Paid".
  - The bill shall update immediately (badge changes to PAID, "Mark as paid" button disappears, only kebab menu remains).
- The backend sends a Telegram notification immediately (no Undo for mark-as-paid).
- On error, display an error toast and re-enable the button.
- There shall be no confirmation dialog (direct action).

### FR-8: Delete bill
The frontend shall allow deleting a bill with confirmation.
- Each bill shall display a "Delete" button.
- Clicking the button shall open a confirmation dialog:
  - Title: "Delete service?"
  - Body: "{name} ({type})"
  - Buttons: "Confirm", "Cancel"
- Clicking "Confirm" shall:
  - Send DELETE to `/api/services/:id`
  - On success, close the dialog, refresh the bill list, and display a success toast: "✅ Deleted"
  - The deleted bill shall disappear from the list immediately
- Clicking "Cancel" shall close the dialog without deleting.
- On error, display an error toast.

### FR-9: Date filter (dropdown with presets + date pickers)
The frontend shall provide a single date-filter control combining preset options and a custom range picker.
- The control shall render as a dropdown trigger (shadcn `Popover`) whose text reflects the active selection.
- On app load, the control shall default to "This month" (day 1 through last day of the current month).
- Clicking the trigger shall open a dropdown with four options:
  - **This month** — selects the full current calendar month.
  - **Last month** — selects the full previous calendar month.
  - **Custom range...** — reveals one shadcn Calendar in range mode inside a Popover. Selecting both ends applies the values immediately and closes the Popover.
  - **All time** — clears the date filter and shows all bills regardless of date.
- A checkmark shall appear next to the currently active preset.
- Trigger text shall adapt to the active selection:
  - Full current month → month name only (e.g., "September").
  - Full previous month → month name only (e.g., "August").
  - Custom range → formatted dates (e.g., "Sep 05 – Sep 20").
  - All time → "All time".
- Selecting any option shall:
  - Close the Popover.
  - Send GET to `/api/services` with the appropriate query params (`month=YYYY-MM` for full due-date months, `from=YYYY-MM-DD&to=YYYY-MM-DD` for custom due-date ranges, no date params for All time).
  - Refresh the bill list with filtered results.
- The filtered list shall remain sorted by urgency (from backend), with paid services last.

### FR-10: Filter by service type
The frontend shall provide a dropdown to filter bills by service type.
- Display a select element (shadcn `Select`) labeled "Type" with options: All, Electricity, Gas, Internet, Mobile, Water.
- The select shall default to "All" (no filter).
- Selecting a type shall:
  - Send GET to `/api/services?type={type}` (combined with any active date filter).
  - Refresh the bill list with filtered results.
  - Trigger the billing-period chart to appear (see FR-11).
- The filtered list shall remain sorted by urgency (from backend), with paid services last.
- Selecting "All" shall clear the type filter, hide the billing-period chart, and show all bills.

### FR-11: Display consumption-by-billing-period chart
The frontend shall show a consumption bar chart grouped by billing period when a
specific service type filter is applied.
- The chart shall only appear when the user has filtered by a specific type (not when showing "All").
- The chart shall display data from GET `/api/services/stats/type/{type}?periods=6`, using the response defined in `api-contract.md`.
- `periods` defaults to 6 and must be an integer in the range 1–12.
- Chart type: shadcn Chart component (Recharts-based, auto-themed with the defined palette CSS variables).
- X-axis: the returned billing periods, oldest to newest, derived from `dueDate` and service type.
- The API returns machine-readable period identifiers (`YYYY-MM` monthly, `YYYY-MM..YYYY-MM` bimonthly). The frontend formats them for display (`Feb 2026`, `Jan–Feb 2026`) and shall not depend on the display string.
- Y-axis: Total amount per billing period, formatted as $X,XXX.
- Billing frequency: electricity and gas bill every 2 months; internet, mobile, and water bill every 1 month.
- `periodEnd` is the calendar month immediately before the `dueDate` month; monthly services use `periodStart = periodEnd`, bimonthly services use `periodStart = periodEnd` minus one calendar month.
- A bimonthly bill is one bar carrying its full amount; amounts are never prorated or split.
- Each bill contributes only to the billing period derived from its own `dueDate` and service type; the backend never remaps a bill into a different period, and bills whose derived period is outside the returned series are absent from the response.
- Paid and unpaid services with a non-null amount contribute; null-amount services are excluded.
- `paymentDate`, `paid`, and the bill list's due-date filter shall not affect the chart.
- Zero-value billing periods shall be rendered, not omitted.
- Chart title identifies the service type and billing-period range.
- Include a legend or label showing the average across all returned periods, including zero-value periods.
- Chart colors shall use the defined palette.
- Chart animations shall use Framer Motion (bars animate in on load).
- Chart shall render in under 1 second.
- If no data is available, display "No data for this service".

### FR-12: Export to PDF
The frontend shall provide a button to download bill data as PDF.
- Display a button labeled "Export PDF" in the filter panel (shadcn `Button` variant outline).
- Clicking the button shall:
  - Determine the current filters (date, type).
  - Build the query string for GET `/api/services/export/pdf` using the same filters defined in `api-contract.md`.
  - Trigger a file download (browser's download functionality).
  - Display a success toast: "✅ PDF downloaded".
- The PDF filename shall be auto-generated by the backend.
- If no bills match the current filters, display a warning: "No data to export".
- On error, display an error toast.


### FR-13: Display toast messages
The frontend shall show brief, auto-dismissing notification toasts for user feedback.
- Toast types: success (green), error (red), info (blue).
- Position: top-right corner.
- Auto-dismiss after 3 seconds.
- Multiple toasts shall stack vertically.
- Success toasts: "✅ Service created", "✅ Paid", "✅ Deleted", "✅ Updated"
- Error toasts: "❌ Error saving", with specific error message if available.
- Toasts shall use Framer Motion for slide-in/fade-out animations.
- Toasts shall be dismissible by clicking an X button.

### FR-14: Display error states
The frontend shall handle API errors gracefully and provide clear feedback.
- If the API is unreachable on load, display: "Could not connect to server"
- If a CRUD operation fails, display an error toast with the error message.
- If a Telegram notification fails, no error is shown to the user (backend handles silently).
- Form validation errors shall appear inline above or below the problematic field.
- If a bill is deleted while the user is viewing it (race condition), display: "This service no longer exists"

### FR-15: Responsive design
The frontend shall be usable on desktop and tablet devices.
- The app shall be responsive at viewports 768px wide and larger.
- On smaller screens, hide non-essential UI elements or stack them vertically.
- Form inputs shall be at least 44px tall for touch-friendliness.
- Bill list shall adapt to screen width (cards on small, table on large).
- Charts shall resize responsively to fit the screen.
- Modals and dialogs shall be centered and readable on all screen sizes.
- All text shall remain legible (no tiny fonts).

### FR-16: Animations and transitions
The frontend shall implement smooth animations using Framer Motion throughout.
- **ServiceItem (bill row/card):**
  - Entrance: fade in + slide left (duration 0.3s)
  - Hover: scale 1.02
  - Exit (on delete): fade out + slide right (duration 0.3s)
  - Status badge color change: smooth transition (0.2s)
- **ServiceForm modal:**
  - Entrance: scale up + fade in (duration 0.3s)
  - Background overlay: fade in (duration 0.2s)
  - Exit: scale down + fade out (duration 0.3s)
- **UndoToast countdown:**
  - Circular stroke animation: deplete smoothly over 8 seconds (linear timing)
  - Pulse effect when 3 seconds remain
  - Fade out on completion
- **ConsumptionByPeriodChart:**
  - Container: fade in + slide up (duration 0.5s)
  - Chart bars: stagger animation (each bar animates in sequentially)
  - Hover on bar: highlight effect
- **Toast messages:**
  - Entrance: slide in from right + fade in (duration 0.3s, spring timing)
  - Exit: slide out to right + fade out (duration 0.3s)
- **DeleteConfirmation modal:**
  - Entrance: scale + fade (spring animation, bounce effect)
  - Shake effect when confirming delete
- All animations shall run at 60fps (no jank or stuttering).
- Animations shall be performant (use GPU-accelerated transforms).

### FR-17: Defined palette styling
The frontend shall apply the defined dark palette consistently throughout. No off-palette hex values shall be introduced.
- **Background:** `#282a36` — page and modal backgrounds.
- **Surface / Current Line:** `#44475a` — cards, input fields, secondary containers.
- **Primary text:** `#f8f8f2` — main content and headings.
- **Secondary text:** `#6272a4` — hints, labels, disabled text.
- **Accent (interactive):** `#8be9fd` — buttons, links, focus indicators.
- **Accent hover/pressed:** `#bd93f9` — hover and active states.
- **Highlight:** `#ff79c6` — optional highlights (active filter, selected chart bar).
- **Status colors:**
  - Overdue: `#ff5555`
  - Urgent: `#f1fa8c`
  - Normal: `#8be9fd`
  - Paid: `#50fa7b`
  - Info (optional): `#ffb86c`
- Colors shall be defined as CSS variables that map to shadcn/ui's theme tokens (e.g., `--primary`, `--secondary`, `--destructive`, `--muted`) so all shadcn components inherit the defined palette automatically.
- Feature-specific colors (status badges) shall be defined as CSS variables (e.g., `--status-overdue`, `--status-paid`) and referenced via Tailwind classes.
- All buttons shall use the accent color by default (`Button variant="default"`).
- Form inputs (shadcn `Input`, `Select`) shall have border color matching Comment (`#6272a4`), focus border Cyan (`#8be9fd`).
- Tables (shadcn `Table`) shall have alternating row backgrounds using Background and Surface.
- The theme shall be dark-only (no light mode toggle; see PRD Out of Scope).

### FR-18: Form input validation
The frontend shall validate user input before submission and display inline errors.
- Service name: required, trim whitespace, min length 1 character.
- Service type: required, must be one of the predefined options.
- Payment date: optional; when present, it must be valid ISO 8601 date (YYYY-MM-DD).
- Due date: required, must be valid ISO 8601 date (YYYY-MM-DD).
- Due date >= payment date: show error if violated.
- Validation errors shall appear inline (below the field).
- Error text color shall be red (#ff5555).
- The submit button shall be disabled while validation errors exist.
- On successful submit, clear all errors.

### FR-19: Loading states
The frontend shall indicate when async operations are in progress.
- When fetching bills, show a loading spinner.
- When submitting a form, disable buttons and show loading indicator.
- When deleting a bill, disable the delete button and show loading indicator.
- When marking a bill as paid, disable the button and show loading indicator.
- Loading spinners shall use colors from the defined palette.
- Loading states shall be responsive and not block the UI.

### FR-20: Internationalization (i18n)
The frontend shall externalize all user-facing text into locale files using a key/value pattern.
- The app shall use the `react-i18next` library for translation lookup and locale management.
- Locale files shall live under `client/src/locales/` in JSON format (e.g., `en.json`, `en.json`).
- The MVP shall ship English (`en.json`) as the only locale; the architecture shall support adding more locales without code changes.
- The default locale shall be English (`en`).
- Keys shall be organized hierarchically by feature area, using dot notation:
  - `form.name_label`, `form.type_label`, `form.save_button`, `form.cancel_button`
  - `status.overdue`, `status.urgent`, `status.normal`, `status.paid`
  - `toast.created`, `toast.paid`, `toast.deleted`, `toast.updated`, `toast.error`
  - `filters.by_month`, `filters.by_range`, `filters.by_type`, `filters.clear`
  - `chart.title` (with interpolation: `"{{type}} - Billing periods"`)
  - `confirm.delete_title`, `confirm.delete_body`, `confirm.button_confirm`, `confirm.button_cancel`
- Components shall retrieve translations via the `useTranslation` hook: `const { t } = useTranslation(); t('form.name_label')`.
- No user-facing string shall be hardcoded in components; every visible label, button text, toast, aria-label, tooltip, and error message shall come from a locale key.
- Keys shall use snake_case and be self-descriptive (e.g., `form.due_date_label`, not `label1`).
- Interpolated values (dates, names, counts) shall use `{{variableName}}` placeholders in the locale file.
- Missing keys shall log a warning in development and render the key name in production (fallback behavior of `react-i18next`).
- The locale file structure and key naming shall be documented so translators can add a new locale without touching component code.

### FR-21: Accessibility and keyboard support
The Frontend shall support keyboard navigation and accessibility features.
- All interactive elements (buttons, inputs, selects) shall be focusable via Tab key.
- Forms shall be submittable via Enter key.
- Modals shall be closeable via Escape key.
- Focus indicators shall be visible (outline or highlight).
- Form labels shall be associated with their inputs (for attribute).
- ARIA labels shall be used for icon-only buttons.
- Color shall not be the only indicator of status (use text/icons too).

### FR-22: API communication
The frontend shall communicate with the backend API using standard REST conventions.
- Base URL: environment variable REACT_APP_API_URL (default `http://localhost:5001`).
- All requests shall use JSON content-type.
- Dates sent to API shall be ISO 8601 format (YYYY-MM-DD).
- Timestamps received from API shall be parsed as ISO 8601.
- All network errors shall be caught and displayed as error toasts.
- HTTP status codes shall be interpreted correctly (4xx = client error, 5xx = server error).
- API calls shall have appropriate timeouts (5 seconds for typical requests).

### FR-23: Data state management
The Frontend shall manage bill data and filter state efficiently.
- Bill list state shall be fetched from the backend (no client-side storage).
- Filter state (month, date range, type) shall be stored in React state or URL query params.
- Changing filters shall trigger a new API request.
- After CRUD operations, the bill list shall be refetched (or updated optimistically then verified).
- Do not cache API responses (always fetch fresh data).

### FR-24: Browser compatibility
The frontend shall work on modern browsers.
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Does not need to support IE or Edge Legacy.

### FR-25: UI component library (shadcn/ui)
The frontend shall use [shadcn/ui](https://ui.shadcn.com/) as the sole design system for all interactive UI primitives.
- Components shall be maintained as canonical shadcn/ui source files in `client/src/components/ui/`, using lowercase kebab-case filenames and `@/components/ui/*` imports; they are part of the project's own codebase, not a package dependency.
- shadcn/ui components are built on Radix UI primitives (accessible focus, keyboard, ARIA behavior) and styled with Tailwind CSS.
- Tailwind CSS shall be configured with CSS variables mapped to the defined palette so shadcn/ui components render in the dark theme automatically (see FR-17).
- No other component library (Material UI, Chakra UI, Ant Design, Bootstrap, etc.) shall be added; a single design system keeps the app coherent.
- Custom feature components (`ServiceForm`, `ServiceList`, `ServiceItem`, `ConsumptionByPeriodChart`, etc.) shall compose shadcn/ui primitives rather than reimplement them.
- When a needed primitive is missing from shadcn/ui, first check the shadcn/ui blocks registry; if still missing, build on Radix primitives directly rather than adding another library.

#### shadcn/ui components required

The following shadcn/ui primitives shall be installed and used. Each entry lists the component name, where it is used, and how it is configured.

**Layout & Containers**
- `Card` (`CardHeader`, `CardContent`, `CardFooter`) — bill items on mobile (<768px); filter panel container; chart container.
- `Table` (`TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) — bill list on desktop/tablet (≥768px). Alternating row backgrounds using the defined Background and Surface colors.
- `Separator` — visual divider between filter panel and bill list.

**Forms & Inputs**
- `Dialog` (`DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`) — create bill modal and edit bill modal. Contains the full bill form.
- `Input` — "Service name" text field. Paired with `Label`.
- `Label` — persistent visible label above every form input.
- `Select` (`SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`) — "Service type" dropdown in the bill form (Electricity, Gas, Internet, Mobile, Water); "Type" filter dropdown in the filter panel (All, Electricity, Gas, Internet, Mobile, Water).
- `Calendar` — single-date picker for Payment date and Due date, plus a range-mode picker for the custom date filter. Rendered inside a `Popover`.
- `Popover` (`PopoverTrigger`, `PopoverContent`) — wraps each Calendar date picker in the form and filter panel.

**Actions & Buttons**
- `Button` — all clickable actions throughout the app:
  - variant `default` — primary actions: "Save" (form), "Mark as paid" (bill row), "Apply" (custom range calendar), "+ New bill" (top of page).
  - variant `outline` — secondary actions: "Cancel" (form), "Export PDF" (filter panel), "Back" (custom range calendar), "Undo" (Undo toast).
  - variant `destructive` — destructive actions: "Confirm" (delete dialog).
  - variant `ghost` + size `icon` — kebab menu trigger (⋮) per bill row.
- `AlertDialog` (`AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`) — delete bill confirmation dialog. "Confirm" uses destructive styling; "Cancel" is the default focus.
- `DropdownMenu` (`DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`) — kebab menu (⋮) per bill row containing "Edit" and "Delete" actions.

**Status & Feedback**
- `Badge` — status indicator per bill row. Custom variants mapped to status:
  - variant `overdue` — red (#ff5555), label "OVERDUE".
  - variant `urgent` — orange (#ffb86c), dark text, label "DUE SOON".
  - variant `normal` — cyan (#8be9fd), dark text, label "NORMAL".
  - variant `paid` — green (#50fa7b), dark text, label "PAID".
- `Sonner` (toast) — all notification toasts:
  - Success toasts: "✅ Service created", "✅ Paid", "✅ Deleted", "✅ Service updated", "✅ PDF downloaded".
  - Error toasts: "❌ Error saving", "❌ Service not found".
  - Info toasts: "Reverted — edit and save again".
  - Undo toast: custom JSX child with message text, `Progress` bar, and "Undo" `Button`.
- `Progress` — horizontal progress bar inside the Undo toast, depleting from 100% to 0% over 8 seconds.
- `Skeleton` — loading placeholders displayed while the bill list is being fetched. Skeleton layout shall match the shape of a `Table` row (desktop/tablet) or a `Card` (mobile).
- `Tooltip` (`TooltipTrigger`, `TooltipContent`) — explanatory text on hover/focus for icon-only buttons (kebab ⋮, export, "+ New bill" if icon-only on small screens).

**Data Visualization**
- `Chart` (shadcn Chart, Recharts-based) — billing-period bar chart. Renders
  inside a `Card` container. Uses `ChartContainer`, `ChartTooltip`,
  `ChartTooltipContent`, and Recharts sub-components (`BarChart`, `Bar`,
  `XAxis`, `YAxis`). Auto-themed with the defined palette CSS variables.

**Utility**
- `cn` helper (from `lib/cn.ts`) — merges Tailwind classes conditionally. Used in every component for conditional styling.

#### Feature component → shadcn/ui composition

Each feature component composes shadcn primitives as follows:

- **ServiceForm.tsx** — `Dialog` > `DialogContent` > `Label` + `Input` (name) + `Select` (type) + currency-formatted `Input` (amount, text input with decimal keypad) + `Popover` > `Calendar` (payment date) + `Popover` > `Calendar` (due date) + `DialogFooter` > `Button` (Save) + `Button` (Cancel).
- **ServiceList.tsx** — `Table` (desktop/tablet) or mapped `Card` list (mobile) + `Skeleton` (loading state). Renders `ServiceItem` per row/card.
- **ServiceItem.tsx** — Desktop: `TableRow` > 7 × `TableCell` in order: name, type, status (`Badge`), amount (right-aligned, "$ X,XXX.XX" or "—"), payment date ("MMM DD" or "—"), due date ("MMM DD"), actions (flex justify-end: `Button` Mark as paid + `DropdownMenu` ⋮, kebab always rightmost). Mobile: `Card` > `CardHeader` (name left + `Badge` right) + `CardContent` (type · amount line, due · paid line) + `CardFooter` (actions right-aligned, same kebab-rightmost rule).
- **DateFilter.tsx** — preset `Select` (This month, Last month, Custom range, All time) and, for Custom range, one `Popover` > range-mode `Calendar`.
- **TypeFilter.tsx** — `Select` with fixed options.
- **DeleteConfirmation.tsx** — `AlertDialog` > `AlertDialogContent` with bill name/type in body, `AlertDialogAction` (Confirm, destructive) + `AlertDialogCancel` (Cancel).
- **UndoToast.tsx** — `Sonner` custom toast > message text + `Progress` (8s linear) + `Button` (Undo, outline).
- **ConsumptionByPeriodChart.tsx** — `Card` > `CardHeader` (title) + `CardContent` > shadcn `Chart` (`ChartContainer` + `BarChart` + `Bar` + `XAxis` + `YAxis` + `ChartTooltip`).
- **FilterPanel.tsx** — container `div` > `DateFilter` + `TypeFilter` + `Button` (Export PDF, outline) + `Button` (+ New bill, default).
- **App.tsx** — `Sonner` `<Toaster />` provider at root. Layout: header + `FilterPanel` + `ServiceList` + `ConsumptionByPeriodChart` (conditional).

---

# Non-Functional Requirements

## Performance
- Page load: < 2 seconds
- Bill list render: < 500ms
- Filter apply: instant (no perceptible delay)
- Chart render: < 1 second
- All animations: 60fps (60Hz), no frame drops
- Form submit: < 500ms (after backend response)

## User Experience
- Clear visual feedback for all actions
- No unexpected page reloads
- Smooth, natural animations
- Intuitive form layout
- No console errors in production

## Accessibility
- Keyboard navigable
- Screen reader friendly
- High contrast for readability
- Color not only cue for status

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- No IE support

---

# Component Structure

**Key Components:**
- App.tsx (main layout and state)
- ServiceForm.tsx (create/edit modal)
- ServiceList.tsx (bill list with sorting)
- ServiceItem.tsx (individual bill row/card)
- ConsumptionByPeriodChart.tsx (shadcn Chart)
- FilterPanel.tsx (date/type filters and export)
- DeleteConfirmation.tsx (confirmation modal)
- UndoToast.tsx (8s timer visual)
- Sonner/toast integration (notification messages)

---

# Test Coverage

**Component Tests:**
- ServiceForm: validation, submit, cancel
- ServiceList: render list, apply filters, sort correctly
- ServiceItem: display status, action buttons
- ConsumptionByPeriodChart: render with data, responsive
- FilterPanel: date/type filters and export button
- DeleteConfirmation: display, confirm, cancel

**Integration Tests:**
- Create bill with payment date → appears in list → Undo countdown shows
- Create bill without payment date → appears in list → no Undo countdown or notification flow
- Edit bill → list updates
- Mark paid → badge changes → immediate Telegram notification (backend)
- Delete bill → confirmation → removed from list
- Filter by month → correct bills shown
- Filter by type → chart appears
- Export PDF → file downloads

**E2E Flow:**
- Load app → list visible
- Create bill → form, submit, countdown, toast
- Edit bill → form pre-filled, submit, list updates
- Mark paid → status changes
- Apply filters → list filters, chart appears
- Clear filters → all bills show again
- Delete bill → confirmation, removal

---

# Out of Scope (Future Versions)

- Native mobile app
- Multi-user support with authentication
- Dark/light mode toggle (theme is fixed dark)
- Advanced charting features (pie charts, trends)
- Recurring bill templates
- Budget alerts
- Email notifications (only Telegram)
- Offline mode

---

**Version:** 2.0  
**Format:** Frontend Functional Requirements Specification  
**Status:** Ready for Development  
**Last Updated:** September 2026
