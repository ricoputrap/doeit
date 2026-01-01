# Plan: Doeit MVP (Desktop-first, IDR-only) — Phased Implementation Plan

This plan implements the MVP described in `SYSTEM_DESIGN.md` using:

- Next.js UI (React) + **Route Handlers (HTTP API) only**
- SQLite persistence (using sql.js for cross-platform compatibility)
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
- `lib/`
  - `db/` ✅ (Database layer)
    - `index.ts` ✅ (Database connection singleton with sql.js)
    - `types.ts` ✅ (TypeScript types for all entities)
    - `schema.ts` ✅ (Schema initialization and seeding)
    - `init.ts` ✅ (Database initialization utilities)
    - `repositories/` ✅ (Data access layer)
      - `index.ts` ✅ (Exports all repository functions)
      - `wallets.ts` ✅ (Wallet CRUD + balance calculations)
      - `categories.ts` ✅ (Category CRUD + spending queries)
      - `savings-buckets.ts` ✅ (Savings bucket CRUD)
      - `transactions.ts` ✅ (Transaction CRUD + transfers + aggregations)
      - `budgets.ts` ✅ (Budget CRUD + budget vs actual tracking)
    - `__tests__/` ✅ (Repository tests)
      - `wallets.test.ts` ✅ (22 tests)
      - `categories.test.ts` ✅ (31 tests)
      - `transactions.test.ts` ✅ (40 tests)
      - `budgets.test.ts` ✅ (36 tests)

If you prefer a `src/` root, mirror the same module approach under `src/` and import from there. The key is to avoid dumping feature-specific helpers into global folders.

---

## Testing Strategy (MVP)

- **Unit tests**: pure helpers (formatters, validation, query builders) live next to code.
- **Integration tests**: DB/data-access functions (SQLite) with a temporary test DB.
- **Route handler tests**: call handler functions with mocked Requests, or test through Next's fetch layer if configured.
- **UI smoke tests** (minimal): render key pages/components and validate basic structure/empty states.

Tooling choice for tests should match the existing stack, but the plan assumes a typical TypeScript test runner is added/configured if missing.

**Current Test Status**: 153 tests passing (6 test files)

---

## Phase 0 — Foundations (You can see a running shell) ✅ COMPLETED

Goal: establish project conventions, Shadcn UI + Sidebar desktop layout baseline, and a "health" API to validate the HTTP boundary.

### Execution Steps

- [x] **Step 0.1**: Implement Shadcn UI components and create desktop-first layout with sidebar navigation **AND** add UI smoke tests.
  - Deliverable: ✅ COMPLETED - App renders with sidebar navigation (Dashboard / Transactions / Wallets / Categories / Budgets) using Shadcn UI components. All pages styled consistently.

- [x] **Step 0.2**: Add `GET /api/health` Route Handler **AND** add a route handler test.
  - Deliverable: ✅ COMPLETED - Health endpoint implemented and tested. API boundary established.
  - Status: ✅ COMPLETED - Created health endpoint at `app/api/health/route.ts` with test at `app/api/health/route.test.ts`.

---

## Phase 1 — Database Layer (You can see seed data in UI placeholders) ✅ COMPLETED

Goal: add SQLite data layer with snake_case schema, minimal migrations/initialization, and safe access patterns. UI is ready with Shadcn components and sidebar.

### Execution Steps

- [x] **Step 1.1**: Implement DB bootstrap (connection + migration runner) in a dedicated DB module **AND** add integration tests that create a test DB and verify schema exists.
  - Deliverable: ✅ COMPLETED - Database module at `lib/db/index.ts` using sql.js for cross-platform SQLite support. Schema initialization in `lib/db/schema.ts`. Async initialization with `initializeDatabase()`.

- [x] **Step 1.2**: Define schema for all entities (snake_case columns) **AND** test schema constraints.
  - Deliverable: ✅ COMPLETED - 5 tables created:
    - `wallets` (id, name, created_at, updated_at)
    - `categories` (id, name, type, created_at, updated_at) with type constraint
    - `savings_buckets` (id, name, created_at, updated_at)
    - `transactions` (id, type, amount, date, note, wallet_id, category_id, transfer_id, savings_bucket_id, created_at, updated_at)
    - `budgets` (id, month, category_id, limit_amount, created_at, updated_at)
  - Foreign key constraints and indexes implemented.

- [x] **Step 1.3**: Add seed utilities for local dev **AND** test that seed inserts expected rows.
  - Deliverable: ✅ COMPLETED - `seedDefaultCategories()` function creates 8 expense categories and 5 income categories.

- [x] **Step 1.4**: Implement complete data access layer (repositories) for all entities **AND** add comprehensive tests.
  - Deliverable: ✅ COMPLETED - Full CRUD operations for:
    - **Wallets**: list, getById, getByName, create, update, delete, balance calculations, getAllWithBalances
    - **Categories**: list, getByType, getById, getByNameAndType, create, update, delete, getCategoriesWithSpent
    - **Savings Buckets**: list, getById, getByName, create, update, delete, balance tracking
    - **Transactions**: list with filters, getById, create, update, delete, createTransfer (atomic), getTotalIncome, getTotalExpenses, getSpendingByCategory, getNetWorth
    - **Budgets**: list with filters, getById, getByMonthAndCategory, create, upsert, update, delete, getBudgetsWithActual, copyBudgetsToMonth
  - **129 tests** covering all repository functions.

### Technical Notes (Phase 1):

