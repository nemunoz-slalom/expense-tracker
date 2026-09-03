# Epics and Stories

## MVP

- Epic: Utility Bill Management
  - Story: Create a utility bill
    - Technical Requirements:
      - Use `POST /api/services` with the contract service fields and response envelope.
    - Acceptance Criteria:
      - A user can create a bill with a name, supported service type, due date,
        and optional amount and payment date.
      - A successfully created bill appears in the bill list immediately and is
        unpaid by default.
  - Story: View all utility bills
    - Technical Requirements:
      - Fetch through the API service layer and render all service response fields.
    - Acceptance Criteria:
      - A user can view all stored bills when no filters are applied.
      - Each bill displays its name, type, amount when present, payment date,
        due date, paid state, and status.
  - Story: View a utility bill's details
    - Technical Requirements:
      - Use `GET /api/services/:id` and preserve the server-assigned numeric ID.
    - Acceptance Criteria:
      - A user can open a specific bill and view its complete stored details.
      - The displayed bill is identified by its unique ID.
  - Story: Edit a utility bill
    - Technical Requirements:
      - Submit partial updates through `PATCH /api/services/:id` while keeping form state separate.
    - Acceptance Criteria:
      - A user can edit the name, type, amount, payment date, due date, or paid
        state of an existing bill.
      - The edit form is pre-filled with the bill's current values.
      - Saving changes updates only the selected bill and preserves its ID.
  - Story: Delete a utility bill
    - Technical Requirements:
      - Call `DELETE /api/services/:id`, handle `204 No Content`, and refresh the list.
    - Acceptance Criteria:
      - A confirmed deletion removes the selected bill from the list.
      - The deleted bill is permanently removed and does not appear in later
        requests.
  - Story: Confirm bill deletion
    - Technical Requirements:
      - Use an accessible confirmation dialog before invoking the delete API.
    - Acceptance Criteria:
      - Selecting delete opens a confirmation dialog before removal.
      - Cancelling the dialog leaves the bill unchanged.
  - Story: Validate bill details
    - Technical Requirements:
      - Share name, type, date, amount, and cross-field validation between create and edit.
    - Acceptance Criteria:
      - Blank names, unsupported types, invalid dates, negative or non-finite
        amounts, and missing due dates are rejected with clear errors.
      - A due date earlier than a supplied payment date is rejected.
      - Validation errors appear inline and the invalid bill is not saved.
  - Story: Persist bill changes
    - Technical Requirements:
      - Use SQLite-backed repository transactions and the documented error response shape.
    - Acceptance Criteria:
      - Successful create, edit, and delete operations are reflected in later
        requests and after application restart.
      - A failed operation does not partially change the stored bill data.
      - Database unavailability produces a clear user-facing error.

- Epic: Bill Status and Urgency
  - Story: Mark a bill as paid
    - Technical Requirements:
      - Submit `PATCH /api/services/:id` with `paid: true`; set today on the backend.
    - Acceptance Criteria:
      - A user can mark an unpaid bill as paid with a direct action.
      - The bill's payment date becomes today and its status becomes paid.
  - Story: Display paid and unpaid statuses
    - Technical Requirements:
      - Render the server-derived `status` field and retain paid services in list responses.
    - Acceptance Criteria:
      - The bill list clearly distinguishes paid and unpaid bills.
      - Paid bills display the PAID status and remain visible.
  - Story: Display overdue status
    - Technical Requirements:
      - Map server status `overdue` to its label, icon, and theme token.
    - Acceptance Criteria:
      - An unpaid bill with a due date before today displays OVERDUE.
  - Story: Display due-soon status
    - Technical Requirements:
      - Map server status `urgent` to its label, icon, and theme token.
    - Acceptance Criteria:
      - An unpaid bill due today through seven days from today displays DUE SOON.
  - Story: Display normal status
    - Technical Requirements:
      - Map server status `normal` to its label, icon, and theme token.
    - Acceptance Criteria:
      - An unpaid bill due more than seven days from today displays NORMAL.
  - Story: Sort bills by urgency
    - Technical Requirements:
      - Preserve API ordering and use one shared urgency comparator after list changes.
    - Acceptance Criteria:
      - Unpaid overdue bills appear first, followed by due-soon bills, then
        normal bills, with paid bills always last.
      - The ordering remains correct after loading, filtering, refreshing, and
        updating bills.
  - Story: Sort bills by due date
    - Technical Requirements:
      - Compare ISO `YYYY-MM-DD` due-date values within each status group.
    - Acceptance Criteria:
      - Bills within the same urgency group are ordered by earliest due date
        first.
  - Story: Break sorting ties by bill ID
    - Technical Requirements:
      - Apply ascending numeric bill ID as the final comparator.
    - Acceptance Criteria:
      - Bills with the same urgency and due date are ordered by ascending ID.
      - Repeated loads produce the same order for tied bills.

