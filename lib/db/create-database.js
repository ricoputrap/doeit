/**
 * Database Initialization Script
 *
 * This script creates and initializes the database file using sql.js.
 * It creates the database file with all tables and default seed data.
 */

const fs = require('fs');
const path = require('path');

// Import sql.js
const initSqlJs = require('sql.js');

async function createDatabase() {
  console.log('🚀 Creating Doeit database...');

  try {
    // Initialize SQL.js
    const SQL = await initSqlJs({
      locateFile: (file) => {
        return require.resolve(`sql.js/dist/${file}`);
      }
    });

    // Create new database
    const db = new SQL.Database();

    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    console.log('📋 Creating database schema...');

    // Create wallets table
    db.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(name, type)
      )
    `);

    // Create savings_buckets table
    db.run(`
      CREATE TABLE IF NOT EXISTS savings_buckets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create transactions table
    db.run(`
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
    `);

    // Create budgets table
    db.run(`
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
    `);

    // Create indexes
    console.log('📊 Creating database indexes...');
    db.run("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)");
    db.run("CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)");
    db.run("CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month)");
    db.run("CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id)");

    console.log('🌱 Seeding default categories...');

    // Seed default expense categories
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
        [name]
      );
    }

    for (const name of defaultIncomeCategories) {
      db.run(
        `INSERT OR IGNORE INTO categories (name, type, created_at, updated_at)
         VALUES (?, 'income', datetime('now'), datetime('now'))`,
        [name]
      );
    }

    // Save database to file
    const dbPath = path.join(__dirname, '../../doeit.db');
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('✅ Database created successfully!');
    console.log(`📍 Location: ${dbPath}`);
    console.log(`💾 Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Verify database
    const result = db.exec(`SELECT COUNT(*) as count FROM categories`);
    const categoryCount = result[0].values[0][0];
    console.log(`📊 Seeded ${categoryCount} categories`);

    // Close database
    db.close();

    return {
      success: true,
      path: dbPath,
      size: buffer.length,
      categories: categoryCount
    };

  } catch (error) {
    console.error('❌ Error creating database:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  createDatabase()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Database initialization complete!');
        process.exit(0);
      } else {
        console.error('\n💥 Database initialization failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createDatabase };
