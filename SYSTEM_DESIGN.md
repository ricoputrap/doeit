# Doeit — System Design (MVP)

## 1) Purpose & Scope

Doeit is a simple personal finance web application focused on recording and reviewing financial activity. This document describes the MVP system design at a practical level so you can later derive an implementation plan.

### MVP Goals

- Capture day-to-day financial activity in a lightweight workflow.
- Provide basic insights and summaries (dashboard-level).
- Keep architecture simple and maintainable for early iteration.
- Use a backend boundary that can be migrated to a separate service (e.g., NestJS/FastAPI) after MVP.

### UX Target (MVP)

- **Desktop-first UI**: optimize layouts and workflows for desktop usage first.
- Mobile responsiveness is a post-MVP enhancement.

### Currency Support (MVP)

- **Single currency only: IDR (Rupiah)**.
- All amounts are stored and displayed in IDR; no FX, no currency field required in the MVP data model.

### Out of Scope (MVP)

- User authentication / multi-tenant accounts.
- Bank integrations, automatic imports, and reconciliation.
- Advanced reporting, forecasting, collaboration, and audit controls.
- Multi-currency support.

---

## 2) Key Features (MVP)

- Record transactions:
  - Expense
  - Income
  - Savings contribution/withdrawal (if modeled distinctly)
  - Transfer between wallets (two-sided movement)
- Manage reference data:
  - Wallets (cash, bank, e-wallet, etc.)
  - Categories (for income/expense classification)
  - Savings “buckets” (optional grouping for savings goals)
- Budgeting:
  - Monthly budgets per category
  - Budget vs actual tracking
- Dashboard:
  - Spending trends over time
  - Category breakdowns
  - Net worth trend and current net worth
  - Money left to spend (see “Aggregations & Reporting”)

---

## 3) Architecture Overview

### High-Level Architecture

- **Client**: Next.js UI (React)
- **Server (MVP)**: Next.js **Route Handlers only** (HTTP API)
  - No Server Components and no Server Actions in the MVP architecture.
  - Keep the API surface portable so it can be re-implemented later in NestJS or FastAPI with minimal UI changes.
- **Data**: SQLite persistent store
- **Deployment**: Hosted web platform (previously noted as Netlify; can also be Vercel or similar depending on constraints)

### Rationale

- Route Handlers provide a clean HTTP boundary that maps well to a future standalone backend service.
- SQLite offers a simple, file-based database suitable for prototyping and single-user usage.

---

## 4) Logical Components

### 4.1 UI (Presentation Layer)

Primary responsibilities:

- Desktop-first layout for lists, forms, filters, and charts.
- Provide basic client-side validation and user feedback.
- Initiate reads/writes through HTTP requests to the API (Route Handlers).

Key screens:

- Dashboard (charts + summary cards)
- Transactions (list + create/edit)
- Wallets (CRUD)
- Categories (CRUD)
- Budgets (CRUD + month selector)
- Savings (CRUD + transactions view if applicable)

### 4.2 Application Layer (Domain & Use Cases)

Responsibilities:

- Enforce business rules (e.g., transfer creates balanced movement).
- Convert UI inputs into normalized domain commands.
- Produce view models and aggregated metrics for the dashboard.

Examples of business rules:

- Transfers must always move value from one wallet to another with the same amount.
- Transactions must have a date and amount; type determines which fields are required (e.g., category required for expenses).
- Budget comparisons should be based on month boundaries and category selection rules.

### 4.3 Data Access Layer

Responsibilities:

- Encapsulate database operations (CRUD + aggregates).
- Provide transactional integrity for multi-step writes (especially transfers).
- Keep queries predictable and testable.

---

## 5) Data Model (Conceptual)

This section describes the conceptual model; physical schema and indexes can be decided during implementation.

### Naming Conventions (MVP)

- Use **snake_case** for database tables and columns.
- Use a consistent convention for timestamps:
  - `created_at`, `updated_at`
- Use `*_id` for foreign keys (e.g., `wallet_id`, `category_id`).

### 5.1 Core Entities

**Wallet**

- Purpose: Source/destination of funds; contributes to net worth.
- Key fields (snake_case):
  - `id`
  - `name`
  - `created_at`, `updated_at`

**Category**

- Purpose: Classification for expense/income.
- Key fields (snake_case):
  - `id`
  - `name`
  - `type` (expense|income)
  - `created_at`, `updated_at`

**Transaction**

- Purpose: Atomic record for money movement (amounts are always IDR).
- Recommended approach: store a normalized transaction record with a `type` field.
- Key fields (snake_case):
  - `id`
  - `type` (expense|income|transfer|savings)
  - `amount` (positive numeric; meaning is interpreted by type; IDR)
  - `date` (date/time)
  - `note` (optional)
  - `wallet_id` (for expense/income; may vary for transfer depending on modeling)
  - `category_id` (required for expense; optional/allowed for income depending on product choice)
  - `created_at`, `updated_at`

**Transfer**

- Purpose: Model money movement between wallets (IDR).
- Two common modeling options:
  1. A distinct transfer record and two linked ledger entries.
  2. Two `transaction` rows linked by a `transfer_id`/correlation id (one outflow, one inflow).
