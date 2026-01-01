/**
 * Tests for transaction repository functions
 * Tests all transaction-related database operations using Drizzle ORM
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
  transactionsTable,
  walletsTable,
  categoriesTable,
  savingsBucketsTable,
} from "../schema";
import {
  getTransactions,
  getTransactionById,
  getTransactionsByTransferId,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  deleteTransfer,
  getTotalIncome,
  getTotalExpenses,
  getSpendingByCategory,
  getNetWorth,
  countTransactions,
} from "../repositories/transactions";
import { eq } from "drizzle-orm";

// Mock the drizzle module before importing repositories
vi.mock("../drizzle", () => ({
  db: {} as any, // Will be replaced in tests
}));

describe("Transaction Repository", () => {
  let sqlite: Database;
  let testDb: any;
  let testWalletId: number;
  let testCategoryId: number;

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
      CREATE TABLE IF NOT EXISTS savings_buckets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (savings_bucket_id) REFERENCES savings_buckets(id) ON DELETE RESTRICT
      )
    `);

    // Create test wallet
    const walletResult = sqlite.exec(`
      INSERT INTO wallets (name, created_at, updated_at)
      VALUES ('Test Wallet', datetime('now'), datetime('now'))
    `);
    testWalletId = 1;

    // Create test category
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

  describe("createTransaction", () => {
    it("should create an income transaction", () => {
      const transaction = createTransaction({
        type: "income",
        amount: 100000,
        date: "2024-01-01",
        wallet_id: testWalletId,
        category_id: testCategoryId,
        note: "Salary",
      });

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(1);
      expect(transaction.type).toBe("income");
      expect(transaction.amount).toBe(100000);
      expect(transaction.wallet_id).toBe(testWalletId);
      expect(transaction.category_id).toBe(testCategoryId);
      expect(transaction.note).toBe("Salary");
      expect(transaction.created_at).toBeDefined();
      expect(transaction.updated_at).toBeDefined();
    });

    it("should create an expense transaction", () => {
      const transaction = createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-02",
        wallet_id: testWalletId,
        category_id: testCategoryId,
        note: "Lunch",
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe("expense");
      expect(transaction.amount).toBe(50000);
      expect(transaction.note).toBe("Lunch");
    });

    it("should create a transaction without note", () => {
      const transaction = createTransaction({
        type: "expense",
        amount: 25000,
        date: "2024-01-03",
        wallet_id: testWalletId,
        category_id: testCategoryId,
      });

      expect(transaction).toBeDefined();
      expect(transaction.note).toBeNull();
    });
  });

  describe("createTransfer", () => {
    it("should create two linked transactions for transfer", () => {
      const transfer = createTransfer({
        from_wallet_id: testWalletId,
        to_wallet_id: testWalletId, // Using same wallet for simplicity
        amount: 50000,
        date: "2024-01-01",
        note: "Transfer to savings",
      });

      expect(transfer).toBeDefined();
      expect(transfer.transfer_id).toBeDefined();
      expect(transfer.from_transaction).toBeDefined();
      expect(transfer.to_transaction).toBeDefined();

      // Both transactions should have the same transfer_id
      expect(transfer.from_transaction.transfer_id).toBe(transfer.transfer_id);
      expect(transfer.to_transaction.transfer_id).toBe(transfer.transfer_id);

      // From transaction should be negative
      expect(transfer.from_transaction.amount).toBe(-50000);

      // To transaction should be positive
      expect(transfer.to_transaction.amount).toBe(50000);
    });

    it("should throw error when source and destination wallets are the same", () => {
      expect(() => {
        createTransfer({
          from_wallet_id: testWalletId,
          to_wallet_id: testWalletId,
          amount: 10000,
          date: "2024-01-01",
        });
      }).toThrow();
    });

    it("should throw error when amount is not positive", () => {
      expect(() => {
        createTransfer({
          from_wallet_id: testWalletId,
          to_wallet_id: testWalletId + 1,
          amount: 0,
          date: "2024-01-01",
        });
      }).toThrow();

      expect(() => {
        createTransfer({
          from_wallet_id: testWalletId,
          to_wallet_id: testWalletId + 1,
          amount: -100,
          date: "2024-01-01",
        });
      }).toThrow();
    });
  });

  describe("getTransactions", () => {
    beforeEach(() => {
      // Create multiple test transactions
      testDb.insert(transactionsTable).values([
        {
          type: "income",
          amount: 100000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
          note: "Salary",
        },
        {
          type: "expense",
          amount: 50000,
          date: "2024-01-16",
          wallet_id: testWalletId,
          category_id: testCategoryId,
          note: "Food",
        },
        {
          type: "expense",
          amount: 30000,
          date: "2024-01-17",
          wallet_id: testWalletId,
          category_id: testCategoryId,
          note: "Transport",
        },
      ]);
    });

    it("should return all transactions", () => {
      const transactions = getTransactions();

      expect(transactions).toHaveLength(3);
    });

    it("should return transactions ordered by date descending", () => {
      const transactions = getTransactions();

      expect(transactions[0].date).toBe("2024-01-17");
      expect(transactions[1].date).toBe("2024-01-16");
      expect(transactions[2].date).toBe("2024-01-15");
    });

    it("should filter by type", () => {
      const expenses = getTransactions({ type: "expense" });

      expect(expenses).toHaveLength(2);
      expect(expenses.every((t) => t.type === "expense")).toBe(true);
    });

    it("should filter by wallet_id", () => {
      const walletTransactions = getTransactions({ wallet_id: testWalletId });

      expect(walletTransactions).toHaveLength(3);
    });

    it("should filter by category_id", () => {
      const categoryTransactions = getTransactions({
        category_id: testCategoryId,
      });

      expect(categoryTransactions).toHaveLength(3);
    });

    it("should filter by date range", () => {
      const transactions = getTransactions({
        start_date: "2024-01-16",
        end_date: "2024-01-17",
      });

      expect(transactions).toHaveLength(2);
      expect(transactions[0].date).toBe("2024-01-17");
      expect(transactions[1].date).toBe("2024-01-16");
    });

    it("should apply limit", () => {
      const transactions = getTransactions({ limit: 2 });

      expect(transactions).toHaveLength(2);
    });

    it("should apply limit and offset", () => {
      const transactions = getTransactions({ limit: 1, offset: 1 });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].date).toBe("2024-01-16");
    });
  });

  describe("getTransactionById", () => {
    it("should return transaction when it exists", () => {
      const created = testDb
        .insert(transactionsTable)
        .values({
          type: "income",
          amount: 100000,
          date: "2024-01-01",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        })
        .returning();

      const transaction = getTransactionById(created[0].id);

      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe(created[0].id);
      expect(transaction?.type).toBe("income");
    });

    it("should return null when transaction does not exist", () => {
      const transaction = getTransactionById(999);

      expect(transaction).toBeNull();
    });
  });

  describe("getTransactionsByTransferId", () => {
    it("should return both transactions of a transfer", () => {
      const transfer = createTransfer({
        from_wallet_id: testWalletId,
        to_wallet_id: testWalletId + 1,
        amount: 50000,
        date: "2024-01-01",
      });

      const transactions = getTransactionsByTransferId(transfer.transfer_id);

      expect(transactions).toHaveLength(2);
      expect(
        transactions.every((t) => t.transfer_id === transfer.transfer_id),
      ).toBe(true);
    });

    it("should return empty array for non-existent transfer_id", () => {
      const transactions = getTransactionsByTransferId("non-existent");

      expect(transactions).toEqual([]);
    });
  });

  describe("updateTransaction", () => {
    it("should update transaction amount", () => {
      const created = testDb
        .insert(transactionsTable)
        .values({
          type: "expense",
          amount: 50000,
          date: "2024-01-01",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        })
        .returning();

      const updated = updateTransaction(created[0].id, {
        amount: 75000,
      });

      expect(updated).toBeDefined();
      expect(updated?.amount).toBe(75000);
    });

    it("should update transaction note", () => {
      const created = testDb
        .insert(transactionsTable)
        .values({
          type: "expense",
          amount: 25000,
          date: "2024-01-01",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        })
        .returning();

      const updated = updateTransaction(created[0].id, {
        note: "Updated note",
      });

      expect(updated).toBeDefined();
      expect(updated?.note).toBe("Updated note");
    });

    it("should return null when transaction does not exist", () => {
      const updated = updateTransaction(999, {
        amount: 10000,
      });

      expect(updated).toBeNull();
    });

    it("should throw error when trying to update transfer transaction", () => {
      const transfer = createTransfer({
        from_wallet_id: testWalletId,
        to_wallet_id: testWalletId + 1,
        amount: 50000,
        date: "2024-01-01",
      });

      expect(() => {
        updateTransaction(transfer.from_transaction.id, {
          amount: 10000,
        });
      }).toThrow();
    });
  });

  describe("deleteTransaction", () => {
    it("should delete transaction and return true", () => {
      const created = testDb
        .insert(transactionsTable)
        .values({
          type: "expense",
          amount: 50000,
          date: "2024-01-01",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        })
        .returning();

      const result = deleteTransaction(created[0].id);

      expect(result).toBe(true);
      expect(getTransactionById(created[0].id)).toBeNull();
    });

    it("should return false when transaction does not exist", () => {
      const result = deleteTransaction(999);

      expect(result).toBe(false);
    });

    it("should delete both sides of a transfer when deleting one side", () => {
      const transfer = createTransfer({
        from_wallet_id: testWalletId,
        to_wallet_id: testWalletId + 1,
        amount: 50000,
        date: "2024-01-01",
      });

      const result = deleteTransaction(transfer.from_transaction.id);

      expect(result).toBe(true);
      expect(getTransactionsByTransferId(transfer.transfer_id)).toHaveLength(0);
    });
  });

  describe("deleteTransfer", () => {
    it("should delete both transactions of a transfer", () => {
      const transfer = createTransfer({
        from_wallet_id: testWalletId,
        to_wallet_id: testWalletId + 1,
        amount: 50000,
        date: "2024-01-01",
      });

      const result = deleteTransfer(transfer.transfer_id);

      expect(result).toBe(true);
      expect(getTransactionsByTransferId(transfer.transfer_id)).toHaveLength(0);
    });

    it("should return false for non-existent transfer_id", () => {
      const result = deleteTransfer("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("getTotalIncome", () => {
    it("should return 0 when no income transactions exist", () => {
      const total = getTotalIncome("2024-01-01", "2024-01-31");

      expect(total).toBe(0);
    });

    it("should return total income for date range", () => {
      testDb.insert(transactionsTable).values([
        {
          type: "income",
          amount: 100000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "income",
          amount: 50000,
          date: "2024-01-20",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);

      const total = getTotalIncome("2024-01-01", "2024-01-31");

      expect(total).toBe(150000);
    });

    it("should only include income within date range", () => {
      testDb.insert(transactionsTable).values([
        {
          type: "income",
          amount: 100000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "income",
          amount: 50000,
          date: "2024-02-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);

      const total = getTotalIncome("2024-01-01", "2024-01-31");

      expect(total).toBe(100000);
    });
  });

  describe("getTotalExpenses", () => {
    it("should return 0 when no expense transactions exist", () => {
      const total = getTotalExpenses("2024-01-01", "2024-01-31");

      expect(total).toBe(0);
    });

    it("should return total expenses for date range", () => {
      testDb.insert(transactionsTable).values([
        {
          type: "expense",
          amount: 50000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "expense",
          amount: 30000,
          date: "2024-01-20",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);

      const total = getTotalExpenses("2024-01-01", "2024-01-31");

      expect(total).toBe(80000);
    });
  });

  describe("getSpendingByCategory", () => {
    it("should return spending breakdown by category", () => {
      // Create additional categories
      const transportCategory = testDb
        .insert(categoriesTable)
        .values({
          name: "Transport",
          type: "expense",
        })
        .returning();

      testDb.insert(transactionsTable).values([
        {
          type: "expense",
          amount: 50000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "expense",
          amount: 30000,
          date: "2024-01-16",
          wallet_id: testWalletId,
          category_id: transportCategory[0].id,
        },
        {
          type: "expense",
          amount: 20000,
          date: "2024-01-17",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);

      const spending = getSpendingByCategory("2024-01-01", "2024-01-31");

      expect(spending).toHaveLength(2);

      const food = spending.find((s) => s.name === "Food");
      const transport = spending.find((s) => s.name === "Transport");

      expect(food?.total).toBe(70000);
      expect(transport?.total).toBe(30000);
    });

    it("should order by total descending", () => {
      const spending = getSpendingByCategory("2024-01-01", "2024-01-31");

      expect(spending[0].total).toBeGreaterThanOrEqual(spending[1]?.total || 0);
    });
  });

  describe("getNetWorth", () => {
    it("should return 0 when no transactions exist", () => {
      const netWorth = getNetWorth();

      expect(netWorth).toBe(0);
    });

    it("should calculate net worth correctly", () => {
      testDb.insert(transactionsTable).values([
        {
          type: "income",
          amount: 100000,
          date: "2024-01-15",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "expense",
          amount: 40000,
          date: "2024-01-16",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);

      const netWorth = getNetWorth();

      expect(netWorth).toBe(60000);
    });

    it("should handle transfers correctly (net zero)", () => {
      createTransfer({
        from_wallet_id: testWalletId,
        to_wallet_id: testWalletId + 1,
        amount: 50000,
        date: "2024-01-01",
      });

      const netWorth = getNetWorth();

      expect(netWorth).toBe(0);
    });
  });

  describe("countTransactions", () => {
    it("should return 0 when no transactions exist", () => {
      expect(countTransactions()).toBe(0);
    });

    it("should return correct count", () => {
      testDb.insert(transactionsTable).values([
        {
          type: "income",
          amount: 100000,
          date: "2024-01-15",
          wallet_id: testWalletId,
        },
        {
          type: "expense",
          amount: 50000,
          date: "2024-01-16",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
      ]);

      expect(countTransactions()).toBe(2);
    });

    it("should respect filters in count", () => {
      testDb.insert(transactionsTable).values([
        {
          type: "income",
          amount: 100000,
          date: "2024-01-15",
          wallet_id: testWalletId,
        },
        {
          type: "expense",
          amount: 50000,
          date: "2024-01-16",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "expense",
          amount: 30000,
          date: "2024-01-17",
          wallet_id: testWalletId,
          category_id: testCategoryId,
        },
        {
          type: "income",
          amount: 50000,
          date: "2024-01-18",
          wallet_id: testWalletId,
        },
      ]);

      expect(countTransactions({ type: "expense" })).toBe(2);
      expect(countTransactions({ type: "income" })).toBe(2);
      expect(countTransactions({ wallet_id: testWalletId })).toBe(4);
    });
  });
});
