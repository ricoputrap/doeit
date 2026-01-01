# Plan: Doeit MVP (Desktop-first, IDR-only) — Phased Implementation Plan

This plan implements the MVP described in `SYSTEM_DESIGN.md` using:

- Next.js UI (React) + **Route Handlers (HTTP API) only**
- SQLite persistence
- Desktop-first UI with **Sidebar navigation**
- **Shadcn UI components** for clean, consistent design
- Snake_case DB columns
- Module-based colocation (feature modules contain their own components, utils, types, tests)

Each phase is designed so you can **run the app and see visible progress** without waiting for the final phase.

---

## Module Structure Check

- [x] Confirmed that new files are colocated within their modules (feature-local code lives in that module).
- [x] Confirmed Shadcn UI components are properly integrated and used consistently across pages.
- [x] Confirmed sidebar navigation structure with proper responsive behavior.
- [x] Confirmed types use `.ts` files with explicit exports/imports (no ambient `.d.ts`).
- [x] Confirmed every logic file has a sibling test file.
- [x] Confirmed API is implemented only via Route Handlers (no Server Actions / Server Components assumptions).

---

## Current Directory Layout

- `app/`
  - `api/` (Route Handlers)
    - `health/route.ts` ✅
    - `wallets/route.ts`
    - `wallets/[id]/route.ts`
    - `categories/route.ts`
    - `categories/[id]/route.ts`
    - `transactions/route.ts`
    - `transactions/[id]/route.ts`
    - `transfers/route.ts`
    - `budgets/route.ts`
    - `dashboard/summary/route.ts`
    - `dashboard/timeseries/route.ts` (or split by concern)
  - UI routes (pages) - **Using Shadcn UI + Sidebar**
    - `layout.tsx` ✅ (Sidebar layout implemented)
    - `page.tsx` ✅ (Welcome page with Shadcn components)
    - `dashboard/page.tsx` ✅ (Dashboard with sidebar)
    - `transactions/page.tsx` ✅ (Transactions with sidebar)
    - `wallets/page.tsx` ✅ (Wallets with sidebar)
    - `categories/page.tsx` ✅ (Categories with sidebar)
    - `budgets/page.tsx` ✅ (Budgets with sidebar)
- `components/`
  - `sidebar.tsx` ✅ (Custom sidebar component with Shadcn UI)
  - `ui/` (Shadcn UI components)
    - `button.tsx` ✅
    - `card.tsx` ✅
    - `input.tsx` ✅
    - `label.tsx` ✅
    - `table.tsx` ✅
    - `badge.tsx` ✅
    - `select.tsx` ✅
    - `dropdown-menu.tsx` ✅
    - `navigation-menu.tsx` ✅
    - `separator.tsx` ✅

If you prefer a `src/` root, mirror the same module approach under `src/` and import from there. The key is to avoid dumping feature-specific helpers into global folders.

---

## Testing Strategy (MVP)

- **Unit tests**: pure helpers (formatters, validation, query builders) live next to code.
- **Integration tests**: DB/data-access functions (SQLite) with a temporary test DB.
- **Route handler tests**: call handler functions with mocked Requests, or test through Next’s fetch layer if configured.
- **UI smoke tests** (minimal): render key pages/components and validate basic structure/empty states.

Tooling choice for tests should match the existing stack, but the plan assumes a typical TypeScript test runner is added/configured if missing.

---

## Phase 0 — Foundations (You can see a running shell)

Goal: establish project conventions, Shadcn UI + Sidebar desktop layout baseline, and a "health" API to validate the HTTP boundary.

### Execution Steps

- [x] **Step 0.1**: Implement Shadcn UI components and create desktop-first layout with sidebar navigation **AND** add UI smoke tests.
  - Deliverable: ✅ COMPLETED - App renders with sidebar navigation (Dashboard / Transactions / Wallets / Categories / Budgets) using Shadcn UI components. All pages styled consistently.

- [x] **Step 0.2**: Add `GET /api/health` Route Handler **AND** add a route handler test.
  - Deliverable: ✅ COMPLETED - Health endpoint implemented and tested. API boundary established.
  - Status: ✅ COMPLETED - Created health endpoint at `app/api/health/route.ts` with test at `app/api/health/route.test.ts`.

