# Plan: Migrate from sql.js to Drizzle ORM with SQLite

This plan migrates the existing sql.js implementation to **Drizzle ORM** with **better-sqlite3** (local SQLite), maintaining all existing functionality while improving developer experience, type safety, and query building.

**Key Benefits:**
- Type-safe queries with TypeScript inference
- Better IDE autocomplete and refactoring support
- Simplified schema management with Drizzle Kit
- Migration system for schema evolution
- Better performance (better-sqlite3 is faster than sql.js)
- No WASM file issues (native SQLite binding)

**Migration Strategy:**
- Incremental migration to minimize risk
- Keep existing tests as acceptance criteria
- Maintain backward compatibility during transition
- All 174+ tests must continue passing

---

## Module Structure Check

- [ ] Confirmed Drizzle ORM schema files are colocated in `lib/db/schema/`
- [ ] Confirmed migration files are in `lib/db/migrations/`
- [ ] Confirmed Drizzle config is at project root (`drizzle.config.ts`)
- [ ] Confirmed types are properly exported from schema files
- [ ] Confirmed every logic change has corresponding test updates
- [ ] Confirmed all existing tests are updated to use Drizzle
- [ ] Confirmed repository layer abstraction remains intact (API unchanged)

---

## Current vs Target Architecture

### Current (sql.js):
```
lib/db/
├── index.ts              # Database singleton with sql.js
├── schema.ts             # Raw SQL CREATE TABLE statements
├── init.ts               # Database initialization
├── types.ts              # TypeScript interfaces
└── repositories/         # Data access layer with raw SQL
    ├── wallets.ts
    ├── categories.ts
    ├── transactions.ts
    ├── budgets.ts
    └── savings-buckets.ts
```

### Target (Drizzle ORM):
```
lib/db/
├── index.ts              # Database singleton with better-sqlite3
├── drizzle.ts            # Drizzle instance
├── schema/               # Drizzle schema definitions
│   ├── index.ts          # Export all schemas
│   ├── wallets.ts        # Wallets table schema
│   ├── categories.ts     # Categories table schema
│   ├── transactions.ts   # Transactions table schema
│   ├── budgets.ts        # Budgets table schema
│   └── savings-buckets.ts# Savings buckets table schema
├── migrations/           # Generated migrations (via Drizzle Kit)
│   ├── 0000_initial.sql
│   └── meta/
├── init.ts               # Database initialization with migrations
└── repositories/         # Updated data access layer using Drizzle
    ├── wallets.ts        # Uses Drizzle query builder
    ├── categories.ts     # Uses Drizzle query builder
    ├── transactions.ts   # Uses Drizzle query builder
    ├── budgets.ts        # Uses Drizzle query builder
    └── savings-buckets.ts# Uses Drizzle query builder
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "drizzle-orm": "^0.36.4",
    "better-sqlite3": "^11.7.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.2",
    "@types/better-sqlite3": "^7.6.11"
  }
}
```

---

## Phase 0 — Setup Drizzle Infrastructure

Goal: Install dependencies, configure Drizzle Kit, and set up the foundation without breaking existing code.

### Execution Steps

- [ ] **Step 0.1**: Install Drizzle ORM dependencies **AND** verify installation.
  - Run: `pnpm add drizzle-orm better-sqlite3`
  - Run: `pnpm add -D drizzle-kit @types/better-sqlite3`
  - Deliverable: Dependencies installed, package.json updated.

- [ ] **Step 0.2**: Create Drizzle configuration file at project root **AND** add to .gitignore if needed.
  - File: `drizzle.config.ts`
  - Configure for better-sqlite3 with local file
  - Set migrations folder to `lib/db/migrations`
  - Deliverable: Drizzle Kit can read config.

- [ ] **Step 0.3**: Add Drizzle scripts to package.json **AND** document usage.
  - Add: `"db:generate": "drizzle-kit generate"`
  - Add: `"db:migrate": "drizzle-kit migrate"`
  - Add: `"db:studio": "drizzle-kit studio"`
  - Add: `"db:push": "drizzle-kit push"`
  - Deliverable: Scripts available for database operations.

---

## Phase 1 — Define Drizzle Schemas

Goal: Convert raw SQL schemas to Drizzle schema definitions with proper TypeScript types.

### Execution Steps

- [ ] **Step 1.1**: Create schema directory structure **AND** set up exports.
  - Create: `lib/db/schema/index.ts` (main export file)
  - Deliverable: Schema module structure ready.

