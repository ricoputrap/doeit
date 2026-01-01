import { getDatabase, saveDatabase } from "./index";

/**
 * SQL statements to create the database schema
 * All tables use snake_case naming convention
 */

const CREATE_WALLETS_TABLE = `
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

const CREATE_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(name, type)
  )
`;

const CREATE_SAVINGS_BUCKETS_TABLE = `
  CREATE TABLE IF NOT EXISTS savings_buckets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer', 'savings')),
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    wallet_id INTEGER NOT NULL,
    category_id INTEGER,
    transfer_id TEXT,
    savings_bucket_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (savings_bucket_id) REFERENCES savings_buckets(id) ON DELETE RESTRICT
  )
`;

const CREATE_BUDGETS_TABLE = `
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    limit_amount INTEGER NOT NULL CHECK (limit_amount >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(month, category_id)
  )
`;

// Indexes for common query patterns
const CREATE_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)",
  "CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id)",
  "CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month)",
  "CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id)",
];

/**
 * Initialize the database schema
 * Creates all tables and indexes if they don't exist
 */
export function initializeSchema(): void {
  const db = getDatabase();

  // Run all CREATE TABLE statements
  db.run(CREATE_WALLETS_TABLE);
  db.run(CREATE_CATEGORIES_TABLE);
  db.run(CREATE_SAVINGS_BUCKETS_TABLE);
  db.run(CREATE_TRANSACTIONS_TABLE);
  db.run(CREATE_BUDGETS_TABLE);

  // Create indexes
  for (const indexSql of CREATE_INDEXES) {
    db.run(indexSql);
  }

  saveDatabase();
}

/**
 * Drop all tables (useful for testing)
 * WARNING: This will delete all data!
 */
export function dropAllTables(): void {
  const db = getDatabase();

  // Drop in reverse order of dependencies
  db.run("DROP TABLE IF EXISTS budgets");
  db.run("DROP TABLE IF EXISTS transactions");
  db.run("DROP TABLE IF EXISTS savings_buckets");
  db.run("DROP TABLE IF EXISTS categories");
  db.run("DROP TABLE IF EXISTS wallets");

  saveDatabase();
}

/**
 * Reset the database (drop and recreate all tables)
 * WARNING: This will delete all data!
 */
export function resetDatabase(): void {
  dropAllTables();
  initializeSchema();
}

/**
 * Seed the database with default categories
 * Call this after initializing schema for a fresh database
 */
export function seedDefaultCategories(): void {
  const db = getDatabase();

  const defaultExpenseCategories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Bills & Utilities",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other Expense",
  ];

  const defaultIncomeCategories = [
    "Salary",
    "Freelance",
    "Investment",
    "Gift",
    "Other Income",
  ];

  for (const name of defaultExpenseCategories) {
    db.run(
      `INSERT OR IGNORE INTO categories (name, type, created_at, updated_at)
       VALUES (?, 'expense', datetime('now'), datetime('now'))`,
      [name],
    );
  }

  for (const name of defaultIncomeCategories) {
    db.run(
      `INSERT OR IGNORE INTO categories (name, type, created_at, updated_at)
       VALUES (?, 'income', datetime('now'), datetime('now'))`,
      [name],
    );
  }

  saveDatabase();
}

/**
 * Check if the database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  const db = getDatabase();

  const result = db.exec(`
    SELECT COUNT(*) as count FROM sqlite_master
    WHERE type='table' AND name='wallets'
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return false;
  }

  return (result[0].values[0][0] as number) > 0;
}