---

## Phase 1 — Database Layer (You can see seed data in UI placeholders)

Goal: add SQLite data layer with snake_case schema, minimal migrations/initialization, and safe access patterns. UI is ready with Shadcn components and sidebar.

### Execution Steps

- [ ] **Step 1.1**: Implement DB bootstrap (connection + migration runner) in a dedicated DB module **AND** add integration tests that create a test DB and verify schema exists.
  - Deliverable: A repeatable way to initialize schema locally and in tests.

- [ ] **Step 1.2**: Define schema for `wallets` and `categories` (snake_case columns) **AND** test schema constraints (e.g., NOT NULL names).
  - Deliverable: DB tables exist: `wallets`, `categories`.

- [ ] **Step 1.3**: Add seed utilities for local dev (optional) **AND** test that seed inserts expected rows.
  - Deliverable: You can populate a small set of wallets/categories for quick UI testing.

---

## Phase 2 — Wallets & Categories (You can CRUD reference data)

Goal: implement reference data CRUD end-to-end (Route Handlers + desktop-first pages with Shadcn UI).

### Execution Steps

- [ ] **Step 2.1**: Implement Wallets data-access functions (list/create/update/delete) **AND** add unit/integration tests for each.
  - Deliverable: Wallet operations work at the data layer.

- [ ] **Step 2.2**: Implement Wallets Route Handlers (`/api/wallets`, `/api/wallets/:id`) **AND** add route handler tests.
  - Deliverable: Wallet CRUD over HTTP.

- [ ] **Step 2.3**: Build desktop-first Wallets page with Tailwind (table + modal/drawer form) using the API **AND** add UI smoke test.
  - Deliverable: You can manage wallets in the UI.

- [ ] **Step 2.4**: Implement Categories data-access functions (CRUD) **AND** add tests.
  - Deliverable: Category operations work at the data layer.

- [ ] **Step 2.5**: Implement Categories Route Handlers (`/api/categories`, `/api/categories/:id`) **AND** add tests.
  - Deliverable: Category CRUD over HTTP.

- [ ] **Step 2.6**: Build desktop-first Categories page (table + create/edit) **AND** add UI smoke test.
  - Deliverable: You can manage categories in the UI.

---

## Phase 3 — Transactions (Expense/Income) (You can record and browse transactions)

Goal: implement transactions for expense and income first (most value early). UI foundation with Shadcn components already in place.

### Execution Steps

- [ ] **Step 3.1**: Define transaction validation utilities (IDR amount rules, required fields by type) **AND** add unit tests.
  - Deliverable: Centralized validation that UI and API can share (API must enforce).

- [ ] **Step 3.2**: Implement Transactions data-access (create/list with filters; update/delete) **AND** add integration tests for filters (date range, wallet, category, type).
  - Deliverable: Transactions persist and can be queried predictably.

- [ ] **Step 3.3**: Implement Transactions Route Handlers (`/api/transactions`, `/api/transactions/:id`) **AND** add tests.
  - Deliverable: Expense/income CRUD over HTTP (at least create+list for MVP visibility).

- [ ] **Step 3.4**: Build desktop-first Transactions page (filter bar + table + create form) **AND** add UI smoke test.
  - Deliverable: You can add expenses/income and see them listed.

---

## Phase 4 — Transfers (Atomic wallet-to-wallet movement) (You can move money between wallets)

Goal: implement transfer business rules and atomic writes (two linked entries). Forms and UI components ready via Shadcn.

### Execution Steps

- [ ] **Step 4.1**: Implement transfer creation in data-access with DB transaction (two linked transaction rows via `transfer_id`) **AND** add integration tests verifying atomicity and balanced entries.
  - Deliverable: Transfer write is all-or-nothing and creates two entries.

- [ ] **Step 4.2**: Implement `/api/transfers` Route Handler (create) **AND** add tests for validation (wallets not equal, amount > 0).
  - Deliverable: Transfers are created via HTTP.

