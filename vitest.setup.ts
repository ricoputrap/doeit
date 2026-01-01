/// <reference types="vitest" />
import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

/**
 * Test Database Setup Utilities
 * Provides utilities for setting up in-memory databases for testing
 */

// Import better-sqlite3 for test database setup
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

/**
 * Create a fresh in-memory database for testing
 * Returns both the SQLite instance and Drizzle instance
 */
export function createTestDatabase() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite);

  // Enable foreign keys for tests
  sqlite.exec("PRAGMA foreign_keys = ON");

  return { sqlite, db };
}

/**
 * Create all necessary tables for testing
 * This should be called after createTestDatabase()
 */
export function createTestTables(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name, type)
    )
  `);

  sqlite.exec(`
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
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    )
  `);

  sqlite.exec(`
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

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS savings_buckets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Seed basic test data
 * Creates a test wallet and some basic categories
 */
export function seedTestData(db: any) {
  const { sqlite } = db;

  // Create test wallet
  sqlite.exec(`
    INSERT INTO wallets (name, created_at, updated_at)
    VALUES ('Test Wallet', datetime('now'), datetime('now'))
  `);

  // Create test categories
  const categories = [
    { name: "Food & Dining", type: "expense" },
    { name: "Transportation", type: "expense" },
    { name: "Shopping", type: "expense" },
    { name: "Bills & Utilities", type: "expense" },
    { name: "Entertainment", type: "expense" },
    { name: "Healthcare", type: "expense" },
    { name: "Education", type: "expense" },
    { name: "Other Expense", type: "expense" },
    { name: "Salary", type: "income" },
    { name: "Freelance", type: "income" },
    { name: "Investment", type: "income" },
    { name: "Gift", type: "income" },
    { name: "Other Income", type: "income" },
  ];

  for (const category of categories) {
    sqlite.exec(`
      INSERT INTO categories (name, type, created_at, updated_at)
      VALUES ('${category.name}', '${category.type}', datetime('now'), datetime('now'))
    `);
  }
}

/**
 * Complete test database setup
 * Returns a fully configured database with test data
 */
export function setupCompleteTestDatabase() {
  const { sqlite, db } = createTestDatabase();
  createTestTables(sqlite);
  seedTestData(db);

  return { sqlite, db };
}

/**
 * Clean up test database
 * Should be called in afterEach or afterAll hooks
 */
export function cleanupTestDatabase(sqlite: Database) {
  if (sqlite) {
    sqlite.close();
  }
}

/**
 * Mock helpers for testing
 */

// Mock drizzle module for repository tests
export function mockDrizzleModule(testDb: any) {
  vi.mock("../lib/db/drizzle", () => ({
    db: testDb,
  }));

  vi.mock("../lib/db/index", () => ({
    db: testDb,
    getDatabase: () => testDb,
    closeDatabase: () => {},
    saveDatabase: () => {},
  }));
}

/**
 * Date helpers for testing
 */

// Mock current date for consistent testing
export function mockCurrentDate(dateString: string) {
  const mockDate = new Date(dateString);
  vi.setSystemTime(mockDate);
}

// Reset date mocking
export function resetDateMock() {
  vi.useRealTimers();
}

/**
 * Database assertion helpers
 */

// Check if table exists
export function tableExists(sqlite: Database, tableName: string): boolean {
  const result = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(tableName);
  return !!result;
}

// Check if foreign keys are enabled
export function foreignKeysEnabled(sqlite: Database): boolean {
  const result = sqlite.prepare("PRAGMA foreign_keys").get();
  return result.foreign_keys === 1;
}

// Count rows in a table
export function countRows(sqlite: Database, tableName: string): number {
  const result = sqlite
    .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
    .get();
  return result.count;
}

/**
 * Test configuration helpers
 */

// Configure test environment
export function configureTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = ":memory:";
}

// Reset test configuration
export function resetTestEnvironment() {
  delete process.env.DATABASE_PATH;
  process.env.NODE_ENV = "development";
}