- Epic: Telegram Notifications
  - Story: Notify after bill creation
    - Technical Requirements:
      - Start a local frontend-owned 8,000 ms timer only when `paymentDate` is present.
    - Acceptance Criteria:
      - Creating a bill with a payment date sends a creation notification after
        the eight-second Undo window expires.
      - Creating a bill without a payment date sends no creation notification.
  - Story: Show the creation notification countdown
    - Technical Requirements:
      - Implement an accessible client countdown and Undo control.
    - Acceptance Criteria:
      - A bill created with a payment date shows a visible eight-second
        countdown and Undo action.
      - The countdown reaches zero when the creation notification is sent.
  - Story: Undo bill creation during the countdown
    - Technical Requirements:
      - Cancel the local countdown before deleting through the service endpoint.
    - Acceptance Criteria:
      - Selecting Undo before the countdown ends deletes the created bill.
      - No creation notification is sent after Undo.
      - The user receives confirmation that creation was reverted.
  - Story: Reopen undone bill details
    - Technical Requirements:
      - Preserve the original create DTO and repopulate the create form after Undo.
    - Acceptance Criteria:
      - Undo reopens the form with the original bill values available for editing.
      - The user can edit and save the reopened bill as a new operation.
  - Story: Notify when a bill is marked as paid
    - Technical Requirements:
      - Detect the false-to-true transition and invoke Telegram once.
    - Acceptance Criteria:
      - Marking an unpaid bill as paid sends a notification immediately.
      - Repeating the paid action on an already-paid bill does not send a
        duplicate notification.
  - Story: Skip notifications without Telegram configuration
    - Technical Requirements:
      - Require non-empty `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` before delivery.
    - Acceptance Criteria:
      - Notifications are skipped when either Telegram configuration value is
        missing.
      - The related bill operation still succeeds.
  - Story: Handle Telegram delivery failures
    - Technical Requirements:
      - Log Telegram errors at the external-service boundary without failing the API operation.
    - Acceptance Criteria:
      - A Telegram delivery failure is logged.
      - The failure does not block, roll back, or report the primary bill
        operation as unsuccessful.

- Epic: Bill Filtering
  - Story: Filter bills for the current month
    - Technical Requirements:
      - Initialize the filter with the server-local month and send `month=YYYY-MM`.
    - Acceptance Criteria:
      - The date filter defaults to This month on load.
      - Only bills whose due dates fall within the current month are shown.
  - Story: Filter bills for the previous month
    - Technical Requirements:
      - Calculate the previous calendar month and send its `month` query parameter.
    - Acceptance Criteria:
      - Selecting Last month shows only bills due within the previous calendar
        month.
  - Story: Filter bills by a custom date range
    - Technical Requirements:
      - Send inclusive `from` and `to` ISO date query parameters.
    - Acceptance Criteria:
      - Selecting Custom range opens a range calendar.
      - Both range boundaries are inclusive and the trigger displays the chosen
        range.
  - Story: View all bills with the all-time filter
    - Technical Requirements:
      - Omit date query parameters when All time is selected.
    - Acceptance Criteria:
      - Selecting All time removes date restrictions and shows all bills.
      - The filter trigger displays All time.
  - Story: Filter bills by service type
    - Technical Requirements:
      - Send the selected contract `type` query parameter.
    - Acceptance Criteria:
      - A user can select All or any supported service type.
      - Selecting a specific type shows only bills of that type.
  - Story: Combine date and service-type filters
    - Technical Requirements:
      - Serialize all active filters in one request and preserve API ordering.
    - Acceptance Criteria:
      - Date and type filters apply together using AND behavior.
      - The resulting bills remain sorted by urgency.