- Used `sql.js` instead of `better-sqlite3` for better cross-platform compatibility (no native compilation required)
- All amounts stored as integers (IDR) to avoid floating-point issues
- Transfers are atomic: two linked transactions with shared `transfer_id`
- Wallet balances are derived from transactions (not stored)
- Budget vs actual tracking includes remaining calculation

---

## Phase 2 — API Route Handlers (CRUD endpoints for all entities)

Goal: implement HTTP API endpoints for all entities using Next.js Route Handlers.

### Execution Steps

- [ ] **Step 2.1**: Implement Wallets Route Handlers (`/api/wallets`, `/api/wallets/:id`) **AND** add route handler tests.
  - Deliverable: Wallet CRUD over HTTP (GET list, GET by id, POST create, PUT update, DELETE).

- [ ] **Step 2.2**: Implement Categories Route Handlers (`/api/categories`, `/api/categories/:id`) **AND** add route handler tests.
  - Deliverable: Category CRUD over HTTP.

- [ ] **Step 2.3**: Implement Transactions Route Handlers (`/api/transactions`, `/api/transactions/:id`) **AND** add route handler tests.
  - Deliverable: Transaction CRUD over HTTP with filter support (type, wallet, category, date range).

- [ ] **Step 2.4**: Implement Transfers Route Handler (`/api/transfers`) **AND** add route handler tests.
  - Deliverable: Transfer creation via HTTP (atomic two-sided movement).

- [ ] **Step 2.5**: Implement Budgets Route Handlers (`/api/budgets`) **AND** add route handler tests.
  - Deliverable: Budget CRUD over HTTP with upsert support.

- [ ] **Step 2.6**: Implement Dashboard Route Handlers **AND** add route handler tests.
  - `/api/dashboard/summary` - total income, expense, net worth, money left to spend
  - `/api/dashboard/spending-by-category` - category breakdown
  - Deliverable: Dashboard aggregation data via HTTP.

---

## Phase 3 — Wire Up UI Pages (You can CRUD all data)

Goal: connect the existing UI pages to the API endpoints.

### Execution Steps

- [ ] **Step 3.1**: Build Wallets page functionality (table + create/edit modal) using the API **AND** add UI tests.
  - Deliverable: You can manage wallets in the UI.

- [ ] **Step 3.2**: Build Categories page functionality (table + create/edit modal) using the API **AND** add UI tests.
  - Deliverable: You can manage categories in the UI.

- [ ] **Step 3.3**: Build Transactions page functionality (filter bar + table + create form) using the API **AND** add UI tests.
  - Deliverable: You can add expenses/income and see them listed.

- [ ] **Step 3.4**: Add Transfer creation flow to Transactions page **AND** add UI tests.
  - Deliverable: Users can initiate transfers from the UI.

- [ ] **Step 3.5**: Build Budgets page functionality (month selector + table with limit/actual/remaining) using the API **AND** add UI tests.
  - Deliverable: You can set budgets and see progress.

- [ ] **Step 3.6**: Build Dashboard page with summary cards and charts using the API **AND** add UI tests.
  - Deliverable: Dashboard shows meaningful insights.

---

## Phase 4 — Hardening & MVP Polish (You can ship)

Goal: improve reliability, usability, and portability for the planned future backend migration.

### Execution Steps

- [ ] **Step 4.1**: Add consistent error handling + validation responses across Route Handlers **AND** add tests for error shapes.
  - Deliverable: Predictable API error contract.

- [ ] **Step 4.2**: Add basic logging for mutations (create/update/delete) **AND** add tests verifying logging calls.
  - Deliverable: Minimal observability.

- [ ] **Step 4.3**: Add empty states, loading states, and desktop UX refinements **AND** update UI tests.
  - Deliverable: Usable MVP experience.

- [ ] **Step 4.4**: Add a minimal export/backup option (e.g., JSON export from API) **AND** add route handler test.
  - Deliverable: Safety net for SQLite file risk and user trust.

---

## Notes / Decisions Finalized

- **Database**: Using `sql.js` (pure JavaScript SQLite) for cross-platform compatibility
- **Amount representation**: Store amounts as **integer rupiah (IDR)** to avoid floating issues
- **Transfer modeling**: Two linked transactions with shared `transfer_id` (atomic creation)
- **Balance calculation**: Derived from transaction ledger (not stored as fixed value)
- **Time zone strategy**: Store ISO 8601 strings, bucket by date for monthly reports
- **Savings modeling**: Optional in MVP, savings_buckets table ready for future use

---

## Definition of Done (MVP)

- [x] Database layer with all entities
- [x] Data access layer (repositories) with full CRUD
- [x] Comprehensive test coverage (153 tests passing)
- [ ] CRUD API endpoints for wallets and categories
- [ ] Record expenses/income/transfers via API
- [ ] Monthly budgets per category with actual vs remaining
- [ ] Dashboard API shows:
  - total income, total expense
  - money left to spend (income - expense)
  - current net worth
  - category breakdown
- [ ] Desktop-first UI connected to API
- [ ] API implemented only via Route Handlers
- [ ] Tests exist for all logic/data-access/route handlers

---

## Progress Summary

| Phase                        | Status         | Tests     |
| ---------------------------- | -------------- | --------- |
| Phase 0 - Foundations        | ✅ Complete    | 24 tests  |
| Phase 1 - Database Layer     | ✅ Complete    | 129 tests |
| Phase 2 - API Route Handlers | 🔲 Not Started | -         |
| Phase 3 - Wire Up UI         | 🔲 Not Started | -         |
| Phase 4 - Hardening          | 🔲 Not Started | -         |

**Total Tests**: 153 passing