- [ ] **Step 1.2**: Define wallets schema **AND** verify type inference.
  - File: `lib/db/schema/wallets.ts`
  - Define: `walletsTable` with all columns (id, name, created_at, updated_at)
  - Export: TypeScript types (`Wallet`, `NewWallet`)
  - Deliverable: Wallets schema with type-safe definitions.

- [ ] **Step 1.3**: Define categories schema **AND** verify type inference.
  - File: `lib/db/schema/categories.ts`
  - Define: `categoriesTable` with type enum constraint
  - Add unique constraint on (name, type)
  - Export: TypeScript types (`Category`, `NewCategory`)
  - Deliverable: Categories schema with type-safe definitions.

- [ ] **Step 1.4**: Define savings buckets schema **AND** verify type inference.
  - File: `lib/db/schema/savings-buckets.ts`
  - Define: `savingsBucketsTable` with all columns
  - Export: TypeScript types (`SavingsBucket`, `NewSavingsBucket`)
  - Deliverable: Savings buckets schema with type-safe definitions.

- [ ] **Step 1.5**: Define transactions schema **AND** verify type inference.
  - File: `lib/db/schema/transactions.ts`
  - Define: `transactionsTable` with foreign keys
  - Add type enum constraint ('expense', 'income', 'transfer', 'savings')
  - Add indexes for date, wallet_id, category_id, type, transfer_id
  - Export: TypeScript types (`Transaction`, `NewTransaction`)
  - Deliverable: Transactions schema with type-safe definitions and relations.

- [ ] **Step 1.6**: Define budgets schema **AND** verify type inference.
  - File: `lib/db/schema/budgets.ts`
  - Define: `budgetsTable` with foreign key to categories
  - Add unique constraint on (month, category_id)
  - Add indexes for month and category_id
  - Export: TypeScript types (`Budget`, `NewBudget`)
  - Deliverable: Budgets schema with type-safe definitions.

- [ ] **Step 1.7**: Export all schemas from index **AND** verify imports work.
  - File: `lib/db/schema/index.ts`
  - Export all table schemas and types
  - Deliverable: Centralized schema exports.

---

## Phase 2 — Generate Initial Migration

Goal: Create initial migration from Drizzle schemas and verify it matches existing schema.

### Execution Steps

- [ ] **Step 2.1**: Generate initial migration **AND** review SQL output.
  - Run: `pnpm db:generate`
  - Review: `lib/db/migrations/0000_initial.sql`
  - Verify: SQL matches existing schema (tables, constraints, indexes)
  - Deliverable: Initial migration file generated.

- [ ] **Step 2.2**: Create seed data utilities **AND** add tests.
  - File: `lib/db/seed.ts`
  - Function: `seedDefaultCategories()` using Drizzle insert
  - Test: Verify default categories are inserted
  - Deliverable: Seed utilities with Drizzle ORM.

---

## Phase 3 — Create New Database Connection Layer

Goal: Replace sql.js connection with better-sqlite3 + Drizzle, keeping parallel implementation initially.

### Execution Steps

- [ ] **Step 3.1**: Create Drizzle database instance **AND** add connection tests.
  - File: `lib/db/drizzle.ts`
  - Setup: better-sqlite3 connection
  - Setup: Drizzle instance with schema
  - Export: `db` (Drizzle instance), `sqlite` (raw connection)
  - Test: Connection opens and closes successfully
  - Deliverable: Drizzle-based database connection.

- [ ] **Step 3.2**: Update database initialization **AND** add migration runner.
  - File: `lib/db/init.ts`
  - Add: `runMigrations()` function using Drizzle Kit
  - Update: `initDatabase()` to use Drizzle migrations
  - Keep: Backward compatible initialization
  - Test: Database initializes with proper schema
  - Deliverable: Migration-based initialization.

- [ ] **Step 3.3**: Update main database index **AND** maintain singleton pattern.
  - File: `lib/db/index.ts`
  - Update: Use better-sqlite3 instead of sql.js
  - Keep: Same public API (getDatabase, closeDatabase, etc.)
  - Export: Drizzle instance for repositories
  - Test: Singleton pattern works correctly
  - Deliverable: Updated database module with Drizzle.

---

## Phase 4 — Migrate Repositories (One by One)

Goal: Convert each repository from raw SQL to Drizzle queries, ensuring tests pass.

### Execution Steps

- [ ] **Step 4.1**: Migrate wallets repository **AND** ensure all 22 tests pass.
  - File: `lib/db/repositories/wallets.ts`
  - Convert: All functions to use Drizzle query builder
  - Functions: getAllWallets, getWalletById, getWalletByName, createWallet, updateWallet, deleteWallet, getWalletBalance, getAllWithBalances
  - Test: Run `pnpm test lib/db/__tests__/wallets.test.ts`
  - Update: Test file if needed for Drizzle setup
  - Deliverable: Wallets repository using Drizzle, all tests passing.

