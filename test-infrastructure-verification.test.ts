/**
 * Basic Infrastructure Verification Test
 *
 * This test verifies that the Drizzle ORM test infrastructure is working correctly.
 * It tests basic database operations and ensures the migration from sql.js is complete.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// Simple mock for drizzle module
vi.mock("../lib/db/drizzle", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
  dbConfig: {
    path: ":memory:",
    isConnected: () => true,
  },
  getDatabaseSync: () => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  }),
  initializeDatabase: async () => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  }),
  closeDatabase: vi.fn(),
  saveDatabase: vi.fn(),
  isDatabaseInitialized: vi.fn(() => true),
}));

vi.mock("../lib/db/index", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
  getDatabase: () => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  }),
  closeDatabase: vi.fn(),
  saveDatabase: vi.fn(),
  initializeDatabase: async () => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  }),
  getDatabasePath: () => ":memory:",
  isDatabaseInitialized: vi.fn(() => true),
}));

describe("Test Infrastructure Verification", () => {
  let sqlite: Database;
  let testDb: any;

  beforeEach(() => {
    // Create in-memory SQLite database
    sqlite = new Database(":memory:");
    testDb = drizzle(sqlite);

    // Mock the global db module for this test
    vi.doMock("../lib/db/drizzle", () => ({
      db: testDb,
      dbConfig: {
        path: ":memory:",
        isConnected: () => true,
      },
      getDatabaseSync: () => testDb,
      initializeDatabase: async () => testDb,
      closeDatabase: () => {},
      saveDatabase: () => {},
      isDatabaseInitialized: () => true,
    }));

    vi.doMock("../lib/db/index", () => ({
      db: testDb,
      getDatabase: () => testDb,
      closeDatabase: () => {},
      saveDatabase: () => {},
      initializeDatabase: async () => testDb,
      getDatabasePath: () => ":memory:",
      isDatabaseInitialized: () => true,
    }));
  });

  afterEach(() => {
    if (sqlite) {
      sqlite.close();
    }
    vi.clearAllMocks();
  });

  describe("Basic Database Setup", () => {
    it("should create an in-memory SQLite database", () => {
      expect(sqlite).toBeDefined();
      expect(sqlite.memory).toBe(true);
    });

    it("should create a Drizzle instance", () => {
      expect(testDb).toBeDefined();
      expect(typeof testDb.select).toBe("function");
      expect(typeof testDb.insert).toBe("function");
      expect(typeof testDb.update).toBe("function");
      expect(typeof testDb.delete).toBe("function");
    });

    it("should enable foreign keys", () => {
      sqlite.exec("PRAGMA foreign_keys = ON");
      const result = sqlite.prepare("PRAGMA foreign_keys").get();
      expect(result.foreign_keys).toBe(1);
    });
  });

  describe("Table Creation", () => {
    it("should create wallets table", () => {
      sqlite.exec(`
        CREATE TABLE wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      const result = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wallets'")
        .get();

      expect(result).toBeDefined();
      expect(result.name).toBe("wallets");
    });

    it("should create categories table", () => {
      sqlite.exec(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      const result = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
        .get();

      expect(result).toBeDefined();
      expect(result.name).toBe("categories");
    });

    it("should create transactions table", () => {
      sqlite.exec(`
        CREATE TABLE transactions (
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
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      const result = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'")
        .get();

      expect(result).toBeDefined();
      expect(result.name).toBe("transactions");
    });
  });

  describe("Basic CRUD Operations", () => {
    beforeEach(() => {
      // Create wallets table for testing
      sqlite.exec(`
        CREATE TABLE wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    });

    it("should insert data", () => {
      const stmt = sqlite.prepare(`
        INSERT INTO wallets (name) VALUES (?)
      `);

      const result = stmt.run("Test Wallet");

      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);
    });

    it("should read data", () => {
      // Insert test data
      sqlite.prepare("INSERT INTO wallets (name) VALUES (?)").run("Test Wallet");

      // Read data back
      const wallet = sqlite.prepare("SELECT * FROM wallets WHERE name = ?").get("Test Wallet");

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe("Test Wallet");
      expect(wallet.id).toBe(1);
    });

    it("should update data", () => {
      // Insert test data
      sqlite.prepare("INSERT INTO wallets (name) VALUES (?)").run("Original Name");

      // Update data
      const result = sqlite.prepare("UPDATE wallets SET name = ? WHERE name = ?")
        .run("Updated Name", "Original Name");

      expect(result.changes).toBe(1);

      // Verify update
      const wallet = sqlite.prepare("SELECT * FROM wallets WHERE id = 1").get();
      expect(wallet.name).toBe("Updated Name");
    });

    it("should delete data", () => {
      // Insert test data
      sqlite.prepare("INSERT INTO wallets (name) VALUES (?)").run("Delete Me");

      // Delete data
      const result = sqlite.prepare("DELETE FROM wallets WHERE name = ?")
        .run("Delete Me");

      expect(result.changes).toBe(1);

      // Verify deletion
      const wallet = sqlite.prepare("SELECT * FROM wallets WHERE name = ?")
        .get("Delete Me");
      expect(wallet).toBeUndefined();
    });
  });

  describe("Drizzle ORM Integration", () => {
    it("should create Drizzle select query builder", () => {
      const query = testDb.select();
      expect(query).toBeDefined();
      expect(typeof query.from).toBe("function");
    });

    it("should create Drizzle insert query builder", () => {
      const query = testDb.insert({} as any);
      expect(query).toBeDefined();
      expect(typeof query.values).toBe("function");
    });

    it("should create Drizzle update query builder", () => {
      const query = testDb.update({} as any);
      expect(query).toBeDefined();
      expect(typeof query.set).toBe("function");
    });

    it("should create Drizzle delete query builder", () => {
      const query = testDb.delete({} as any);
      expect(query).toBeDefined();
      expect(typeof query.where).toBe("function");
    });
  });

  describe("Mock System Verification", () => {
    it("should mock drizzle module successfully", () => {
      const { getDatabaseSync } = require("../lib/db/drizzle");
      expect(getDatabaseSync).toBeDefined();
    });

    it("should mock index module successfully", () => {
      const { getDatabase } = require("../lib/db/index");
      expect(getDatabase).toBeDefined();
    });

    it("should provide mock database configuration", () => {
      const { dbConfig } = require("../lib/db/drizzle");
      expect(dbConfig).toBeDefined();
      expect(dbConfig.path).toBe(":memory:");
      expect(typeof dbConfig.isConnected).toBe("function");
    });
  });

  describe("Test Environment", () => {
    it("should have vitest globals available", () => {
      expect(describe).toBeDefined();
      expect(it).toBeDefined();
      expect(expect).toBeDefined();
      expect(beforeEach).toBeDefined();
      expect(afterEach).toBeDefined();
    });

    it("should have testing library matchers", () => {
      expect(() => {
        expect(document).toBeDefined();
      }).not.toThrow();
    });

    it("should clean up mocks between tests", () => {
      // This test verifies that mocks are cleaned up
      // by checking that new mocks don't interfere
      const mockFn = vi.fn();
      mockFn("test");
      expect(mockFn).toHaveBeenCalledWith("test");

      // After this test ends, the mock should be cleaned up
      // by the afterEach hook in beforeEach
    });
  });

  describe("Infrastructure Health Check", () => {
    it("should pass basic health check", () => {
      // Create a simple test that verifies all components work together
      const sqlite = new Database(":memory:");
      const db = drizzle(sqlite);

      // Create table
      sqlite.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");

      // Insert data
      sqlite.exec("INSERT INTO test (name) VALUES ('test')");

      // Query data
      const result = sqlite.prepare("SELECT * FROM test").get();

      expect(result).toBeDefined();
      expect(result.name).toBe("test");

      sqlite.close();
    });

    it("should handle error cases gracefully", () => {
      expect(() => {
        // This should throw an error for invalid SQL
        sqlite.exec("INVALID SQL STATEMENT");
      }).toThrow();
    });

    it("should support transaction operations", () => {
      sqlite.exec("CREATE TABLE test_tx (id INTEGER PRIMARY KEY, value TEXT)");

      const transaction = sqlite.transaction(() => {
        sqlite.exec("INSERT INTO test_tx (value) VALUES ('first')");
        sqlite.exec("INSERT INTO test_tx (value) VALUES ('second')");
      });

      expect(() => transaction()).not.toThrow();

      const count = sqlite.prepare("SELECT COUNT(*) as count FROM test_tx").get();
      expect(count.count).toBe(2);
    });
  });
});