- Epic: Consumption by Billing Period
  - Story: Select a service type to view its consumption chart
    - Technical Requirements:
      - Render the chart only when a specific service type is selected; hide it for All.
      - Request `GET /api/services/stats/type/:type?periods=6` only for a specific type.
    - Acceptance Criteria:
      - Selecting a specific service type displays its consumption chart.
      - Selecting All hides the chart and issues no statistics request.
  - Story: Request the last six billing periods
    - Technical Requirements:
      - Send `periods=6` by default; reject or clamp values outside the 1–12 range.
      - Render exactly the number of periods returned, oldest to newest.
    - Acceptance Criteria:
      - The default request uses `periods=6` and the chart shows six periods.
      - A `periods` value outside 1–12 is rejected with a validation error.
  - Story: Derive billing periods from due date and service frequency
    - Technical Requirements:
      - Compute `periodEnd` as the calendar month immediately before the `dueDate` month.
      - Generate the returned series from the server-local current month, independent of whether any bill exists.
      - Emit `YYYY-MM` identifiers for monthly periods and `YYYY-MM..YYYY-MM` for bimonthly periods, oldest to newest.
      - Never persist a `periodDate` field in the database, API model, or DTO.
    - Acceptance Criteria:
      - Billing periods are derived from `dueDate` and service type, not from a stored period field.
      - A due date of 2026-03-10 for internet, mobile, or water maps to `2026-02`.
      - The response always contains exactly the requested number of periods, even when no bills match.
  - Story: Aggregate each bill into exactly one derived billing period
    - Technical Requirements:
      - Aggregate every bill only into the period derived from its own `dueDate` and service type; never remap a bill into a neighbouring period.
      - Exclude bills whose derived billing period is not one of the generated periods.
    - Acceptance Criteria:
      - A bill contributes its amount to exactly one billing period.
      - An electricity bill due 2026-02-10 derives `2025-12..2026-01` and is excluded when that period is not part of the returned series.
  - Story: Use monthly billing periods for internet, mobile, and water
    - Technical Requirements:
      - Apply a one-month frequency where `periodStart = periodEnd`.
    - Acceptance Criteria:
      - Internet, mobile, and water bills each occupy a single-month billing period.
  - Story: Use bimonthly billing periods for electricity and gas
    - Technical Requirements:
      - Apply a two-month frequency where `periodStart = periodEnd` minus one calendar month.
    - Acceptance Criteria:
      - Electricity and gas bills occupy a two-month billing period.
      - A due date of 2026-03-10 for electricity or gas maps to `2026-01..2026-02`.
  - Story: Show the full bimonthly amount without proration
    - Technical Requirements:
      - Assign the full bill amount to its single period entry; never split across months.
    - Acceptance Criteria:
      - A bimonthly bill appears as one chart point carrying its full amount.
      - No bimonthly amount is divided across the two months of its period.
  - Story: Include paid and unpaid bills in the chart
    - Technical Requirements:
      - Filter only on non-null `amount`; do not filter on `paid`.
    - Acceptance Criteria:
      - Bills with a non-null amount are included regardless of paid state.
      - Bills with a null amount are excluded.
  - Story: Keep the chart independent of payment date and list filters
    - Technical Requirements:
      - Exclude `paymentDate`, `paid`, and the list's due-date filter from the statistics query.
    - Acceptance Criteria:
      - Changing a bill's payment date does not change the chart.
      - Changing the bill list's date filter does not change the chart.
  - Story: Show zero-value billing periods
    - Technical Requirements:
      - Render every period returned by the response, including `amount: 0`.
    - Acceptance Criteria:
      - Billing periods without matching eligible bills remain visible with a zero amount.
  - Story: Show the average across the returned billing periods
    - Technical Requirements:
      - Render the API-provided average computed across all returned periods, including zeros.
    - Acceptance Criteria:
      - The chart displays the average across all returned billing periods.
      - Zero-value periods are counted in the average denominator.

- Epic: PDF Reporting
  - Story: Export the filtered bills to PDF
    - Technical Requirements:
      - Call the PDF endpoint with the same filter query and consume the binary response as a download.
    - Acceptance Criteria:
      - Selecting Export to PDF downloads a report for the currently filtered
        bill set.
      - The report includes the title Services Report and the bill table.
  - Story: View the report date period
    - Technical Requirements:
      - Pass the active date filter to PDF generation and render its period label in the document.
    - Acceptance Criteria:
      - The report shows the active date period or All Dates when no date filter
        is active.
  - Story: View bill status counts in the report
    - Technical Requirements:
      - Generate counts from the filtered response set and omit any monetary grand-total field.
    - Acceptance Criteria:
      - The report includes paid and pending bill counts.
      - The report does not include a monetary grand total.
  - Story: Download a descriptively named report
    - Technical Requirements:
      - Set the download filename from the active ISO date range or the all-dates fallback.
    - Acceptance Criteria:
      - The downloaded filename identifies the active date range when available.