- [ ] **Step 4.2**: Migrate categories repository **AND** ensure all 31 tests pass.
  - File: `lib/db/repositories/categories.ts`
  - Convert: All functions to use Drizzle query builder
  - Functions: getAllCategories, getCategoriesByType, getCategoryById, getCategoryByNameAndType, createCategory, updateCategory, deleteCategory, getCategoriesWithSpent
  - Test: Run `pnpm test lib/db/__tests__/categories.test.ts`
  - Update: Test file if needed for Drizzle setup
  - Deliverable: Categories repository using Drizzle, all tests passing.

- [ ] **Step 4.3**: Migrate savings buckets repository **AND** ensure all tests pass.
  - File: `lib/db/repositories/savings-buckets.ts`
  - Convert: All functions to use Drizzle query builder
  - Functions: getAllSavingsBuckets, getSavingsBucketById, getSavingsBucketByName, createSavingsBucket, updateSavingsBucket, deleteSavingsBucket, getSavingsBucketBalance
  - Test: Run tests for savings buckets
  - Update: Test file if needed for Drizzle setup
  - Deliverable: Savings buckets repository using Drizzle, all tests passing.

- [ ] **Step 4.4**: Migrate transactions repository **AND** ensure all 40 tests pass.
  - File: `lib/db/repositories/transactions.ts`
  - Convert: All functions to use Drizzle query builder
  - Functions: getAllTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction, createTransfer, getTotalIncome, getTotalExpenses, getSpendingByCategory, getNetWorth, countTransactions
  - Test: Run `pnpm test lib/db/__tests__/transactions.test.ts`
  - Update: Test file if needed for Drizzle setup
  - Deliverable: Transactions repository using Drizzle, all tests passing.

- [ ] **Step 4.5**: Migrate budgets repository **AND** ensure all 36 tests pass.
  - File: `lib/db/repositories/budgets.ts`
  - Convert: All functions to use Drizzle query builder
  - Functions: getBudgets, getBudgetById, getBudgetByMonthAndCategory, createBudget, upsertBudget, updateBudget, deleteBudget, deleteBudgetByMonthAndCategory, getBudgetsWithActual, getBudgetWithActual, getTotalBudgetForMonth, getBudgetMonths, countBudgets, copyBudgetsToMonth
  - Test: Run `pnpm test lib/db/__tests__/budgets.test.ts`
  - Update: Test file if needed for Drizzle setup
  - Deliverable: Budgets repository using Drizzle, all tests passing.

---

## Phase 5 — Update Test Infrastructure

Goal: Ensure all tests use Drizzle for test database setup.

### Execution Steps

- [ ] **Step 5.1**: Create shared test utilities **AND** add helper functions.
  - File: `lib/db/__tests__/test-utils.ts`
  - Function: `createTestDatabase()` - creates in-memory SQLite with Drizzle
  - Function: `setupTestSchema()` - runs migrations on test DB
  - Function: `seedTestData()` - adds test data
  - Function: `cleanupTestDatabase()` - closes connections
  - Deliverable: Reusable test utilities.

- [ ] **Step 5.2**: Update all test files to use Drizzle **AND** verify tests pass.
  - Update: `budgets.test.ts`, `categories.test.ts`, `transactions.test.ts`, `wallets.test.ts`
  - Remove: sql.js imports and setup
  - Add: Drizzle test utilities
  - Test: Run full test suite `pnpm test`
  - Deliverable: All 174+ tests passing with Drizzle.

---

## Phase 6 — Remove sql.js Dependencies

Goal: Clean up old sql.js code and dependencies.

### Execution Steps

- [ ] **Step 6.1**: Remove sql.js dependencies **AND** update package.json.
  - Remove: `sql.js` from dependencies
  - Remove: `@types/sql.js` from devDependencies
  - Run: `pnpm install`
  - Deliverable: sql.js fully removed.

- [ ] **Step 6.2**: Delete old schema file **AND** verify no references remain.
  - Delete: `lib/db/schema.ts` (old raw SQL schema)
  - Search: Verify no imports of old schema file
  - Deliverable: Old schema code removed.

- [ ] **Step 6.3**: Update documentation **AND** add Drizzle usage examples.
  - Update: README.md with Drizzle setup instructions
  - Update: SYSTEM_DESIGN.md to mention Drizzle ORM
  - Add: Comments in schema files with usage examples
  - Deliverable: Documentation reflects Drizzle implementation.

---

## Phase 7 — Verification & Testing

Goal: Comprehensive verification that everything works end-to-end.

