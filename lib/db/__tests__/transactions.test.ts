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

async function setupTestDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (testDb) {
    testDb.close();
  }

  testDb = new SQL.Database();
  testDb.run("PRAGMA foreign_keys = ON");

  // Create wallets table
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

  // Create savings_buckets table
  testDb.run(`
    CREATE TABLE IF NOT EXISTS savings_buckets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
      FOREIGN KEY (savings_bucket_id) REFERENCES savings_buckets(id) ON DELETE RESTRICT
    )
  `);

  // Seed test data
  testDb.run(
    `INSERT INTO wallets (name, created_at, updated_at) VALUES ('Cash', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO wallets (name, created_at, updated_at) VALUES ('Bank', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Food', 'expense', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Transport', 'expense', datetime('now'), datetime('now'))`,
  );
  testDb.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES ('Salary', 'income', datetime('now'), datetime('now'))`,
  );
}

describe("Transaction Repository", () => {
  beforeAll(async () => {
    SQL = await initSqlJs();
  });

  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterAll(() => {
    if (testDb) testDb.close();
  });

  describe("createTransaction", () => {
    it("should create an income transaction", () => {
      const transaction = createTransaction({
        type: "income",
        amount: 5000000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 3,
        note: "Monthly salary",
      });

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(1);
      expect(transaction.type).toBe("income");
      expect(transaction.amount).toBe(5000000);
      expect(transaction.date).toBe("2024-01-15");
      expect(transaction.wallet_id).toBe(1);
      expect(transaction.category_id).toBe(3);
      expect(transaction.note).toBe("Monthly salary");
    });

    it("should create an expense transaction", () => {
      const transaction = createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-16",
        wallet_id: 1,
        category_id: 1,
        note: "Lunch",
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe("expense");
      expect(transaction.amount).toBe(50000);
      expect(transaction.category_id).toBe(1);
    });

    it("should create a transaction without note", () => {
      const transaction = createTransaction({
        type: "expense",
        amount: 25000,
        date: "2024-01-16",
        wallet_id: 1,
        category_id: 1,
      });

      expect(transaction).toBeDefined();
      expect(transaction.note).toBeNull();
    });
  });

  describe("createTransfer", () => {
    it("should create two linked transactions for transfer", () => {
      const transfer = createTransfer({
        from_wallet_id: 1,
        to_wallet_id: 2,
        amount: 100000,
        date: "2024-01-20",
        note: "Move to bank",
      });

      expect(transfer).toBeDefined();
      expect(transfer.id).toBeDefined();
      expect(transfer.from_transaction).toBeDefined();
      expect(transfer.to_transaction).toBeDefined();

      // Check outgoing transaction (negative amount)
      expect(transfer.from_transaction.type).toBe("transfer");
      expect(transfer.from_transaction.amount).toBe(-100000);
      expect(transfer.from_transaction.wallet_id).toBe(1);
      expect(transfer.from_transaction.transfer_id).toBe(transfer.id);

      // Check incoming transaction (positive amount)
      expect(transfer.to_transaction.type).toBe("transfer");
      expect(transfer.to_transaction.amount).toBe(100000);
      expect(transfer.to_transaction.wallet_id).toBe(2);
      expect(transfer.to_transaction.transfer_id).toBe(transfer.id);
    });

    it("should throw error when source and destination wallets are the same", () => {
      expect(() =>
        createTransfer({
          from_wallet_id: 1,
          to_wallet_id: 1,
          amount: 100000,
          date: "2024-01-20",
        }),
      ).toThrow("Source and destination wallets must be different");
    });

    it("should throw error when amount is not positive", () => {
      expect(() =>
        createTransfer({
          from_wallet_id: 1,
          to_wallet_id: 2,
          amount: 0,
          date: "2024-01-20",
        }),
      ).toThrow("Transfer amount must be positive");

      expect(() =>
        createTransfer({
          from_wallet_id: 1,
          to_wallet_id: 2,
          amount: -100,
          date: "2024-01-20",
        }),
      ).toThrow("Transfer amount must be positive");
    });
  });

  describe("getTransactions", () => {
    beforeEach(() => {
      // Create some test transactions
      createTransaction({
        type: "income",
        amount: 5000000,
        date: "2024-01-01",
        wallet_id: 1,
        category_id: 3,
      });
      createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 30000,
        date: "2024-01-20",
        wallet_id: 2,
        category_id: 2,
      });
    });

    it("should return all transactions", () => {
      const transactions = getTransactions();

      expect(transactions).toHaveLength(3);
    });

    it("should return transactions ordered by date descending", () => {
      const transactions = getTransactions();

      expect(transactions[0].date).toBe("2024-01-20");
      expect(transactions[1].date).toBe("2024-01-15");
      expect(transactions[2].date).toBe("2024-01-01");
    });

    it("should filter by type", () => {
      const expenses = getTransactions({ type: "expense" });

      expect(expenses).toHaveLength(2);
      expect(expenses.every((t) => t.type === "expense")).toBe(true);
    });

    it("should filter by wallet_id", () => {
      const walletTransactions = getTransactions({ wallet_id: 1 });

      expect(walletTransactions).toHaveLength(2);
      expect(walletTransactions.every((t) => t.wallet_id === 1)).toBe(true);
    });

    it("should filter by category_id", () => {
      const categoryTransactions = getTransactions({ category_id: 1 });

      expect(categoryTransactions).toHaveLength(1);
      expect(categoryTransactions[0].category_id).toBe(1);
    });

    it("should filter by date range", () => {
      const transactions = getTransactions({
        start_date: "2024-01-10",
        end_date: "2024-01-18",
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].date).toBe("2024-01-15");
    });

    it("should apply limit", () => {
      const transactions = getTransactions({ limit: 2 });

      expect(transactions).toHaveLength(2);
    });

    it("should apply limit and offset", () => {
      const transactions = getTransactions({ limit: 2, offset: 1 });

      expect(transactions).toHaveLength(2);
      expect(transactions[0].date).toBe("2024-01-15");
    });
  });

  describe("getTransactionById", () => {
    it("should return transaction when it exists", () => {
      const created = createTransaction({
        type: "income",
        amount: 100000,
        date: "2024-01-01",
        wallet_id: 1,
      });

      const transaction = getTransactionById(created.id);

      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe(created.id);
    });

    it("should return null when transaction does not exist", () => {
      const transaction = getTransactionById(999);

      expect(transaction).toBeNull();
    });
  });

  describe("getTransactionsByTransferId", () => {
    it("should return both transactions of a transfer", () => {
      const transfer = createTransfer({
        from_wallet_id: 1,
        to_wallet_id: 2,
        amount: 100000,
        date: "2024-01-20",
      });

      const transactions = getTransactionsByTransferId(transfer.id);

      expect(transactions).toHaveLength(2);
      expect(transactions.every((t) => t.transfer_id === transfer.id)).toBe(
        true,
      );
    });

    it("should return empty array for non-existent transfer_id", () => {
      const transactions = getTransactionsByTransferId("non-existent-id");

      expect(transactions).toEqual([]);
    });
  });

  describe("updateTransaction", () => {
    it("should update transaction amount", () => {
      const created = createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });

      const updated = updateTransaction(created.id, { amount: 75000 });

      expect(updated).toBeDefined();
      expect(updated?.amount).toBe(75000);
    });

    it("should update transaction note", () => {
      const created = createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });

      const updated = updateTransaction(created.id, { note: "Updated note" });

      expect(updated).toBeDefined();
      expect(updated?.note).toBe("Updated note");
    });

    it("should return null when transaction does not exist", () => {
      const updated = updateTransaction(999, { amount: 100 });

      expect(updated).toBeNull();
    });

    it("should throw error when trying to update transfer transaction", () => {
      const transfer = createTransfer({
        from_wallet_id: 1,
        to_wallet_id: 2,
        amount: 100000,
        date: "2024-01-20",
      });

      expect(() =>
        updateTransaction(transfer.from_transaction.id, { amount: 50000 }),
      ).toThrow("Transfer transactions cannot be updated directly");
    });
  });

  describe("deleteTransaction", () => {
    it("should delete transaction and return true", () => {
      const created = createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });

      const result = deleteTransaction(created.id);

      expect(result).toBe(true);
      expect(getTransactionById(created.id)).toBeNull();
    });

    it("should return false when transaction does not exist", () => {
      const result = deleteTransaction(999);

      expect(result).toBe(false);
    });

    it("should delete both sides of a transfer when deleting one side", () => {
      const transfer = createTransfer({
        from_wallet_id: 1,
        to_wallet_id: 2,
        amount: 100000,
        date: "2024-01-20",
      });

      const result = deleteTransaction(transfer.from_transaction.id);

      expect(result).toBe(true);
      expect(getTransactionById(transfer.from_transaction.id)).toBeNull();
      expect(getTransactionById(transfer.to_transaction.id)).toBeNull();
    });
  });

  describe("deleteTransfer", () => {
    it("should delete both transactions of a transfer", () => {
      const transfer = createTransfer({
        from_wallet_id: 1,
        to_wallet_id: 2,
        amount: 100000,
        date: "2024-01-20",
      });

      const result = deleteTransfer(transfer.id);

      expect(result).toBe(true);
      expect(getTransactionsByTransferId(transfer.id)).toHaveLength(0);
    });

    it("should return false for non-existent transfer_id", () => {
      const result = deleteTransfer("non-existent-id");

      expect(result).toBe(false);
    });
  });

  describe("getTotalIncome", () => {
    it("should return 0 when no income transactions exist", () => {
      const total = getTotalIncome("2024-01-01", "2024-02-01");

      expect(total).toBe(0);
    });

    it("should return total income for date range", () => {
      createTransaction({
        type: "income",
        amount: 5000000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 3,
      });
      createTransaction({
        type: "income",
        amount: 1000000,
        date: "2024-01-20",
        wallet_id: 1,
        category_id: 3,
      });

      const total = getTotalIncome("2024-01-01", "2024-02-01");

      expect(total).toBe(6000000);
    });

    it("should only include income within date range", () => {
      createTransaction({
        type: "income",
        amount: 5000000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 3,
      });
      createTransaction({
        type: "income",
        amount: 1000000,
        date: "2024-02-15",
        wallet_id: 1,
        category_id: 3,
      });

      const total = getTotalIncome("2024-01-01", "2024-02-01");

      expect(total).toBe(5000000);
    });
  });

  describe("getTotalExpenses", () => {
    it("should return 0 when no expense transactions exist", () => {
      const total = getTotalExpenses("2024-01-01", "2024-02-01");

      expect(total).toBe(0);
    });

    it("should return total expenses for date range", () => {
      createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 30000,
        date: "2024-01-20",
        wallet_id: 1,
        category_id: 2,
      });

      const total = getTotalExpenses("2024-01-01", "2024-02-01");

      expect(total).toBe(80000);
    });
  });

  describe("getSpendingByCategory", () => {
    it("should return spending breakdown by category", () => {
      createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 30000,
        date: "2024-01-16",
        wallet_id: 1,
        category_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 20000,
        date: "2024-01-17",
        wallet_id: 1,
        category_id: 2,
      });

      const spending = getSpendingByCategory("2024-01-01", "2024-02-01");

      expect(spending).toHaveLength(2);

      const food = spending.find((s) => s.category_name === "Food");
      const transport = spending.find((s) => s.category_name === "Transport");

      expect(food?.total).toBe(80000);
      expect(transport?.total).toBe(20000);
    });

    it("should order by total descending", () => {
      createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 100000,
        date: "2024-01-17",
        wallet_id: 1,
        category_id: 2,
      });

      const spending = getSpendingByCategory("2024-01-01", "2024-02-01");

      expect(spending[0].category_name).toBe("Transport");
      expect(spending[1].category_name).toBe("Food");
    });
  });

  describe("getNetWorth", () => {
    it("should return 0 when no transactions exist", () => {
      const netWorth = getNetWorth();

      expect(netWorth).toBe(0);
    });

    it("should calculate net worth correctly", () => {
      createTransaction({
        type: "income",
        amount: 5000000,
        date: "2024-01-01",
        wallet_id: 1,
        category_id: 3,
      });
      createTransaction({
        type: "expense",
        amount: 500000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });

      const netWorth = getNetWorth();

      expect(netWorth).toBe(4500000);
    });

    it("should handle transfers correctly (net zero)", () => {
      createTransaction({
        type: "income",
        amount: 1000000,
        date: "2024-01-01",
        wallet_id: 1,
        category_id: 3,
      });

      createTransfer({
        from_wallet_id: 1,
        to_wallet_id: 2,
        amount: 500000,
        date: "2024-01-15",
      });

      const netWorth = getNetWorth();

      // Transfer should not affect net worth (money just moved between wallets)
      expect(netWorth).toBe(1000000);
    });
  });

  describe("countTransactions", () => {
    it("should return 0 when no transactions exist", () => {
      expect(countTransactions()).toBe(0);
    });

    it("should return correct count", () => {
      createTransaction({
        type: "income",
        amount: 100000,
        date: "2024-01-01",
        wallet_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });

      expect(countTransactions()).toBe(2);
    });

    it("should respect filters in count", () => {
      createTransaction({
        type: "income",
        amount: 100000,
        date: "2024-01-01",
        wallet_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 50000,
        date: "2024-01-15",
        wallet_id: 1,
        category_id: 1,
      });
      createTransaction({
        type: "expense",
        amount: 30000,
        date: "2024-01-20",
        wallet_id: 1,
        category_id: 2,
      });

      expect(countTransactions({ type: "expense" })).toBe(2);
      expect(countTransactions({ type: "income" })).toBe(1);
    });
  });
});
