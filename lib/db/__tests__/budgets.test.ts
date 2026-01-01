import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  vi,
  beforeAll,
} from "vitest";
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";

// Create an in-memory test database
let testDb: SqlJsDatabase;
let SQL: Awaited<ReturnType<typeof initSqlJs>>;

// Mock the database module before importing repositories
vi.mock("../index", () => ({
  getDatabase: () => testDb,
  closeDatabase: () => {
    if (testDb) testDb.close();
  },
  saveDatabase: () => {
    // No-op for tests
  },
}));

// Import after mocking
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

async function setupTestDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (testDb) {
    testDb.close();
  }

  testDb = new SQL.Database();
  testDb.run("PRAGMA foreign_keys = ON");

  // Create wallets table (needed for transactions)
  testDb.run(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create categories table
  testDb.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name, type)
    )
  `);

  // Create transactions table
  testDb.run(`
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

  // Create budgets table
  testDb.run(`
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

  // Seed test data
  testDb.run(
    `INSERT INTO wallets (name, created_at, updated_at) VALUES ('Cash', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Food', 'expense', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Transport', 'expense', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Entertainment', 'expense', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Salary', 'income', datetime('now'), datetime('now'))`,
  );
}

describe("Budget Repository", () => {
  beforeAll(async () => {
    SQL = await initSqlJs();
  });

  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterAll(() => {
    if (testDb) testDb.close();
  });

  describe("createBudget", () => {
    it("should create a new budget", () => {
      const budget = createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      expect(budget).toBeDefined();
      expect(budget.id).toBe(1);
      expect(budget.month).toBe("2024-01-01");
      expect(budget.category_id).toBe(1);
      expect(budget.limit_amount).toBe(1000000);
      expect(budget.created_at).toBeDefined();
      expect(budget.updated_at).toBeDefined();
    });

    it("should throw error when creating duplicate budget for same month and category", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      expect(() =>
        createBudget({
          month: "2024-01-01",
          category_id: 1,
          limit_amount: 2000000,
        }),
      ).toThrow();
    });

    it("should allow same category for different months", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      const budget2 = createBudget({
        month: "2024-02-01",
        category_id: 1,
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
        category_id: 1,
        limit_amount: 1000000,
      });

      expect(budget).toBeDefined();
      expect(budget.limit_amount).toBe(1000000);
    });

    it("should update budget if it already exists", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      const updated = upsertBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 2000000,
      });

      expect(updated.limit_amount).toBe(2000000);

      // Should still have only one budget
      const budgets = getBudgets({ month: "2024-01-01", category_id: 1 });
      expect(budgets).toHaveLength(1);
    });
  });

  describe("getBudgets", () => {
    beforeEach(() => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });
      createBudget({
        month: "2024-02-01",
        category_id: 1,
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
      const budgets = getBudgets({ category_id: 1 });

      expect(budgets).toHaveLength(2);
      expect(budgets.every((b) => b.category_id === 1)).toBe(true);
    });

    it("should filter by both month and category_id", () => {
      const budgets = getBudgets({ month: "2024-01-01", category_id: 1 });

      expect(budgets).toHaveLength(1);
      expect(budgets[0].month).toBe("2024-01-01");
      expect(budgets[0].category_id).toBe(1);
    });

    it("should return budgets ordered by month descending", () => {
      const budgets = getBudgets();

      expect(budgets[0].month).toBe("2024-02-01");
      expect(budgets[1].month).toBe("2024-01-01");
    });
  });

  describe("getBudgetById", () => {
    it("should return budget when it exists", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      const budget = getBudgetById(created.id);

      expect(budget).toBeDefined();
      expect(budget?.id).toBe(created.id);
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
        category_id: 1,
        limit_amount: 1000000,
      });

      const budget = getBudgetByMonthAndCategory("2024-01-01", 1);

      expect(budget).toBeDefined();
      expect(budget?.month).toBe("2024-01-01");
      expect(budget?.category_id).toBe(1);
    });

    it("should return null when budget does not exist", () => {
      const budget = getBudgetByMonthAndCategory("2024-01-01", 1);

      expect(budget).toBeNull();
    });
  });

  describe("updateBudget", () => {
    it("should update budget limit_amount", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      const updated = updateBudget(created.id, { limit_amount: 1500000 });

      expect(updated).toBeDefined();
      expect(updated?.limit_amount).toBe(1500000);
    });

    it("should return null when budget does not exist", () => {
      const updated = updateBudget(999, { limit_amount: 1000000 });

      expect(updated).toBeNull();
    });
  });

  describe("deleteBudget", () => {
    it("should delete budget and return true", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: 1,
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
        category_id: 1,
        limit_amount: 1000000,
      });

      const result = deleteBudgetByMonthAndCategory("2024-01-01", 1);

      expect(result).toBe(true);
      expect(getBudgetByMonthAndCategory("2024-01-01", 1)).toBeNull();
    });

    it("should return false when budget does not exist", () => {
      const result = deleteBudgetByMonthAndCategory("2024-01-01", 999);

      expect(result).toBe(false);
    });
  });

  describe("getBudgetsWithActual", () => {
    it("should return budgets with actual spent amounts", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      // Add some expenses
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 300000, '2024-01-15', 1, 1, datetime('now'), datetime('now'))`,
      );
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 200000, '2024-01-20', 1, 1, datetime('now'), datetime('now'))`,
      );
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 100000, '2024-01-10', 1, 2, datetime('now'), datetime('now'))`,
      );

      const budgetsWithActual = getBudgetsWithActual("2024-01-01");

      expect(budgetsWithActual).toHaveLength(2);

      const foodBudget = budgetsWithActual.find(
        (b) => b.category_name === "Food",
      );
      const transportBudget = budgetsWithActual.find(
        (b) => b.category_name === "Transport",
      );

      expect(foodBudget?.actual_spent).toBe(500000);
      expect(foodBudget?.remaining).toBe(500000);

      expect(transportBudget?.actual_spent).toBe(100000);
      expect(transportBudget?.remaining).toBe(400000);
    });

    it("should return 0 actual_spent for budgets with no expenses", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      const budgetsWithActual = getBudgetsWithActual("2024-01-01");

      expect(budgetsWithActual).toHaveLength(1);
      expect(budgetsWithActual[0].actual_spent).toBe(0);
      expect(budgetsWithActual[0].remaining).toBe(1000000);
    });

    it("should only include expenses within the budget month", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      // Expense in January
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 300000, '2024-01-15', 1, 1, datetime('now'), datetime('now'))`,
      );

      // Expense in February (should not be included)
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 200000, '2024-02-15', 1, 1, datetime('now'), datetime('now'))`,
      );

      const budgetsWithActual = getBudgetsWithActual("2024-01-01");

      expect(budgetsWithActual[0].actual_spent).toBe(300000);
    });

    it("should show negative remaining when over budget", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 500000,
      });

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 700000, '2024-01-15', 1, 1, datetime('now'), datetime('now'))`,
      );

      const budgetsWithActual = getBudgetsWithActual("2024-01-01");

      expect(budgetsWithActual[0].actual_spent).toBe(700000);
      expect(budgetsWithActual[0].remaining).toBe(-200000);
    });
  });

  describe("getBudgetWithActual", () => {
    it("should return single budget with actual spent", () => {
      const created = createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 400000, '2024-01-15', 1, 1, datetime('now'), datetime('now'))`,
      );

      const budgetWithActual = getBudgetWithActual(created.id);

      expect(budgetWithActual).toBeDefined();
      expect(budgetWithActual?.actual_spent).toBe(400000);
      expect(budgetWithActual?.remaining).toBe(600000);
      expect(budgetWithActual?.category_name).toBe("Food");
    });

    it("should return null when budget does not exist", () => {
      const budgetWithActual = getBudgetWithActual(999);

      expect(budgetWithActual).toBeNull();
    });
  });

  describe("getTotalBudgetForMonth", () => {
    it("should return 0 when no budgets exist for month", () => {
      const total = getTotalBudgetForMonth("2024-01-01");

      expect(total).toBe(0);
    });

    it("should return sum of all budget limits for month", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 3,
        limit_amount: 300000,
      });

      const total = getTotalBudgetForMonth("2024-01-01");

      expect(total).toBe(1800000);
    });
  });

  describe("getBudgetMonths", () => {
    it("should return empty array when no budgets exist", () => {
      const months = getBudgetMonths();

      expect(months).toEqual([]);
    });

    it("should return distinct months ordered descending", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });
      createBudget({
        month: "2024-03-01",
        category_id: 1,
        limit_amount: 1200000,
      });
      createBudget({
        month: "2024-02-01",
        category_id: 1,
        limit_amount: 1100000,
      });

      const months = getBudgetMonths();

      expect(months).toEqual(["2024-03-01", "2024-02-01", "2024-01-01"]);
    });
  });

  describe("countBudgets", () => {
    it("should return 0 when no budgets exist", () => {
      expect(countBudgets()).toBe(0);
    });

    it("should return correct count", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });
      createBudget({
        month: "2024-02-01",
        category_id: 1,
        limit_amount: 1200000,
      });

      expect(countBudgets()).toBe(3);
    });

    it("should respect filters in count", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });
      createBudget({
        month: "2024-02-01",
        category_id: 1,
        limit_amount: 1200000,
      });

      expect(countBudgets({ month: "2024-01-01" })).toBe(2);
      expect(countBudgets({ category_id: 1 })).toBe(2);
    });
  });

  describe("copyBudgetsToMonth", () => {
    it("should copy budgets from one month to another", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      const copiedBudgets = copyBudgetsToMonth("2024-01-01", "2024-02-01");

      expect(copiedBudgets).toHaveLength(2);

      const februaryBudgets = getBudgets({ month: "2024-02-01" });
      expect(februaryBudgets).toHaveLength(2);
    });

    it("should not copy budgets that already exist in target month", () => {
      createBudget({
        month: "2024-01-01",
        category_id: 1,
        limit_amount: 1000000,
      });
      createBudget({
        month: "2024-01-01",
        category_id: 2,
        limit_amount: 500000,
      });

      // Create one budget in February already
      createBudget({
        month: "2024-02-01",
        category_id: 1,
        limit_amount: 800000,
      });

      const copiedBudgets = copyBudgetsToMonth("2024-01-01", "2024-02-01");

      // Should only copy the one that doesn't exist
      expect(copiedBudgets).toHaveLength(1);
      expect(copiedBudgets[0].category_id).toBe(2);

      // February should have 2 budgets total
      const februaryBudgets = getBudgets({ month: "2024-02-01" });
      expect(februaryBudgets).toHaveLength(2);

      // The existing budget should keep its original limit
      const existingBudget = februaryBudgets.find((b) => b.category_id === 1);
      expect(existingBudget?.limit_amount).toBe(800000);
    });

    it("should return empty array when source month has no budgets", () => {
      const copiedBudgets = copyBudgetsToMonth("2024-01-01", "2024-02-01");

      expect(copiedBudgets).toEqual([]);
    });
  });
});