### Execution Steps

- [ ] **Step 7.1**: Run full test suite **AND** verify all tests pass.
  - Run: `pnpm test`
  - Verify: All 174+ tests passing
  - Deliverable: Complete test coverage maintained.

- [ ] **Step 7.2**: Test API endpoints manually **AND** verify CRUD operations.
  - Start: `pnpm dev`
  - Test: GET /api/wallets, POST /api/wallets, etc.
  - Test: Dashboard endpoint with aggregations
  - Test: Transfer creation (atomic operation)
  - Deliverable: All API endpoints work correctly.

- [ ] **Step 7.3**: Test UI pages **AND** verify full user flows.
  - Test: Create wallet → Add transaction → View dashboard
  - Test: Create category → Set budget → Track spending
  - Test: Create transfer between wallets
  - Verify: All UI functionality works
  - Deliverable: Complete user flows validated.

- [ ] **Step 7.4**: Run Drizzle Studio **AND** inspect database.
  - Run: `pnpm db:studio`
  - Verify: All tables visible with proper schema
  - Verify: Relationships between tables correct
  - Verify: Sample data displays correctly
  - Deliverable: Database structure validated visually.

---

## Notes / Decisions

### Why Drizzle ORM?
- **Type Safety**: Full TypeScript inference from schema to queries
- **Performance**: better-sqlite3 is faster than sql.js WASM
- **Developer Experience**: Better autocomplete, refactoring, and error messages
- **Migration System**: Built-in schema evolution with Drizzle Kit
- **No Native Compilation Issues**: better-sqlite3 has prebuilt binaries for all platforms
- **Active Development**: Well-maintained with growing ecosystem

### Migration Risk Mitigation
- Incremental migration (one repository at a time)
- Tests act as acceptance criteria (must all pass)
- Repository layer abstraction prevents API changes
- Can rollback any step if issues arise
- Parallel implementation initially (sql.js and Drizzle coexist)

### Breaking Changes
- None to API layer (Route Handlers unchanged)
- None to UI layer (Pages unchanged)
- Only internal database layer changes
- All existing tests must pass

### Database File
- Location: `doeit.db` (same as before)
- Format: SQLite 3 (compatible with sql.js exports)
- Migrations: Applied automatically on startup
- Backup: Can use standard SQLite backup tools

---

## Definition of Done (Migration)

- [ ] All 5 Drizzle schemas defined and exported
- [ ] Initial migration generated and verified
- [ ] All 5 repositories migrated to Drizzle queries
- [ ] All 174+ tests passing with Drizzle
- [ ] sql.js dependencies removed
- [ ] Documentation updated
- [ ] API endpoints verified working
- [ ] UI pages verified working
- [ ] Drizzle Studio accessible
- [ ] No breaking changes to external API

---

## Rollback Plan

If migration needs to be rolled back:

1. **Git Revert**: Use git to revert commits
2. **Dependencies**: `pnpm install` to restore sql.js
3. **Tests**: Verify all tests pass on previous version
4. **Database**: Existing doeit.db file is compatible (SQLite format unchanged)

---

## Future Enhancements (Post-Migration)

Once Drizzle is stable:

- [ ] Add database schema versioning
- [ ] Implement query performance monitoring
- [ ] Add prepared statement caching
- [ ] Consider read replicas for analytics
- [ ] Add database connection pooling
- [ ] Implement soft deletes with Drizzle
- [ ] Add full-text search capabilities
- [ ] Create backup/restore commands

---

## Progress Tracking

| Phase                           | Status         | Tests    |
| ------------------------------- | -------------- | -------- |
| Phase 0 - Setup Infrastructure  | 🔲 Not Started | -        |
| Phase 1 - Define Schemas        | 🔲 Not Started | -        |
| Phase 2 - Generate Migration    | 🔲 Not Started | -        |
| Phase 3 - New Connection Layer  | 🔲 Not Started | -        |
| Phase 4 - Migrate Repositories  | 🔲 Not Started | 174+     |
| Phase 5 - Update Test Infra     | 🔲 Not Started | 174+     |
| Phase 6 - Remove sql.js         | 🔲 Not Started | -        |
| Phase 7 - Verification          | 🔲 Not Started | All pass |

**Current Status**: Ready to begin Phase 0

---

## Commands Reference

```bash
# Install dependencies
pnpm add drizzle-orm better-sqlite3
pnpm add -D drizzle-kit @types/better-sqlite3

# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Run tests
pnpm test                              # All tests
pnpm test lib/db/__tests__/wallets     # Specific test file

# Development
pnpm dev                               # Start Next.js dev server
```