- Epic: User Experience and Accessibility
  - Story: Use the fixed dark theme
    - Technical Requirements:
      - Define palette values as CSS variables and configure Tailwind to consume them globally.
    - Acceptance Criteria:
      - The application uses the defined dark palette consistently.
      - No user-selectable light theme is presented.
  - Story: Use consistent status colors and labels
    - Technical Requirements:
      - Implement shared status badge variants with text and icon content.
    - Acceptance Criteria:
      - Overdue, due-soon, normal, and paid statuses use their defined colors.
      - Each status also has a text label or icon and is not communicated by
        color alone.
  - Story: Use localized English interface text
    - Technical Requirements:
      - Route labels, toasts, errors, and ARIA names through react-i18next locale keys.
    - Acceptance Criteria:
      - User-facing labels, messages, errors, and accessible names are in
        English and supplied through the localization system.
  - Story: View loading, empty, success, and error feedback
    - Technical Requirements:
      - Model loading, empty, success, and error states in hooks and expose them to components.
    - Acceptance Criteria:
      - The interface presents clear loading and empty states.
      - Successful actions show the specified confirmation feedback.
      - Errors and validation failures identify what went wrong.
      - Success toasts dismiss automatically after three seconds.
  - Story: Use the application on tablet screens
    - Technical Requirements:
      - Use responsive Tailwind layouts with controls sized to at least 44px high at the 768px breakpoint.
    - Acceptance Criteria:
      - The bill list remains readable at widths of 768px or greater.
      - Forms, dialogs, and charts remain usable and responsive.
      - Form controls are touch-friendly.
  - Story: Navigate controls with a keyboard
    - Technical Requirements:
      - Use shadcn/ui primitives for all interactive controls with visible focus styles and managed dialog focus.
    - Acceptance Criteria:
      - All interactive controls can be reached and operated with a keyboard.
      - Dialogs preserve appropriate focus behavior.
  - Story: Use the application with assistive technology
    - Technical Requirements:
      - Provide semantic labels, roles, live feedback, and accessible names for controls and status changes.
    - Acceptance Criteria:
      - Inputs have persistent visible labels.
      - Icon-only controls have accessible names.
      - Status, errors, dialogs, and action results have meaningful semantics.
  - Story: Respect reduced-motion preferences
    - Technical Requirements:
      - Gate Framer Motion transitions with the reduced-motion media preference.
    - Acceptance Criteria:
      - Entrance and exit animations are disabled or reduced when the user
        prefers reduced motion.
      - Essential feedback remains available without animation.

- Epic: MVP Quality and Performance
  - Story: Load up to 1,000 bills within the target time
    - Technical Requirements:
      - Measure list requests and rendering with a representative 1,000-service dataset.
    - Acceptance Criteria:
      - The bill list loads within two seconds for up to 1,000 bills.
  - Story: Render spending charts within the target time
    - Technical Requirements:
      - Measure chart request and render completion against the one-second target.
    - Acceptance Criteria:
      - The spending chart loads within one second after selecting a type.
  - Story: Complete PDF exports within the target time
    - Technical Requirements:
      - Measure the PDF download workflow against the five-second target.
    - Acceptance Criteria:
      - A PDF export completes within five seconds for the MVP dataset.
  - Story: Verify bill management workflows
    - Technical Requirements:
      - Add isolated unit and integration coverage for CRUD, validation, persistence, and errors.
    - Acceptance Criteria:
      - Automated coverage verifies create, read, edit, delete, validation,
        persistence, and error behavior.
  - Story: Verify notification workflows
    - Technical Requirements:
      - Use mocked Telegram transport and controlled timers to test notification paths.
    - Acceptance Criteria:
      - Automated coverage verifies creation delay, Undo cancellation,
        immediate paid notification, duplicate prevention, and Telegram
        failure handling.
  - Story: Verify filtering and reporting workflows
    - Technical Requirements:
      - Use isolated Chromium Playwright journeys with reset test database state.
    - Acceptance Criteria:
      - Automated coverage verifies date filters, type filters, sorting,
        billing-period analytics, and PDF export.
      - Critical user journeys run independently without shared test state.