- For correctness and reporting, prefer “two linked entries” to preserve wallet balances.

**Budget**

- Purpose: Monthly limit for a category (IDR).
- Key fields (snake_case):
  - `id`
  - `month` (e.g., YYYY-MM-01 canonical month key)
  - `category_id`
  - `limit_amount` (IDR)
  - `created_at`, `updated_at`

**Savings Bucket** (optional in MVP)

- Purpose: Group savings goals (e.g., “Emergency Fund”).
- Key fields (snake_case):
  - `id`
  - `name`
  - `created_at`, `updated_at`
- Savings activity can be modeled either as:
  - transactions with `type=savings` and optional `savings_bucket_id`, or
  - transfers to/from a dedicated wallet representing savings.

### 5.2 Derived Concepts

**Wallet Balance**

- Derived from transaction ledger, not stored as a fixed value in MVP (to avoid drift).
- If performance becomes an issue later, introduce cached balances with reconciliation.

**Net Worth**

- Sum of balances across all wallets (and possibly savings buckets if separate).

---

## 6) Data Flows

### 6.1 Create Expense/Income

1. User submits form (amount, date, wallet, category, note).
2. API validates inputs and business rules.
3. Persist transaction.
4. UI refreshes relevant lists and summary widgets.

### 6.2 Create Transfer

1. User selects source wallet, destination wallet, amount, date, note.
2. API validates:
   - wallets exist and are not identical
   - amount > 0
3. API performs a single atomic write that creates:
   - an outflow entry against the source wallet
   - an inflow entry against the destination wallet
   - a link between both entries (transfer id/correlation id)
4. Wallet balances and dashboard figures update.

### 6.3 Monthly Budget Tracking

1. User defines a budget for (month, category).
2. Dashboard computes:
   - actual spent in that category during the month
   - remaining (limit - actual)
3. Display progress indicators.

---

## 7) API / Server Interface (Conceptual)

Implementation uses:

- **Route Handlers** under an API namespace for CRUD and chart data.

Core operations needed:

- Wallets: list/create/update/delete
- Categories: list/create/update/delete
- Transactions: list (with filters), create, update, delete
- Transfers: create (and possibly delete by correlation id)
- Budgets: list by month, upsert (month+category), delete
- Dashboard: summary endpoint(s) for aggregates (net worth, spending over time, category totals)

Design constraints:

- Keep payloads small and stable.
- Prefer server-side aggregation for charts to avoid transferring raw ledgers unnecessarily.
- Keep endpoints and contracts structured so they can be ported to NestJS/FastAPI later without changing the UI substantially.

---

## 8) Aggregations & Reporting (MVP)

Minimum dashboard metrics (all IDR):

- Total income (selected period)
- Total expense (selected period)
- Money left to spend (selected period)
  - Defined as: income - expense
  - Note: this is a cashflow metric for the selected period (not the same as net worth).
- Current net worth
- Time-series: net worth over time (daily/weekly/monthly buckets)
- Time-series: spending over time
- Breakdown: spend by category (pie/bar)

Aggregation rules:

- Define a canonical time zone strategy (e.g., store UTC timestamps; bucket by local date consistently).
- Use inclusive-exclusive month boundaries for monthly reports.

---

## 9) Non-Functional Requirements

### Performance

- MVP targets small datasets (single user).
- Queries should be indexed by:
  - transaction date
  - wallet id
  - category id
  - transfer correlation id (if modeled)

### Reliability & Consistency

- Transfers must be written atomically.
- Prefer database transactions for multi-row writes.

### Security (MVP Baseline)

- No authentication; assume single-user, trusted environment.
- Still apply basic protections:
  - Input validation and server-side constraints
  - Avoid exposing internal errors directly to UI
  - Use environment variables for configuration (e.g., database path)

### Observability

- Basic structured logging for mutations and failures.
- Add simple error boundaries / error pages for the UI.

---

## 10) Deployment & Operations

### Build/Runtime

- Next.js builds and serves both UI and API route handlers.
- SQLite requires persistent storage; deployment must support a writable, persistent filesystem or a managed alternative.

### Notes on Hosting with SQLite

- Some serverless environments have ephemeral filesystems; SQLite persistence may be unreliable there.
- If the chosen host cannot guarantee persistence, consider:
  - A managed SQL database (later iteration), or
  - A hosting option with persistent disk for the MVP.

---

## 11) Key Design Decisions & Tradeoffs

- **HTTP API boundary via Route Handlers**: slightly more boilerplate than server actions, but makes future migration to NestJS/FastAPI straightforward.
- **SQLite**: minimal operational overhead; limited scalability and hosting constraints.
- **No auth**: speeds MVP delivery; mandates careful positioning as a single-user tool until auth is added.
- **IDR-only**: simplifies storage and reporting; multi-currency is deferred.

---

## 12) Future Extensions (Post-MVP)

- Authentication and multi-user tenancy (row-level isolation).
- Mobile-first/responsive UI refinements.
- Multi-currency support with FX rates.
- Recurring transactions and reminders.
- Import/export (CSV), backups, and restore.
- Advanced analytics (cashflow forecasting, anomaly detection).
- Audit logs and stronger integrity constraints.
