# Coding Guidelines

## Purpose

These guidelines apply across all feature branches. Agents should modify this file only when a cross-cutting coding convention changes. API details belong in `api-contract.md`; architecture boundaries belong in `architecture.md`.

The project should favor code that is easy to read, test, change, and review. Consistency matters because this repository contains a React frontend and a Node.js backend, but each implementation should still follow the conventions of its local package.

## General Formatting

Use two spaces for indentation, semicolons at the end of statements, and single quotes for JavaScript and TypeScript strings. Keep lines and functions focused enough that their purpose is easy to understand at a glance. Use descriptive names for variables, functions, components, hooks, and test cases; avoid one-letter names except for short, conventional callback parameters where the meaning is unambiguous.

Preserve the surrounding file's style when making a small change. Avoid unrelated reformatting, broad refactors, or generated metadata changes in a feature-focused commit. Use comments sparingly: code should explain itself, while comments should clarify intent, constraints, or non-obvious decisions rather than restate the implementation. When a comment starts to feel necessary because the code is confusing, prefer renaming or restructuring the code over adding the comment.

## Imports and Modules

Organize imports consistently at the top of each file. Group external packages before local modules, and keep local stylesheets or test utilities near the code that uses them. Remove unused imports rather than leaving dead dependencies in place.

The frontend uses ES module import syntax with TypeScript. The backend uses Node.js CommonJS `require` and `module.exports`. Follow the module system already established by the package being changed unless there is a deliberate migration plan documented in the change.

Prefer importing the smallest public surface needed from a module. Keep dependency direction clear: shared or lower-level utilities should not depend on application entry points, and UI components should use the existing API boundary rather than duplicating backend access logic. When the same fetch call appears in more than one component, extract it into a hook or service module instead of duplicating it.

Use the configured frontend alias for project modules: `@/components/ui/button`, `@/lib/date`, and `@/types/services`. shadcn primitive source files use lowercase kebab-case names (`alert-dialog.tsx`, `dropdown-menu.tsx`); import their public exports rather than deep-importing Radix dependencies from feature components.

## Linter and Quality Checks

Use the repository's available automated checks before submitting a change. Run the relevant package tests and a production build or other package-level validation for the code being changed. The frontend package uses the Create React App ESLint configuration through its React toolchain; keep new code free of ESLint errors and address warnings when practical. The backend follows the same JavaScript conventions; if a standalone ESLint configuration is added, it should be used consistently across the affected package.

Do not suppress a lint rule broadly to hide a real issue. When an exception is necessary, keep it local (an inline `eslint-disable-next-line` with the specific rule) and explain the reason in a nearby comment. Treat compiler, test, and lint failures as feedback about the implementation rather than something to work around in the commit.

TypeScript in the frontend should compile without errors. Prefer explicit types on function signatures and module exports; let inference handle local variables where the type is obvious. Avoid `any` unless there is no reasonable alternative, and when it is unavoidable, document why.

## Design and Reuse

Follow the DRY principle: do not duplicate business rules, validation, request formatting, or UI behavior when a clear shared function or component can express it. Before adding a helper, make sure it removes meaningful duplication and has a clear responsibility. Avoid premature abstractions that make simple code harder to follow; two similar-looking uses may diverge tomorrow, and extracting them too early forces both to conform to a shape that fits neither well.

Respect the project's layered architecture (documented in `docs/architecture.md`). Backend code belongs to one of routes, services, repositories, or external clients; frontend code belongs to one of components, hooks, api services, or types. A layer may depend on the layers below it, never above. Do not run SQL inside a route handler, do not call `fetch` inside a component, and do not put business rules in the repository or the API-service layer.

Keep functions and components small and cohesive. Separate data fetching, state transitions, validation, and presentation when doing so makes behavior easier to test. Prefer existing utilities, APIs, and project patterns over introducing a new abstraction for a single use.

Use stable data shapes and explicit error handling at module boundaries. Validate input before persistence or network calls, return useful errors, and preserve existing behavior for unrelated workflows. Avoid mutating shared state directly; create updated values in the same style as the surrounding React code (immutable updates for state, spread operators for objects and arrays).

## Backend Practices

Keep HTTP handlers responsible for translating requests and responses while keeping database operations and validation understandable and testable. Validate route parameters and request bodies before executing queries, and reject invalid input with a clear HTTP 400 response before touching the database. Use parameterized database statements rather than interpolating user input into SQL to prevent injection and to keep query behavior predictable. Return appropriate status codes (200, 201, 204 for success; 400, 404 for client errors; 500 for server errors) and consistent JSON error responses (`{ error, message }`).

Backend changes should preserve the API contract unless the change explicitly updates the corresponding tests and documentation. Keep server startup and application construction separable so endpoints can be tested without starting a long-running process; export the Express app from one module and start the HTTP listener from another.

External service calls (Telegram) should be isolated in their own module so they can be stubbed during tests. Failures from external services should be logged and handled gracefully, not propagated as user-facing errors when the primary operation (creating or updating a bill) succeeded.

## Frontend Practices

Build React components from predictable state and event flows. Give controls clear names, handle loading and error states explicitly, and avoid duplicating API calls or state synchronization logic across components. Extract shared data-fetching logic into custom hooks (`useServices`, `useConsumptionStats`) so components stay focused on presentation. Keep user-facing behavior aligned with the functional requirements and UI guidelines.

Use accessible semantic elements and preserve keyboard and screen-reader behavior when changing markup. Every input needs a persistent visible label, every icon-only button needs an accessible name, and modals need proper focus management on open and close. Prefer the project's component and styling conventions over isolated custom implementations. Keep CSS selectors scoped and use CSS variables from the defined palette rather than hardcoding color values in individual components.

Compose the UI from canonical shadcn/ui primitives (`client/src/components/ui/`) rather than building parallel versions of the same control. If a button, dialog, input, table, or badge is needed, use the shadcn/ui component; do not introduce a second component library alongside it. Feature components use Tailwind's standard spacing, typography, radius, and semantic color utilities (`p-4`, `gap-4`, `text-sm`, `rounded-lg`, `bg-primary`) instead of one-off CSS values. Global CSS is limited to Tailwind layers, Dracula theme tokens, and reusable feature layout rules.

Animations from Framer Motion should enhance perceived responsiveness, not delay user actions. Respect the user's `prefers-reduced-motion` preference; if motion is reduced, disable entrance and exit animations while preserving essential feedback (color changes, focus indicators, toast messages).

All user-facing text (labels, buttons, toasts, tooltips, `aria-label` values, empty states, error messages) shall come from i18n locale files loaded through `react-i18next`, following the key/value pattern documented in the UI guidelines. Do not hardcode strings in JSX; use `t('some.key')`. When adding a new component or feature, add the corresponding keys to `client/src/locales/en.json` in the same commit. Interpolate variables with `{{name}}` placeholders rather than string concatenation, so translators can reorder them for other languages.

## Testing and Documentation

New features and behavior changes should include focused tests at the appropriate level, as described in the testing guidelines. Keep implementation details out of tests when a user-visible behavior or API contract can be tested instead. Update documentation—functional requirements, UI guidelines, testing guidelines, or this document—when a change affects the behavior they describe.

A change is ready for review when its code is formatted consistently, its relevant checks pass, its error paths are considered, its documentation and tests describe the behavior that actually exists, and its diff is scoped to the feature or fix at hand.

---

**Version:** 1.0  
**Status:** Coding Guidelines Complete  
**Last Updated:** September 2026