## Post-MVP

- Epic: Custom Service Types
  - Story: Add a custom service type
    - Technical Requirements:
      - Extend the service-type model, validation, persistence, and selection data without changing MVP defaults.
    - Acceptance Criteria:
      - A user can create a service type beyond the five MVP types.
      - Bills using the custom type can be created and displayed.
  - Story: Manage custom service types
    - Technical Requirements:
      - Add service-type CRUD and expose custom values to bill forms and filters.
    - Acceptance Criteria:
      - A user can view and manage their custom service types.
      - Custom types remain available for future bill entry.

- Epic: Bill Archiving
  - Story: Archive old bills automatically
    - Technical Requirements:
      - Add archived state and a scheduled retention evaluation separate from active-list queries.
    - Acceptance Criteria:
      - Bills older than the configured retention period are archived
        automatically.
      - Archived bills no longer appear in the active bill list.
  - Story: Configure bill retention
    - Technical Requirements:
      - Persist a validated retention setting and apply it to the archive evaluator.
    - Acceptance Criteria:
      - A user can configure the period used to identify old bills.
      - Changing the period affects future archiving behavior.

- Epic: Service Name Suggestions
  - Story: Suggest common service names
    - Technical Requirements:
      - Provide localized suggestion data keyed by supported service type.
    - Acceptance Criteria:
      - The bill form offers relevant common service-name suggestions.
      - Suggestions include examples such as CFE, Claro, and Infinitum.
  - Story: Select a suggested service name
    - Technical Requirements:
      - Bind suggestion selection to the existing controlled bill-name field.
    - Acceptance Criteria:
      - A user can select a suggestion and use it as the bill name.
      - The selected name remains editable before saving.

- Epic: Consumption Tracking
  - Story: Record physical consumption
    - Technical Requirements:
      - Extend the persisted service model with validated consumption values and units.
    - Acceptance Criteria:
      - A user can record physical consumption for a supported service.
      - Consumption data can be associated with the relevant bill or service.
  - Story: View consumption metrics
    - Technical Requirements:
      - Add an aggregation service and typed response for consumption metrics.
    - Acceptance Criteria:
      - A user can view metrics derived from recorded consumption data.

- Epic: Due-Date Reminders
  - Story: Configure due-date reminders
    - Technical Requirements:
      - Persist reminder settings and validate the configured lead time.
    - Acceptance Criteria:
      - A user can configure whether upcoming due-date reminders are enabled.
      - A user can configure the reminder timing.
  - Story: Send an upcoming due-date reminder
    - Technical Requirements:
      - Add a scheduled reminder process using the existing isolated notification boundary.
    - Acceptance Criteria:
      - An enabled reminder is sent at the configured time before a bill's due
        date.

- Epic: Recurring Bills
  - Story: Create a recurring bill template
    - Technical Requirements:
      - Persist a reusable template model with validated bill-generation fields and recurrence rules.
    - Acceptance Criteria:
      - A user can define a reusable recurring bill template.
      - The template captures the information needed to create future bills.
  - Story: Generate recurring bills automatically
    - Technical Requirements:
      - Add an idempotent scheduler that creates due instances without duplicating generated bills.
    - Acceptance Criteria:
      - Future bills are generated according to an active recurring template.
      - Generated bills appear in the bill list.

- Epic: Advanced Analytics
  - Story: View advanced spending analytics
    - Technical Requirements:
      - Add typed analytics queries and API responses without altering the MVP statistics contract.
    - Acceptance Criteria:
      - A user can view analytics beyond the MVP's six-month,
        service-type spending chart.
  - Story: Generate advanced reports
    - Technical Requirements:
      - Extend report generation with selected analytics while preserving filtered-data consistency.
    - Acceptance Criteria:
      - A user can generate reports containing the supported advanced analytics.

- Epic: Additional Localization
  - Story: Add another interface locale
    - Technical Requirements:
      - Add a locale resource matching the existing react-i18next key structure.
    - Acceptance Criteria:
      - The application provides at least one locale in addition to English.
      - Translated labels, messages, and accessible names are available for the
        added locale.
  - Story: Switch the interface locale
    - Technical Requirements:
      - Add locale selection state and initialize i18next with the selected resource.
    - Acceptance Criteria:
      - A user can select an available locale.
      - User-facing text updates to the selected locale.
