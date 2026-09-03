# UI Guidelines

## Purpose

The Services App shall use a clear, consistent, and accessible interface that makes creating, viewing, filtering, editing, and deleting utility bills quick to understand. The interface shall prioritize urgency (overdue bills first) and provide smooth, non-disruptive feedback for all user actions.

---

## Design Approach

UI changes must follow this document and the frozen API contract in `api-contract.md`. Feature agents should not modify global UI guidelines unless a reusable cross-cutting convention changes.


- Build the UI on top of [shadcn/ui](https://ui.shadcn.com/) — a set of accessible, unstyled React components copied directly into the codebase and styled with Tailwind CSS. Components live under `client/src/components/ui/` and are owned by the project (edit them freely).
- Use Radix UI primitives (bundled by shadcn/ui) as the accessibility foundation: focus management, keyboard navigation, ARIA roles, and screen-reader announcements come from Radix and shall not be reimplemented.
- Style shadcn/ui components with CSS variables mapped to the defined palette so the theme is applied uniformly.
- Compose feature components (`ServiceForm`, `ServiceList`, `ServiceItem`, etc.) on top of shadcn primitives (`Button`, `Input`, `Dialog`, `Toast`, `Table`, `Badge`, `Card`). Extend, don't replace.
- Add Framer Motion animations on top of shadcn components for entrance, exit, and hover transitions. Animations should enhance perceived responsiveness; they must not block a user from completing a task, and they should be disabled when the user prefers reduced motion.
- Custom styling shall extend the theme variables rather than introduce one-off colors or sizes.
- Do not import Material UI, Chakra, Ant Design, or another component library alongside shadcn/ui; a single design system keeps the app coherent.

---

## Color Palette

The app uses the defined color palette. Do not substitute or introduce off-palette hex values.

### Full Palette (Reference)

| Token | Hex | RGB | HSL |
|-------|-----|-----|-----|
| Background | `#282a36` | 40, 42, 54 | 231°, 15%, 18% |
| Current Line | `#44475a` | 68, 71, 90 | 232°, 14%, 31% |
| Selection | `#44475a` | 68, 71, 90 | 232°, 14%, 31% |
| Foreground | `#f8f8f2` | 248, 248, 242 | 60°, 30%, 96% |
| Comment | `#6272a4` | 98, 114, 164 | 225°, 27%, 51% |
| Cyan | `#8be9fd` | 139, 233, 253 | 191°, 97%, 77% |
| Green | `#50fa7b` | 80, 250, 123 | 135°, 94%, 65% |
| Orange | `#ffb86c` | 255, 184, 108 | 31°, 100%, 71% |
| Pink | `#ff79c6` | 255, 121, 198 | 326°, 100%, 74% |
| Purple | `#bd93f9` | 189, 147, 249 | 265°, 89%, 78% |
| Red | `#ff5555` | 255, 85, 85 | 0°, 100%, 67% |
| Yellow | `#f1fa8c` | 241, 250, 140 | 65°, 92%, 76% |

### Application Mapping

**Structural**
- **Background:** `#282a36` for page and modal backgrounds.
- **Surface:** `#44475a` for cards, input fields, table row highlights, and secondary containers.
- **Primary text:** `#f8f8f2` for main content and headings.
- **Secondary text:** `#6272a4` for hints, secondary labels, disabled text.

**Interactive**
- **Accent (default):** `#8be9fd` for buttons, links, focus indicators, and primary interactive states.
- **Accent hover/pressed:** `#bd93f9` for hover and active states on accent elements.
- **Highlight/secondary accent:** `#ff79c6` for optional highlights (e.g., active filter chip, selected chart bar).

**Status**
- **Overdue (🔴 OVERDUE):** `#ff5555` — high urgency, immediate action needed.
- **Due within 7 days (🟡 DUE SOON):** `#f1fa8c` — medium urgency, approaching deadline.
- **Normal (⚪ NORMAL):** `#8be9fd` — low urgency, future deadline.
- **Paid (✅ PAID):** `#50fa7b` — completed status.
- **Info (optional):** `#ffb86c` for informational callouts or non-critical warnings.
- **Error/destructive:** `#ff5555` for delete actions and validation errors (shared with overdue color).

### Accessibility
- Color shall not be the only way to communicate bill status, validation errors, or action results. Pair color with:
  - Text labels (e.g., "OVERDUE", "PAID")
  - Icons or badges (e.g., 🔴, ✅)
  - Visual cues (position in list, font weight)
- All text shall meet WCAG 2.1 AA contrast requirements (minimum 4.5:1 for normal text, 3:1 for large text).
- Verify contrast on all text-background combinations.

---

## Layout and Typography

### Page Structure
- Use a single-page app with persistent header/navigation.
- Main layout sections (top to bottom):
  1. **Header:** App title and navigation (if any)
  2. **Filter Panel:** Date filter dropdown (This month / Last month / Custom range / All time), type filter dropdown, Export PDF button, and "+ New bill" button
  3. **Bill List:** Sorted by urgency, displaying name, type, dates, status badge, action buttons
  4. **Chart (conditional):** Consumption-by-billing-period chart appears only when type filter is active
- Keep all critical actions (create, edit, delete) within a single viewport scroll (no side-scrolling on any device ≥768px).

### Typography
- **Base font size:** 16px for body text (minimum for readability).
- **Headings:** Use semantic hierarchy (h1 for app title, h2 for sections, h3 for subsections).
- **Font family:** System stack or web-safe sans-serif (e.g., `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`).
- **Font weights:**
  - Regular (400) for body text and secondary information.
  - Semi-bold (600) for interactive elements (buttons, links, form labels).
  - Bold (700) for primary headings and status labels (e.g., "OVERDUE", "PAID").
- **Line height:** 1.5 for body text, 1.2 for headings (comfort for readability).
- **Letter spacing:** Default (no additional spacing); use font weight to create emphasis instead.

### Spacing
- Use consistent spacing increments: 4px, 8px, 12px, 16px, 24px, 32px, 48px.
- **Margin between sections:** 24px or 32px.
- **Padding within components:** 12px to 16px (comfortable touch targets).
- **Gap between form fields:** 16px.
- **Gap between action buttons:** 12px.
- **Whitespace around lists:** 16px padding on sides, 8px vertical gap between items.

### Responsive Design
- **Desktop (≥1024px):** Full-width layout, table view for bill list, side-by-side filters and chart.
- **Tablet (768px–1023px):** Full-width layout, card view for bill list, stacked filters and chart.
- **Mobile (<768px):** Use the card layout and stacked controls; the MVP is optimized for tablet and desktop but remains usable on smaller screens.
- Breakpoints aligned with common Material Design and Tailwind conventions.
- No horizontal scrolling on any supported device.

---

## Text and Localization

All user-facing text shall be externalized to i18n locale files rather than hardcoded in components. The app uses `react-i18next` with JSON locale files organized as key/value pairs.

- **Locale files:** `client/src/locales/en.json` (English, default and only MVP locale), with room to add `en.json` or others later.
- **Key naming:** hierarchical, snake_case, grouped by feature area (`form.name_label`, `status.overdue`, `toast.created`, `filters.by_month`, `confirm.delete_title`).
- **Access pattern:** `const { t } = useTranslation(); t('form.save_button')` — never a hardcoded string in JSX.
- **Interpolation:** `{{variable}}` placeholders in the locale value (e.g.,
  `"chart.title": "{{type}} - Billing periods"`).
- **Coverage:** every visible label, button text, form placeholder, toast message, `aria-label`, tooltip, empty-state message, and error message must come from a key. If a designer or a copy change needs to happen, it should require editing only the locale file.
- **Fallback:** missing keys log a warning in development and render the key name in production; this fallback shall never leak to release builds.

---

## Component Guidelines

### Buttons

#### Primary Buttons (Contained)
- Use for main actions: **Add service**, **Save**, **Mark as paid**, **Export PDF**.
- Color: Accent (`#8be9fd`) background with dark text.
- Hover: Slightly darker or opacity reduction (`#bd93f9` or `opacity: 0.9`).
- Pressed: Additional visual feedback (shadow, scale-down, border).
- Minimum size: 44px × 44px touch target; padding ~8px–16px.
- Include visible focus ring (outline: 2px solid `#8be9fd`).
- Label: Clear, action-oriented text (e.g., "Save", "Mark as paid").

#### Secondary Buttons (Outlined)
- Use for: **Cancel**, **Clear filters**, **Close modal**.
- Border: 1px solid `#8be9fd` (accent color).
- Background: Transparent or surface color (`#44475a`).
- Text: Accent color (`#8be9fd`).
- Hover: Background slightly lighter or border/text slightly dimmer.
- Pressed: Stronger visual feedback (filled background or inset effect).

#### Tertiary Buttons (Text)
- Use for: Low-emphasis actions, dismissals (e.g., close notification).
- No border or background; text only in accent color.
- Hover: Underline or slight background tint.
- Pressed: Stronger visual feedback.

#### Icon Buttons
- Use for: **Edit**, **Delete**, compact actions in table/list rows.
- Size: 44px × 44px minimum for touch targets.
- Icon only; include a tooltip and accessible `aria-label`.
- Background: Surface color or transparent, hover with slight tint.
- **Delete button:** Red icon (`#ff5555`) to signal destructive action; require confirmation dialog.

#### Button States
- **Disabled:** Reduced opacity (0.5) or muted color; cursor: not-allowed; include title or aria-label explaining why.
- **Loading:** Show spinner or skeleton; disable further clicks; preserve button size and label if possible.
- **Success/Error:** Pair button action with toast message (see Feedback section).

### Form Elements

#### Text Inputs
- **Background:** Surface color (`#44475a`).
- **Text:** Primary text (`#f8f8f2`).
- **Border:** 1px solid `#6272a4` (comment/secondary text, muted).
- **Focus:** Border color changes to accent (`#8be9fd`); shadow: 0 0 0 3px rgba(139, 233, 253, 0.1).
- **Placeholder:** Secondary text color (`#6272a4`); shall not be the only label.
- **Label:** Always visible, persistent, positioned above or adjacent to field.
- **Validation error:** Border turns red (`#ff5555`); error text below field in red.
- **Padding:** 8px–12px for comfortable text entry.
- **Font size:** 16px (avoid zoom on iOS when ≥16px).

#### Select Dropdowns
- Same border, focus, and label treatment as text inputs.
- **Options:** White text on dark background; highlight selected option.
- **Hover on option:** Slight background tint for visibility.

#### Date Inputs
- Date selection MUST use the shadcn/ui `Calendar` component inside a `Popover`, triggered by a `Button`.
- Native HTML5 `<input type="date">` MUST NOT be used anywhere in the application UI.
- No other component library may supply date controls.
- The trigger button shows the selected date in the display format, or a localized placeholder when empty.
- The trigger button carries the same label, focus ring, and validation treatment as text inputs.
- The `Calendar` popover must be keyboard navigable and dismissible with `Escape`.

#### Checkboxes (if used)
- **Unchecked:** Border `1px solid #6272a4`, background transparent.
- **Checked:** Background `#50fa7b` (green), icon or checkmark.
- **Focus:** Visible outline in accent color.
- **Label:** Always adjacent, clickable.

### Lists and Tables

#### Table View (desktop/tablet ≥768px)

Full-width shadcn `Table` with alternating row backgrounds (`#282a36` and `#44475a`). Row height 48px–56px for comfortable spacing and 44px touch targets on action buttons. Hover state: slight background tint change.

**Column order (left to right):**

| # | Column Head | Cell Content | Alignment | Width Hint |
|---|------------|--------------|-----------|------------|
| 1 | Name | Service name (plain text, font-weight 500) | Left | flex-grow, min 120px |
| 2 | Type | Service type label (Electricity, Gas, Internet, Mobile, Water) | Left | ~100px |
| 3 | Amount | `$X,XXX.XX` or "—" if not set | Right | ~100px |
| 4 | Payment | `MMM DD` (e.g., "Sep 15") or "—" if not set | Center | ~90px |
| 5 | Due | `MMM DD` (e.g., "Sep 20") | Center | ~90px |
| 6 | Status | `Badge` component (OVERDUE / DUE SOON / NORMAL / PAID) | Center | ~110px |
| 7 | Actions | Action buttons (see below) | Right | ~160px |

**Actions column layout:**

The actions cell uses `display: flex`, `justify-content: flex-end`, `align-items: center`, and a fixed `gap` (8px). The kebab ⋮ is always the last (rightmost) element and never shifts position.

Unpaid bill:
```
[Mark as paid]  [⋮]
```

Paid bill:
```
                [⋮]
```

- "Mark as paid": `Button` variant `default`, size `sm`, visible only when `paid === false`.
- Kebab ⋮: `Button` variant `ghost`, size `icon` (36px × 36px), always present, always rightmost. Opens `DropdownMenu` with "Edit" and "Delete".

**Example rows:**

```
| Name    | Type        | Amount   | Payment | Due    | Status      | Actions              |
|---------|-------------|----------|---------|--------|-------------|----------------------|
| CFE     | Electricity | $450.00  | Sep 15  | Sep 05 | 🔴 OVERDUE  | [Mark as paid]   [⋮] |
| Claro   | Mobile      | $299.00  | —       | Sep 20 | 🟡 DUE SOON | [Mark as paid]   [⋮] |
| Telmex  | Internet    | $589.00  | Sep 01  | Sep 25 | ✅ PAID     |                  [⋮] |
| Naturgy | Gas         | —        | —       | Oct 15 | ⚪ NORMAL   | [Mark as paid]   [⋮] |
```

#### Card View (mobile <768px)

Each bill renders as a shadcn `Card` with the defined Surface (`#44475a`) background, 1px border, rounded corners. Cards stacked vertically with 8px gap.

**Card structure:**

```
┌─────────────────────────────────┐
│ CFE                   🔴OVERDUE │  ← CardHeader: name (left, font-weight 600) + Badge (right)
│ Electricity · $450.00           │  ← CardContent line 1: type + amount (or "—")
│ Due: Sep 05 · Paid: Sep 15      │  ← CardContent line 2: dates
│                [Mark as paid] [⋮]│  ← CardFooter: actions (flex justify-end)
└─────────────────────────────────┘
```

- **CardHeader:** Service name left-aligned (font-weight 600, `text-primary`), status `Badge` right-aligned.
- **CardContent line 1:** Type and amount joined by " · ". Amount formatted `$X,XXX.XX`; shows "—" if not set.
- **CardContent line 2:** "Due: MMM DD" always shown. " · Paid: MMM DD" appended only when payment date exists; otherwise omitted entirely (not shown as "—").
- **CardFooter:** Actions right-aligned, same flex layout as table: "Mark as paid" (if unpaid) + kebab ⋮ (always rightmost).
- Padding: 12px–16px inside card.

#### Status Badges
- **OVERDUE:** Red background (`#ff5555`), white text, rounded corners (border-radius 4px–8px).
- **DUE SOON:** Yellow background (`#f1fa8c`), dark text (`#282a36`), rounded corners.
- **NORMAL:** Cyan background (`#8be9fd`), dark text, rounded corners.
- **PAID:** Green background (`#50fa7b`), dark text, rounded corners.
- Include emoji or icon (🔴, 🟡, ⚪, ✅) plus text label for accessibility (color is never the sole indicator).
- Padding: 4px–8px, font-size 12px–14px, font-weight 600.

### Modals and Dialogs

#### Create/Edit Service Modal
- **Background overlay:** Semi-transparent dark (rgba(0, 0, 0, 0.5)).
- **Modal box:** Surface color (`#44475a`), white text, shadow or border.
- **Title:** Bold heading at top, clear action (e.g., "Create service" or "Edit service").
- **Form fields:** Stacked vertically, each with label, input, optional error message.
- **Action buttons:** Primary (Save) and secondary (Cancel) at bottom, right-aligned.
- **Close option:** X button in top-right corner or Escape key support.
- **Animation:** Slide up + fade in on appear, scale down + fade out on dismiss (Framer Motion).

#### Delete Confirmation Dialog
- **Title:** "Delete service?" (bold, prominent).
- **Body:** Service name and type (e.g., "CFE (Electricity)").
- **Buttons:** Destructive (red, "Confirm") on right, secondary (gray, "Cancel") on left.
- **Destructive button:** Red background (`#ff5555`), white text, clear warning.
- **Animation:** Scale + fade with spring timing, shake effect on delete action.
- **Focus on appear:** Focus the "Cancel" button by default (safer default).

### Toast Messages (Notifications)

#### Toast Container
- **Position:** Top-right corner, 16px from edges.
- **Stack:** Multiple toasts stack vertically with 8px gap.
- **Auto-dismiss:** 3 seconds (configurable for errors).
- **Manual dismiss:** X button on each toast.

#### Toast Types

**Success Toast:**
- Background: Green (`#50fa7b`), text: dark (`#282a36`).
- Icon: Checkmark (✅) or success icon.
- Examples: "✅ Service created", "✅ Paid", "✅ Deleted".

**Error Toast:**
- Background: Red (`#ff5555`), text: white.
- Icon: Error/warning icon (⚠️ or ❌).
- Examples: "❌ Error saving", "❌ Service not found".
- Longer auto-dismiss (5–6 seconds) to allow reading.

**Info Toast:**
- Background: Blue/cyan (`#8be9fd`), text: dark.
- Icon: Information icon (ℹ️).
- Example: "✅ Notification cancelled".

#### Accessibility
- Toasts shall announce to screen readers using `role="alert"` or `aria-live="polite"`.
- Toasts shall not auto-dismiss so quickly that users cannot read them (minimum 3 seconds for success).
- Include a close button for users who want to dismiss immediately.

### Undo Toast (8-Second Undo Window on Create)

#### Purpose
When the user creates a bill, the modal closes immediately, the bill appears in the list, and an Undo toast is displayed for 8 seconds. Within that window the user can click "Undo" to delete the bill and reopen the form with their original input. If the window expires, the Telegram notification is sent and the bill remains.

#### Visual Design
- **Position:** Bottom-right of the viewport, stacked above other toasts if any.
- **Container:** Toast surface (`#44475a`), rounded corners, subtle shadow, ~360px wide on desktop.
- **Message line:** "✅ Service created — Sending notification in {N}s" where {N} counts down 8 → 0 in whole seconds.
- **Progress indicator:** A horizontal progress bar (shadcn `Progress`) underneath the message text, depleting from full to empty over 8 seconds. No circular variant.
- **Undo button:** Right side of the toast, secondary-outline style, label "Undo", always enabled during the countdown.
- **Colors:** Neutral accent (`#8be9fd`) for the progress bar.

#### Animation
- **Duration:** 8 seconds (linear timing for a predictable visual pace).
- **Entrance:** Slide in from the right and fade in over 0.3s (Framer Motion spring).
- **Exit:** Slide out to the right and fade out over 0.3s, whether the countdown expired naturally, the user clicked Undo, or the toast was dismissed manually.

#### Behavior
- **Undo click:** Sends DELETE to the backend for the just-created bill, closes the toast, removes the bill from the list, and reopens the create form pre-filled with the values the user submitted. Displays a brief info toast: "Reverted — edit and save again".
- **Expiration:** Toast fades out; the backend sends the Telegram notification (no additional frontend action).
- **Stacking:** Multiple Undo toasts may be visible at once (one per rapidly created bill); each has an independent countdown and Undo action.
- **Non-blocking:** The toast never covers primary UI in a way that prevents the user from creating, editing, or deleting other bills.

#### Accessibility
- Numeric countdown shall always be visible (not conveyed by animation alone).
- The toast shall be focusable, and the Undo button reachable via Tab.
- Use `role="status"` or `aria-live="polite"` on the toast so screen readers announce it when it appears (once), without re-announcing every second.
- The countdown numeric value shall not be part of the aria-live updates (would create noise); the announcement fires on toast entrance and once more if the countdown expires.
- Respect `prefers-reduced-motion`: replace the depleting stroke and pulse with a static numeric countdown and no scaling animation.

### Chart (Billing-Period Data)

#### Chart Container
- **Background:** Surface color (`#44475a`) with subtle border.
- **Padding:** 16px–24px.
- **Title:** Identify the selected service type and six billing periods.
- **Legend:** Show the average across six billing periods, positioned below or
  to the side.

#### Bar Chart (shadcn Chart)
- **Bars:** Themed automatically via shadcn Chart's CSS variable integration with the defined palette.
- **X-axis:** Billing-period labels; electricity and gas labels represent
  bimonthly periods.
- **Y-axis:** Total amount per billing period, formatted as $X,XXX, starting at
  0. Include paid and unpaid services with non-null amounts.
- **Hover state:** Bar highlights (opacity increase or color change), tooltip shows exact count.
- **Animation:** Bars stagger in from bottom over ~0.5s, smooth easing.
- **Responsive:** Width 100%, height auto (min 250px, max 400px).

#### No Data State
- Display centered message: "No data for this service" if type has no bills.
- Use secondary text color.

---

## Interaction States

### Form States

#### Pristine
- All fields empty or showing placeholder.
- Submit button disabled (grayed out) or enabled but with neutral appearance.
- No error messages visible.

#### Valid Input
- All required fields filled.
- Due date ≥ payment date (if applicable).
- Submit button enabled, highlighted in accent color.

#### Validation Error
- Problem field: Border turns red, error message appears below field.
- Error message: Small text in red, plain language (e.g., "Due date must be on or after payment date").
- Submit button: Remains disabled.
- Focus: On error field after validation attempt (or after form mount, if pre-validation).

#### Loading (Form Submit)
- Submit button: Shows spinner, disabled.
- Fields: Disabled (read-only) during submission.
- Label or message: "Saving..." (optional, in button or nearby).

#### Success (After Submit)
- Toast message: "✅ Service created" (appears for 3 seconds).
- Modal: Closes automatically after success toast appears.
- Form: Resets to pristine state (if creating new).

#### Server Error (After Submit)
- Toast message: "❌ Error saving" + specific error detail.
- Fields: Re-enabled for editing.
- Error message: Remains visible; user can correct and resubmit.
- Form: Does not close; allows retry without re-entering data.

### List States

#### Loading
- Show skeleton cards or spinner while fetching bills.
- Disable filter controls temporarily.
- Placeholder message: "Loading services..." or similar.

#### Empty
- When no bills exist or no bills match filters.
- Message: "No services" or "No services in {filter_description}".
- Centered, secondary text color.
- Suggest action: "Create a new one" (link to create form).

#### Populated
- Bills displayed in sorted order (by urgency, then due date).
- Hover on row: Background tint, action buttons visible.
- Click on row: Opens bill detail or edit form (if interactive).

#### Deleted Bill
- Row fades out and slides away (Framer Motion animation).
- Toast confirms: "✅ Deleted".
- List re-sorts automatically if urgency group changed.

### Action States

#### Mark as Paid
- Button disabled during API call (spinner visible).
- On success: Badge changes to ✅ PAID, row may slide or reorder.
- Toast: "✅ Paid".
- On error: Toast with error detail, button re-enabled.

#### Delete
1. User clicks "Delete" button.
2. Confirmation dialog appears (scaled + faded in).
3. User confirms or cancels.
4. On confirm: Row shakes or scales down, fades out (animation).
5. List updates, bill removed.
6. Toast: "✅ Deleted".

#### Edit
1. User clicks "Edit" button.
2. Modal opens (slide up + fade) with form pre-filled.
3. User makes changes, validates.
4. On save: Modal closes, list updates with new data.
5. Toast: "✅ Service updated".
6. On cancel: Modal closes without saving, no toast.

#### Filter & Sort
- Filters update list instantly (no page reload).
- If type filter applied: Chart fades in below list.
- If filters cleared: Chart fades out, all bills shown.
- Subtitle updates to reflect active filter.

---

## Animation Principles

### General Guidelines
- **Timing:** Keep animations brief (0.2s–0.5s) to feel responsive.
- **Easing:** Use smooth easing (ease-in-out) or spring damping for natural feel.
- **Purpose:** Animations enhance, not distract; they should clarify state changes, not delay actions.
- **Performance:** Animate only CSS transforms (position, scale, opacity) or properties that don't trigger layout recalculation.
- **Accessibility:** Respect `prefers-reduced-motion`; provide non-animated alternatives or static feedback.
- **FPS Target:** 60fps (60Hz refresh rate); avoid jank or frame drops.

### Specific Animations (Framer Motion)

#### Bill Item (ServiceItem)
- **Entrance:** Fade in + slide left (opacity 0→1, x -20px→0, duration 0.3s).
- **Hover:** Scale up slightly (scale 1→1.02, duration 0.2s).
- **Exit (delete):** Fade out + slide right (opacity 1→0, x 0→20px, duration 0.3s).
- **Status change:** Badge color transitions smoothly (0.2s), optionally slight pulse.

#### Modal
- **Background overlay:** Fade in (opacity 0→1, duration 0.2s).
- **Modal box:** Scale + fade (scale 0.95→1, opacity 0→1, duration 0.3s, spring timing for bounce).
- **Exit:** Reverse animations, duration 0.2s.
- **Close button hover:** Icon rotates slightly or changes color.

#### Countdown Timer
- **Circular stroke:** Depletes linearly (stroke-dashoffset animate over 8s).
- **Numeric display:** Countdown digits update every 1 second (opacity blink if desired, but not required).
- **Pulse (3s remaining):** Scale 1→1.1→1, opacity pulse, duration 0.3s, repeated.
- **Completion:** Fade out (opacity 1→0) over 0.3s.

#### Toast
- **Entrance:** Slide in from right + fade (x 400→0, opacity 0→1, duration 0.3s, spring timing).
- **Exit (auto or manual):** Slide out to right + fade (x 0→400, opacity 1→0, duration 0.3s).
- **Multiple toasts:** Each stacks with 8px gap; entering toast pushes others down smoothly.

#### Chart (ConsumptionByPeriodChart)
- **Container entrance:** Fade in + slide up (opacity 0→1, y 20px→0, duration 0.5s).
- **Chart bars:** Stagger animation (each bar animates in sequentially, delay 0.05s per bar, duration 0.4s each).
- **Bar hover:** Highlight color change with shadow, scale slightly (1→1.05), smooth transition.

#### DeleteConfirmation Dialog
- **Entrance:** Scale + fade (scale 0.8→1, opacity 0→1, spring timing for bounce, duration 0.3s).
- **Shake effect (on confirm):** Horizontal shake (x -5→5→-5→0 over 0.4s, multiple cycles).
- **Exit:** Scale down + fade (scale 1→0.8, opacity 1→0, duration 0.2s).

---

## Accessibility Requirements

The app shall target WCAG 2.1 AA conformance.

### Semantic Structure
- Use semantic HTML: `<header>`, `<main>`, `<section>`, `<form>`, `<label>`, `<button>`, `<input>`, `<ul>`/`<li>` for lists.
- Headings shall follow a logical hierarchy: h1 (app title) → h2 (sections) → h3 (subsections). Do not skip levels.
- Forms shall use `<label>` elements with `for` attributes associated with `<input>` IDs (not just placeholder text).
- Lists shall use semantic list markup (`<ul>`, `<li>` or table `<tr>`, `<td>`).
- Buttons shall be `<button>` elements; links shall be `<a>` elements.

### Keyboard Navigation
- All interactive elements shall be focusable via `Tab` key.
- Tab order shall follow logical visual and task order (add task → review tasks → edit/delete).
- **Escape key** shall close modals and dialogs.
- **Enter key** shall submit forms and activate primary buttons.
- Focus shall be visible at all times (outline: 2px solid #8be9fd, outline-offset: 2px, or similar).
- Focus shall return to a sensible control after a dialog closes (e.g., back to the list or "Create" button).

### Labels and Descriptions
- Every input shall have a persistent, visible label (not just placeholder).
- Form validation errors shall be associated with their inputs using `aria-describedby` or `aria-invalid="true"`.
- Icon-only buttons shall have `aria-label` or `title` attribute with accessible name (e.g., `aria-label="Edit bill"`).
- Modals shall have a semantic title (e.g., `<h1>` with `id`, referenced by modal `role="dialog" aria-labelledby="title-id"`).

### Assistive Technology Support
- Use `aria-live="polite"` or `role="alert"` on toast messages so screen readers announce them.
- Use `aria-busy="true"` on loading states; update to `aria-busy="false"` when done.
- Use `aria-disabled="true"` when disabling buttons (in addition to HTML `disabled` attribute if applicable).
- Status messages and validation errors shall be announced, not just visually displayed.
- Avoid ARIA overuse; prefer semantic HTML when possible.

### Color and Contrast
- Do not rely on color alone to communicate status (pair with text, icon, or position).
- All text and interactive elements shall meet WCAG AA contrast (4.5:1 for normal text, 3:1 for large/bold).
- Verify contrast on all color combinations (status badges, buttons, text on backgrounds).

### Responsive Design and Mobile
- Layout shall not require horizontal scrolling on any device ≥576px.
- Touch targets (buttons, links, inputs) shall be minimum 44px × 44px.
- Form inputs shall be ≥16px font-size to avoid mobile zoom on focus.
- Viewport meta tag shall be set for mobile rendering.

### Reduced Motion
- Respect `prefers-reduced-motion` media query.
- If user has enabled reduced motion, disable or simplify animations:
  - Remove entrance/exit animations; use instant display/hide.
  - Remove hover scale effects; rely on color or opacity.
  - Keep essential feedback (toasts, loading spinners) but without animation.
- Provide static visual feedback (icons, colors) that does not rely on animation.

---

## Component Library

The project uses shadcn/ui components as the base for every interactive element. Feature components compose these primitives; do not build alternate versions of the same primitive.

### shadcn/ui primitives to install

The following 18 shadcn/ui primitives shall be installed via the shadcn CLI into `client/src/components/ui/`:

`AlertDialog`, `Badge`, `Button`, `Calendar`, `Card`, `Chart`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Popover`, `Progress`, `Select`, `Separator`, `Skeleton`, `Sonner`, `Table`, `Tooltip`

### Primitive → use case mapping

#### Buttons (`Button`)
| Variant | Size | Where Used |
|---------|------|------------|
| `default` | default | "Save" (form), "Mark as paid" (bill row), "Apply" (range calendar), "+ New bill" (filter panel) |
| `outline` | default | "Cancel" (form), "Export PDF" (filter panel), "Back" (range calendar), "Undo" (Undo toast) |
| `destructive` | default | "Confirm" (delete dialog) |
| `ghost` | `icon` | Kebab trigger ⋮ (bill row) |

#### Forms
| Component | Where Used | Configuration |
|-----------|------------|---------------|
| `Dialog` | Create bill modal, Edit bill modal | `DialogHeader` + `DialogTitle` + `DialogDescription` + form fields + `DialogFooter` with Save/Cancel buttons |
| `Input` | "Service name" field, "Amount" field (type=number, step=0.01) | Always paired with `Label` |
| `Label` | Every form field | Persistent visible label above each input |
| `Select` | "Service type" in bill form (Electricity, Gas, Internet, Mobile, Water); "Type" filter in filter panel (All + 5 types) | `SelectTrigger` + `SelectContent` + `SelectItem` per option |
| `Calendar` | "Payment date" picker (single mode), "Due date" picker (single mode), Custom range date filter (range mode) | Wrapped in `Popover` |
| `Popover` | Wraps `Calendar` in form date pickers; wraps preset list + Range Calendar in date filter | `PopoverTrigger` (button or text) + `PopoverContent` |

#### Data Display
| Component | Where Used | Configuration |
|-----------|------------|---------------|
| `Table` | Bill list on desktop/tablet (≥768px) | `TableHeader` + `TableBody` + `TableRow` + `TableHead` + `TableCell`. 7 columns in order: Name, Type, Amount, Payment Date, Due Date, Status, Actions. Alternating row backgrounds. |
| `Card` | Bill item on mobile (<768px); chart container; filter panel container | `CardHeader` + `CardContent` + `CardFooter` |
| `Badge` | Status indicator per bill | 4 custom variants: `overdue` (Red #ff5555), `urgent` (Yellow #f1fa8c, dark text), `normal` (Cyan #8be9fd, dark text), `paid` (Green #50fa7b, dark text) |
| `Separator` | Visual divider between filter panel and bill list | Horizontal rule |

#### Actions & Menus
| Component | Where Used | Configuration |
|-----------|------------|---------------|
| `DropdownMenu` | Kebab menu ⋮ per bill row | `DropdownMenuTrigger` (ghost icon button) + `DropdownMenuContent` + `DropdownMenuItem` ("Edit", "Delete") |
| `AlertDialog` | Delete bill confirmation | `AlertDialogContent` with bill name/type, `AlertDialogAction` (Confirm, destructive), `AlertDialogCancel` (Cancel, default focus) |
| `Tooltip` | Icon-only buttons (kebab ⋮, export icon, + New bill if icon-only on small screens) | `TooltipTrigger` + `TooltipContent` with accessible text |

#### Feedback & Loading
| Component | Where Used | Configuration |
|-----------|------------|---------------|
| `Sonner` | All notification toasts (success, error, info) + Undo toast (custom JSX) | `<Toaster />` mounted at App root. Auto-dismiss 3s for standard toasts; 8s for Undo toast. |
| `Progress` | Horizontal bar inside Undo toast | Value goes from 100 → 0 over 8 seconds (linear). Accent color. |
| `Skeleton` | Loading placeholder while bill list fetches | Shape matches `Table` rows (desktop/tablet) or `Card` layout (mobile). 3–5 skeleton rows visible during loading. |

#### Data Visualization
| Component | Where Used | Configuration |
|-----------|------------|---------------|
| `Chart` | Consumption-by-billing-period bar chart (when type filter active) | `ChartContainer` + Recharts `BarChart` + `Bar` + `XAxis` + `YAxis` + `ChartTooltip` + `ChartTooltipContent`. Wrapped in `Card`. Auto-themed with the defined palette CSS variables. |

### Feature components → shadcn composition

Each feature component in `client/src/components/` composes the primitives above:

- **App.tsx** — Sonner `<Toaster />` provider, layout: header + `FilterPanel` + `ServiceList` + `ConsumptionByPeriodChart` (conditional).
- **FilterPanel.tsx** — `DateFilter` + `TypeFilter` + `Button` (Export PDF, outline) + `Button` (+ New bill, default). Wrapped in a `Card` or `div`.
- **DateFilter.tsx** — `Popover` > preset list (4 × `Button` ghost: This month ✓, Last month, Custom range..., All time) or `Calendar` mode=range + `Button` (Apply) + `Button` (Back).
- **TypeFilter.tsx** — `Select` with All + 5 service type options.
- **ServiceForm.tsx** — `Dialog` > `Label` + `Input` (name) + `Select` (type) + `Input` (amount, type=number) + `Popover` > `Calendar` (payment date) + `Popover` > `Calendar` (due date) + `DialogFooter` > `Button` (Save, disabled until valid) + `Button` (Cancel).
- **ServiceList.tsx** — `Table` (≥768px) or `Card` list (<768px) + `Skeleton` (loading). Maps `ServiceItem` per row/card.
- **ServiceItem.tsx** — Desktop: `TableRow` > 7 × `TableCell` in order: name, type, amount (right-aligned, "$X,XXX.XX" or "—"), payment date ("MMM DD" or "—"), due date ("MMM DD"), status (`Badge`), actions (flex justify-end: `Button` Mark as paid + `DropdownMenu` ⋮, kebab always rightmost). Mobile: `Card` > `CardHeader` (name left + `Badge` right) + `CardContent` (type · amount, due · paid) + `CardFooter` (actions right-aligned, same kebab-rightmost rule).
- **DeleteConfirmation.tsx** — `AlertDialog` > title + body (name + type) + `AlertDialogAction` (Confirm, destructive) + `AlertDialogCancel` (Cancel).
- **UndoToast.tsx** — Sonner custom toast > message + `Progress` (8s) + `Button` (Undo, outline).
- **ConsumptionByPeriodChart.tsx** — `Card` > `CardHeader` (title) + `CardContent` > `ChartContainer` + `BarChart` + `Bar` + `XAxis` + `YAxis` + `ChartTooltip`.

### Rules

- Components live under `client/src/components/ui/` (installed via the shadcn CLI). Edit them directly to adjust theme or behavior; do not shadow them with a wrapper unless there's a clear repeated-use reason.
- Feature components (in `client/src/components/`) compose these primitives; a feature component's file should mostly be layout and event wiring, not styling.
- When a needed component is not in shadcn/ui, first check the community registry ([ui.shadcn.com/blocks](https://ui.shadcn.com/blocks) and third-party registries); if still missing, build on Radix primitives directly rather than reaching for another library.
- Style customization goes through Tailwind classes or CSS variables, never through inline `style={{...}}` overriding shadcn's design.

---

## Dos and Don'ts

### Do
✅ Use consistent spacing (multiples of 4px, 8px, 16px).
✅ Pair color with text or icons for status/state.
✅ Provide clear, persistent labels on all form fields.
✅ Include visible focus indicators for keyboard navigation.
✅ Test contrast ratios on all text and backgrounds.
✅ Announce dynamic content changes to assistive technology.
✅ Keep animations brief and purposeful (0.2s–0.5s).
✅ Require confirmation before destructive actions (delete).
✅ Provide error messages that explain the problem and solution.

### Don't
❌ Use color alone to communicate status (add text or icon).
❌ Rely on placeholder text as the only label.
❌ Disable buttons without explaining why.
❌ Use animations that prevent users from completing actions.
❌ Create loading states that last longer than necessary.
❌ Require users to memorize keyboard shortcuts.
❌ Auto-dismiss error toasts before users can read them.
❌ Animate transforms that trigger layout recalculation (avoid animating width, height).
❌ Create one-off custom components when Material/standard components fit.

---

## Testing and Validation

### Accessibility Testing
- Run automated tools (Axe DevTools, Lighthouse) to catch basic issues.
- Test keyboard navigation (Tab, Shift+Tab, Escape, Enter).
- Test with screen reader (NVDA, JAWS, VoiceOver).
- Verify contrast ratios (WebAIM contrast checker).
- Test `prefers-reduced-motion` media query support.

### Visual Regression
- Test layout on desktop (1024px+), tablet (768px–1023px), and narrow screens.
- Verify no horizontal scrolling.
- Test all interactive states (hover, focus, active, disabled, loading, error, success).

### Performance
- Verify animations run at 60fps (Chrome DevTools Performance tab).
- Check that no animations cause jank or frame drops.
- Ensure form interactions feel snappy (<500ms response).

---

**Version:** 2.0  
**Status:** Design System Complete  
**Last Updated:** September 2026