- [ ] **Step 4.3**: Extend Transactions UI to include a “Transfer” create flow (desktop modal/drawer) **AND** add UI smoke test.
  - Deliverable: Users can initiate transfers from the UI.

---

## Phase 5 — Budgets (Monthly, per category) (You can set a budget and view budget vs actual)

Goal: implement monthly budgets and "budget vs actual" calculation. Budget UI components already designed with Shadcn.

### Execution Steps

- [ ] **Step 5.1**: Implement Budgets data-access (list-by-month, upsert by month+category, delete) **AND** add integration tests for upsert behavior.
  - Deliverable: One budget per (month, category).

- [ ] **Step 5.2**: Implement Budgets Route Handlers (`/api/budgets`) **AND** add tests.
  - Deliverable: Budgets manageable via HTTP.

- [ ] **Step 5.3**: Implement budget aggregation query: actual spent per category per month **AND** add tests with seeded transactions.
  - Deliverable: Accurate budget vs actual numbers.

- [ ] **Step 5.4**: Build desktop-first Budgets page (month selector + table with limit/actual/remaining) **AND** add UI smoke test.
  - Deliverable: You can set budgets and see progress.

---

## Phase 6 — Dashboard (Aggregations & Charts) (You can see real insights)

Goal: implement the MVP dashboard endpoints and UI widgets including "money left to spend". Dashboard layout with Shadcn cards ready.

### Execution Steps

- [ ] **Step 6.1**: Implement wallet balance + net worth aggregation (derived from ledger) **AND** add integration tests for computed balances.
  - Deliverable: Computed balances are correct.

- [ ] **Step 6.2**: Implement dashboard summary endpoint(s) including:
  - total income
  - total expense
  - money left to spend (income - expense)
  - current net worth
    **AND** add route handler tests.
  - Deliverable: Summary data drives UI cards.

- [ ] **Step 6.3**: Implement dashboard time-series aggregations (spending over time, net worth over time) **AND** add tests for bucketing and date boundaries.
  - Deliverable: Stable time-series for charts.

- [ ] **Step 6.4**: Implement spend-by-category aggregation **AND** add tests.
  - Deliverable: Category breakdown for the selected time window.

- [ ] **Step 6.5**: Build desktop-first Dashboard page with Tailwind (summary cards + charts) **AND** add UI smoke test.
  - Deliverable: Dashboard shows meaningful charts even with small data.

---

## Phase 7 — Hardening & MVP Polish (You can ship)

Goal: improve reliability, usability, and portability for the planned future backend migration. UI foundation strong with Shadcn + sidebar.

### Execution Steps

- [ ] **Step 7.1**: Add consistent error handling + validation responses across Route Handlers **AND** add tests for error shapes.
  - Deliverable: Predictable API error contract.

- [ ] **Step 7.2**: Add basic logging for mutations (create/update/delete) **AND** add tests verifying logging calls (where feasible).
  - Deliverable: Minimal observability.

- [ ] **Step 7.3**: Add empty states, loading states, and desktop UX refinements (keyboard-friendly forms where possible) **AND** update UI smoke tests.
  - Deliverable: Usable MVP experience.

- [ ] **Step 7.4**: Add a minimal export/backup option (e.g., JSON export from API) **AND** add route handler test.
  - Deliverable: Safety net for SQLite file risk and user trust (optional but recommended).

---

## Notes / Decisions to Finalize Early

- **Time zone strategy**: derive local date bucketing consistently.
- **Amount representation**: store amounts as **integer rupiah (IDR)** to avoid floating issues.
- **Savings modeling**: keep optional for MVP unless you want a dedicated workflow; can be added after transactions/transfers.
- **Hosting (MVP)**: run locally only for now; deployment and persistence constraints can be revisited post-MVP.

---

## Definition of Done (MVP)

- CRUD for wallets and categories
- Record expenses/income/transfers
- Monthly budgets per category with actual vs remaining
- Dashboard shows:
  - total income, total expense
  - money left to spend (income - expense)
  - current net worth
  - basic trends + category breakdown
- Desktop-first UI styled with Tailwind
- API implemented only via Route Handlers
- Tests exist for all logic/data-access/route handlers, with basic UI smoke coverage

---
