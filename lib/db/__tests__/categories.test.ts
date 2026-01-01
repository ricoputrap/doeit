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
  getAllCategories,
  getCategoriesByType,
  getCategoryById,
  getCategoryByNameAndType,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryExists,
  getCategoriesWithSpent,
  getCategorySpent,
  countCategories,
  countCategoriesByType,
} from "../repositories/categories";

async function setupTestDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (testDb) {
    testDb.close();
  }

  testDb = new SQL.Database();
  testDb.run("PRAGMA foreign_keys = ON");

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

  // Create wallets table (needed for transactions)
  testDb.run(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create transactions table for spent calculation tests
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

  // Create a test wallet for transactions
  testDb.run(
    `INSERT INTO wallets (name, created_at, updated_at) VALUES ('Test Wallet', datetime('now'), datetime('now'))`,
  );
}

describe("Category Repository", () => {
  beforeAll(async () => {
    SQL = await initSqlJs();
  });

  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterAll(() => {
    if (testDb) testDb.close();
  });

  describe("createCategory", () => {
    it("should create a new expense category", () => {
      const category = createCategory({ name: "Food", type: "expense" });

      expect(category).toBeDefined();
      expect(category.id).toBe(1);
      expect(category.name).toBe("Food");
      expect(category.type).toBe("expense");
      expect(category.created_at).toBeDefined();
      expect(category.updated_at).toBeDefined();
    });

    it("should create a new income category", () => {
      const category = createCategory({ name: "Salary", type: "income" });

      expect(category).toBeDefined();
      expect(category.name).toBe("Salary");
      expect(category.type).toBe("income");
    });

    it("should allow same name for different types", () => {
      createCategory({ name: "Other", type: "expense" });
      const incomeCategory = createCategory({ name: "Other", type: "income" });

      expect(incomeCategory).toBeDefined();
      expect(incomeCategory.type).toBe("income");
    });

    it("should throw error when creating category with duplicate name and type", () => {
      createCategory({ name: "Food", type: "expense" });

      expect(() => createCategory({ name: "Food", type: "expense" })).toThrow();
    });
  });

  describe("getAllCategories", () => {
    it("should return empty array when no categories exist", () => {
      const categories = getAllCategories();

      expect(categories).toEqual([]);
    });

    it("should return all categories ordered by type and name", () => {
      createCategory({ name: "Salary", type: "income" });
      createCategory({ name: "Food", type: "expense" });
      createCategory({ name: "Transport", type: "expense" });
      createCategory({ name: "Freelance", type: "income" });

      const categories = getAllCategories();

      expect(categories).toHaveLength(4);
      // Ordered by type first (expense, income), then by name
      expect(categories[0].name).toBe("Food");
      expect(categories[0].type).toBe("expense");
      expect(categories[1].name).toBe("Transport");
      expect(categories[1].type).toBe("expense");
      expect(categories[2].name).toBe("Freelance");
      expect(categories[2].type).toBe("income");
      expect(categories[3].name).toBe("Salary");
      expect(categories[3].type).toBe("income");
    });
  });

  describe("getCategoriesByType", () => {
    beforeEach(() => {
      createCategory({ name: "Food", type: "expense" });
      createCategory({ name: "Transport", type: "expense" });
      createCategory({ name: "Salary", type: "income" });
    });

    it("should return only expense categories", () => {
      const categories = getCategoriesByType("expense");

      expect(categories).toHaveLength(2);
      expect(categories.every((c) => c.type === "expense")).toBe(true);
    });

    it("should return only income categories", () => {
      const categories = getCategoriesByType("income");

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Salary");
    });

    it("should return categories ordered by name", () => {
      const categories = getCategoriesByType("expense");

      expect(categories[0].name).toBe("Food");
      expect(categories[1].name).toBe("Transport");
    });
  });

  describe("getCategoryById", () => {
    it("should return category when it exists", () => {
      const created = createCategory({ name: "Food", type: "expense" });

      const category = getCategoryById(created.id);

      expect(category).toBeDefined();
      expect(category?.id).toBe(created.id);
      expect(category?.name).toBe("Food");
    });

    it("should return null when category does not exist", () => {
      const category = getCategoryById(999);

      expect(category).toBeNull();
    });
  });

  describe("getCategoryByNameAndType", () => {
    it("should return category when it exists", () => {
      createCategory({ name: "Food", type: "expense" });

      const category = getCategoryByNameAndType("Food", "expense");

      expect(category).toBeDefined();
      expect(category?.name).toBe("Food");
      expect(category?.type).toBe("expense");
    });

    it("should return null for wrong type", () => {
      createCategory({ name: "Food", type: "expense" });

      const category = getCategoryByNameAndType("Food", "income");

      expect(category).toBeNull();
    });

    it("should return null when category does not exist", () => {
      const category = getCategoryByNameAndType("NonExistent", "expense");

      expect(category).toBeNull();
    });
  });

  describe("updateCategory", () => {
    it("should update category name", () => {
      const created = createCategory({ name: "Food", type: "expense" });

      const updated = updateCategory(created.id, { name: "Food & Dining" });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Food & Dining");
      expect(updated?.type).toBe("expense");
    });

    it("should update category type", () => {
      const created = createCategory({ name: "Other", type: "expense" });

      const updated = updateCategory(created.id, { type: "income" });

      expect(updated).toBeDefined();
      expect(updated?.type).toBe("income");
    });

    it("should return null when category does not exist", () => {
      const updated = updateCategory(999, { name: "Test" });

      expect(updated).toBeNull();
    });
  });

  describe("deleteCategory", () => {
    it("should delete category and return true", () => {
      const created = createCategory({ name: "Food", type: "expense" });

      const result = deleteCategory(created.id);

      expect(result).toBe(true);
      expect(getCategoryById(created.id)).toBeNull();
    });

    it("should return false when category does not exist", () => {
      const result = deleteCategory(999);

      expect(result).toBe(false);
    });

    it("should throw error when category has transactions", () => {
      const category = createCategory({ name: "Food", type: "expense" });

      // Create a transaction for this category
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 50000, '2024-01-01', 1, ?, datetime('now'), datetime('now'))`,
        [category.id],
      );

      expect(() => deleteCategory(category.id)).toThrow();
    });
  });

  describe("categoryExists", () => {
    it("should return true when category exists", () => {
      const created = createCategory({ name: "Food", type: "expense" });

      expect(categoryExists(created.id)).toBe(true);
    });

    it("should return false when category does not exist", () => {
      expect(categoryExists(999)).toBe(false);
    });
  });

  describe("countCategories", () => {
    it("should return 0 when no categories exist", () => {
      expect(countCategories()).toBe(0);
    });

    it("should return correct count", () => {
      createCategory({ name: "Food", type: "expense" });
      createCategory({ name: "Transport", type: "expense" });
      createCategory({ name: "Salary", type: "income" });

      expect(countCategories()).toBe(3);
    });
  });

  describe("countCategoriesByType", () => {
    beforeEach(() => {
      createCategory({ name: "Food", type: "expense" });
      createCategory({ name: "Transport", type: "expense" });
      createCategory({ name: "Salary", type: "income" });
    });

    it("should return correct count for expense categories", () => {
      expect(countCategoriesByType("expense")).toBe(2);
    });

    it("should return correct count for income categories", () => {
      expect(countCategoriesByType("income")).toBe(1);
    });
  });

  describe("getCategorySpent", () => {
    it("should return 0 for category with no transactions", () => {
      const category = createCategory({ name: "Food", type: "expense" });

      const spent = getCategorySpent(category.id, "2024-01-01", "2024-02-01");

      expect(spent).toBe(0);
    });

    it("should return total spent for category in date range", () => {
      const category = createCategory({ name: "Food", type: "expense" });

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 50000, '2024-01-15', 1, ?, datetime('now'), datetime('now'))`,
        [category.id],
      );

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 30000, '2024-01-20', 1, ?, datetime('now'), datetime('now'))`,
        [category.id],
      );

      const spent = getCategorySpent(category.id, "2024-01-01", "2024-02-01");

      expect(spent).toBe(80000);
    });

    it("should only include transactions within date range", () => {
      const category = createCategory({ name: "Food", type: "expense" });

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 50000, '2024-01-15', 1, ?, datetime('now'), datetime('now'))`,
        [category.id],
      );

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 30000, '2024-02-15', 1, ?, datetime('now'), datetime('now'))`,
        [category.id],
      );

      const spent = getCategorySpent(category.id, "2024-01-01", "2024-02-01");

      expect(spent).toBe(50000);
    });
  });

  describe("getCategoriesWithSpent", () => {
    it("should return expense categories with spent amounts", () => {
      const food = createCategory({ name: "Food", type: "expense" });
      const transport = createCategory({ name: "Transport", type: "expense" });
      createCategory({ name: "Salary", type: "income" });

      // Add expenses to food category
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 50000, '2024-01-15', 1, ?, datetime('now'), datetime('now'))`,
        [food.id],
      );

      // Add expenses to transport category
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, category_id, created_at, updated_at)
         VALUES ('expense', 20000, '2024-01-10', 1, ?, datetime('now'), datetime('now'))`,
        [transport.id],
      );

      const categoriesWithSpent = getCategoriesWithSpent(
        "2024-01-01",
        "2024-02-01",
      );

      expect(categoriesWithSpent).toHaveLength(2);

      const foodCategory = categoriesWithSpent.find((c) => c.name === "Food");
      const transportCategory = categoriesWithSpent.find(
        (c) => c.name === "Transport",
      );

      expect(foodCategory?.spent).toBe(50000);
      expect(transportCategory?.spent).toBe(20000);
    });

    it("should return 0 spent for categories with no transactions", () => {
      createCategory({ name: "Food", type: "expense" });

      const categoriesWithSpent = getCategoriesWithSpent(
        "2024-01-01",
        "2024-02-01",
      );

      expect(categoriesWithSpent).toHaveLength(1);
      expect(categoriesWithSpent[0].spent).toBe(0);
    });
  });
});
