/**
 * Tests for budget repository functions
 * Tests all budget-related database operations using Drizzle ORM
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  vi,
  beforeAll,
} from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  categoriesTable,
  transactionsTable,
  walletsTable,
  budgetsTable,
} from "../schema";
import {
  getBudgets,
  getBudgetById,
  getBudgetByMonthAndCategory,
  createBudget,
  upsertBudget,
  updateBudget,
  deleteBudget,
  deleteBudgetByMonthAndCategory,
  getBudgetsWithActual,
  getBudgetWithActual,
  getTotalBudgetForMonth,
  getBudgetMonths,
  countBudgets,
  copyBudgetsToMonth,
} from "../repositories/budgets";
import { eq } from "drizzle-orm";

// Mock the drizzle module before importing repositories
vi.mock("../drizzle", () => ({
  db: {} as any, // Will be replaced in tests
}));

describe("Budget Repository", () => {
  let sqlite: Database;
  let testDb: any;
  let testCategoryId: number;
  let testWalletId: number;

  beforeEach(() => {
    // Create in-memory SQLite database
    sqlite = new Database(":memory:");
    testDb = drizzle(sqlite);

    // Mock the global db module
    vi.doMock("../drizzle", () => ({
      db: testDb,
    }));

    // Create tables
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

    // Create test data
    const walletResult = sqlite.exec(`
      INSERT INTO wallets (name, created_at, updated_at)
      VALUES ('Test Wallet', datetime('now'), datetime('now'))
    `);
    testWalletId = 1;

    const categoryResult = sqlite.exec(`
      INSERT INTO categories (name, type, created_at, updated_at)
      VALUES ('Food', 'expense', datetime('now'), datetime('now'))
    `);
    testCategoryId = 1;
  });

  afterAll(() => {
    if (sqlite) {
      sqlite.close();
    }
  });

  describe("createBudget", () => {
    it("should create a new budget", () => {
      const budget = createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      expect(budget).toBeDefined();
      expect(budget.id).toBe(1);
      expect(budget.month).toBe("2024-01-01");
      expect(budget.category_id).toBe(testCategoryId);
      expect(budget.limit_amount).toBe(1000000);
      expect(budget.created_at).toBeDefined();
      expect(budget.updated_at).toBeDefined();
    });

    it("should throw error when creating duplicate budget for same month and category", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      expect(() =>
        createBudget({
          month: "2024-01-01",
          category_id: testCategoryId,
          limit_amount: 2000000,
        }),
      ).toThrow();
    });

    it("should allow same category for different months", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      const budget2 = createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 1500000,
      });

      expect(budget2).toBeDefined();
      expect(budget2.month).toBe("2024-02-01");
    });
  });

  describe("upsertBudget", () => {
    it("should create budget if it does not exist", () => {
      const budget = upsertBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1200000,
      });

      expect(budget).toBeDefined();
      expect(budget.limit_amount).toBe(1200000);
    });

    it("should update budget if it already exists", () => {
      // Create initial budget
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Upsert with new amount
      const budget = upsertBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1500000,
      });

      expect(budget).toBeDefined();
      expect(budget.limit_amount).toBe(1500000);
    });
  });

  describe("getBudgets", () => {
    beforeEach(() => {
      // Create multiple budgets
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Create second category
      sqlite.exec(`
        INSERT INTO categories (name, type, created_at, updated_at)
        VALUES ('Transport', 'expense', datetime('now'), datetime('now'))
      `);

      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 1200000,
      });
    });

    it("should return all budgets", () => {
      const budgets = getBudgets();

      expect(budgets).toHaveLength(3);
    });

    it("should filter by month", () => {
      const budgets = getBudgets({ month: "2024-01-01" });

      expect(budgets).toHaveLength(2);
      expect(budgets.every((b) => b.month === "2024-01-01")).toBe(true);
    });

    it("should filter by category_id", () => {
      const budgets = getBudgets({ category_id: testCategoryId });

      expect(budgets).toHaveLength(2);
      expect(budgets.every((b) => b.category_id === testCategoryId)).toBe(true);
    });

    it("should order by month and category name", () => {
      const budgets = getBudgets();

      expect(budgets[0].month).toBe("2024-01-01");
      expect(budgets[2].month).toBe("2024-02-01");
    });
  });

  describe("getBudgetById", () => {
    it("should return budget when it exists", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      const budget = getBudgetById(created.id);

      expect(budget).toBeDefined();
      expect(budget?.id).toBe(created.id);
      expect(budget?.month).toBe("2024-01-01");
    });

    it("should return null when budget does not exist", () => {
      const budget = getBudgetById(999);

      expect(budget).toBeNull();
    });
  });

  describe("getBudgetByMonthAndCategory", () => {
    it("should return budget when it exists", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      const budget = getBudgetByMonthAndCategory("2024-01-01", testCategoryId);

      expect(budget).toBeDefined();
      expect(budget?.month).toBe("2024-01-01");
      expect(budget?.category_id).toBe(testCategoryId);
    });

    it("should return null when budget does not exist", () => {
      const budget = getBudgetByMonthAndCategory("2024-01-01", 999);

      expect(budget).toBeNull();
    });
  });

  describe("updateBudget", () => {
    it("should update budget limit_amount", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      const updated = updateBudget(created.id, {
        limit_amount: 1300000,
      });

      expect(updated).toBeDefined();
      expect(updated?.limit_amount).toBe(1300000);
    });

    it("should return null when budget does not exist", () => {
      const updated = updateBudget(999, {
        limit_amount: 1000000,
      });

      expect(updated).toBeNull();
    });
  });

  describe("deleteBudget", () => {
    it("should delete budget and return true", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      const result = deleteBudget(created.id);

      expect(result).toBe(true);
      expect(getBudgetById(created.id)).toBeNull();
    });

    it("should return false when budget does not exist", () => {
      const result = deleteBudget(999);

      expect(result).toBe(false);
    });
  });

  describe("deleteBudgetByMonthAndCategory", () => {
    it("should delete budget by month and category", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      const result = deleteBudgetByMonthAndCategory(
        "2024-01-01",
        testCategoryId,
      );

      expect(result).toBe(true);
      expect(
        getBudgetByMonthAndCategory("2024-01-01", testCategoryId),
      ).toBeNull();
    });

    it("should return false when budget does not exist", () => {
      const result = deleteBudgetByMonthAndCategory("2024-01-01", 999);

      expect(result).toBe(false);
    });
  });

  describe("getBudgetsWithActual", () => {
    beforeEach(() => {
      // Create budget
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Create some transactions for this category and month
      testDb.insert(transactionsTable).values([
        {
          type: "expense",
          amount: 300000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "expense",
          amount: 200000,
          date: "2024-01-20",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "expense",
          amount: 150000,
          date: "2024-02-15", // Different month
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);
    });

    it("should return budgets with actual spending amounts", () => {
      const budgets = getBudgetsWithActual("2024-01-01", "2024-01-31");

      expect(budgets).toHaveLength(1);
      expect(budgets[0].limit_amount).toBe(1000000);
      expect(budgets[0].actual_amount).toBe(500000);
      expect(budgets[0].remaining_amount).toBe(500000);
      expect(budgets[0].percentage_used).toBe(50);
    });

    it("should handle budgets with no transactions", () => {
      // Create second category and budget
      sqlite.exec(`
        INSERT INTO categories (name, type, created_at, updated_at)
        VALUES ('Transport', 'expense', datetime('now'), datetime('now'))
      `);

      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      const budgets = getBudgetsWithActual("2024-01-01", "2024-01-31");

      const transportBudget = budgets.find((b) => b.category_id === 2);
      expect(transportBudget?.actual_amount).toBe(0);
      expect(transportBudget?.percentage_used).toBe(0);
    });
  });

  describe("getBudgetWithActual", () => {
    it("should return budget with actual spending", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Add transaction
      testDb.insert(transactionsTable).values({
        type: "expense",
        amount: 400000,
        date: "2024-01-15",
        wallet_id: testWalletId,
        category_id: testCategoryId,
      });

      const budget = getBudgetWithActual(created.id);

      expect(budget).toBeDefined();
      expect(budget?.limit_amount).toBe(1000000);
      expect(budget?.actual_amount).toBe(400000);
      expect(budget?.percentage_used).toBe(40);
    });

    it("should return null when budget does not exist", () => {
      const budget = getBudgetWithActual(999);

      expect(budget).toBeNull();
    });
  });

  describe("getTotalBudgetForMonth", () => {
    it("should return 0 when no budgets exist for month", () => {
      const total = getTotalBudgetForMonth("2024-01-01");

      expect(total).toBe(0);
    });

    it("should return sum of all budgets for month", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Create second category
      sqlite.exec(`
        INSERT INTO categories (name, type, created_at, updated_at)
        VALUES ('Transport', 'expense', datetime('now'), datetime('now'))
      `);

      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      const total = getTotalBudgetForMonth("2024-01-01");

      expect(total).toBe(1500000);
    });

    it("should only include budgets for specified month", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 800000,
      });

      const janTotal = getTotalBudgetForMonth("2024-01-01");
      const febTotal = getTotalBudgetForMonth("2024-02-01");

      expect(janTotal).toBe(1000000);
      expect(febTotal).toBe(800000);
    });
  });

  describe("getBudgetMonths", () => {
    it("should return empty array when no budgets exist", () => {
      const months = getBudgetMonths();

      expect(months).toEqual([]);
    });

    it("should return unique months with budgets", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 1200000,
      });

      const months = getBudgetMonths();

      expect(months).toHaveLength(2);
      expect(months).toContain("2024-01-01");
      expect(months).toContain("2024-02-01");
    });

    it("should return months ordered chronologically", () => {
      createBudget({
        month: "2024-03-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 800000,
      });

      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 900000,
      });

      const months = getBudgetMonths();

      expect(months[0]).toBe("2024-01-01");
      expect(months[1]).toBe("2024-02-01");
      expect(months[2]).toBe("2024-03-01");
    });
  });

  describe("countBudgets", () => {
    it("should return 0 when no budgets exist", () => {
      const count = countBudgets();

      expect(count).toBe(0);
    });

    it("should return correct count", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 1200000,
      });

      expect(countBudgets()).toBe(3);
    });

    it("should respect filters", () => {
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 800000,
      });

      expect(countBudgets({ month: "2024-01-01" })).toBe(1);
      expect(countBudgets({ category_id: testCategoryId })).toBe(2);
    });
  });

  describe("copyBudgetsToMonth", () => {
    it("should copy budgets from source month to target month", () => {
      // Create budgets for January
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Create second category
      sqlite.exec(`
        INSERT INTO categories (name, type, created_at, updated_at)
        VALUES ('Transport', 'expense', datetime('now'), datetime('now'))
      `);

      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      // Copy to February
      const result = copyBudgetsToMonth("2024-01-01", "2024-02-01");

      expect(result).toBe(2);

      // Verify February budgets were created
      const febBudgets = getBudgets({ month: "2024-02-01" });
      expect(febBudgets).toHaveLength(2);
      expect(febBudgets[0].limit_amount).toBe(1000000);
      expect(febBudgets[1].limit_amount).toBe(500000);
    });

    it("should handle empty source month", () => {
      const result = copyBudgetsToMonth("2024-01-01", "2024-02-01");

      expect(result).toBe(0);
    });

    it("should not duplicate existing budgets", () => {
      // Create January budget
      createBudget({
        month: "2024-01-01",
        category_id: testCategoryId,
        limit_amount: 1000000,
      });

      // Create February budget with same category
      createBudget({
        month: "2024-02-01",
        category_id: testCategoryId,
        limit_amount: 800000,
      });

      // Try to copy January to February
      const result = copyBudgetsToMonth("2024-01-01", "2024-02-01");

      // Should not overwrite existing February budget
      expect(result).toBe(0);

      const febBudget = getBudgetByMonthAndCategory(
        "2024-02-01",
        testCategoryId,
      );
      expect(febBudget?.limit_amount).toBe(800000); // Original value
    });
  });
});
