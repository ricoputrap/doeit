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
  getAllWallets,
  getWalletById,
  getWalletByName,
  createWallet,
  updateWallet,
  deleteWallet,
  walletExists,
  getAllWalletsWithBalances,
  getWalletBalance,
  countWallets,
} from "../repositories/wallets";

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

  // Create transactions table for balance tests
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
      FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE RESTRICT
    )
  `);
}

describe("Wallet Repository", () => {
  beforeAll(async () => {
    SQL = await initSqlJs();
  });

  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterAll(() => {
    if (testDb) testDb.close();
  });

  describe("createWallet", () => {
    it("should create a new wallet", () => {
      const wallet = createWallet({ name: "Cash" });

      expect(wallet).toBeDefined();
      expect(wallet.id).toBe(1);
      expect(wallet.name).toBe("Cash");
      expect(wallet.created_at).toBeDefined();
      expect(wallet.updated_at).toBeDefined();
    });

    it("should throw error when creating wallet with duplicate name", () => {
      createWallet({ name: "Cash" });

      expect(() => createWallet({ name: "Cash" })).toThrow();
    });
  });

  describe("getAllWallets", () => {
    it("should return empty array when no wallets exist", () => {
      const wallets = getAllWallets();

      expect(wallets).toEqual([]);
    });

    it("should return all wallets ordered by name", () => {
      createWallet({ name: "Zebra Wallet" });
      createWallet({ name: "Alpha Wallet" });
      createWallet({ name: "Beta Wallet" });

      const wallets = getAllWallets();

      expect(wallets).toHaveLength(3);
      expect(wallets[0].name).toBe("Alpha Wallet");
      expect(wallets[1].name).toBe("Beta Wallet");
      expect(wallets[2].name).toBe("Zebra Wallet");
    });
  });

  describe("getWalletById", () => {
    it("should return wallet when it exists", () => {
      const created = createWallet({ name: "Cash" });

      const wallet = getWalletById(created.id);

      expect(wallet).toBeDefined();
      expect(wallet?.id).toBe(created.id);
      expect(wallet?.name).toBe("Cash");
    });

    it("should return null when wallet does not exist", () => {
      const wallet = getWalletById(999);

      expect(wallet).toBeNull();
    });
  });

  describe("getWalletByName", () => {
    it("should return wallet when it exists", () => {
      createWallet({ name: "Cash" });

      const wallet = getWalletByName("Cash");

      expect(wallet).toBeDefined();
      expect(wallet?.name).toBe("Cash");
    });

    it("should return null when wallet does not exist", () => {
      const wallet = getWalletByName("NonExistent");

      expect(wallet).toBeNull();
    });
  });

  describe("updateWallet", () => {
    it("should update wallet name", () => {
      const created = createWallet({ name: "Cash" });

      const updated = updateWallet(created.id, { name: "Petty Cash" });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Petty Cash");
    });

    it("should return null when wallet does not exist", () => {
      const updated = updateWallet(999, { name: "Test" });

      expect(updated).toBeNull();
    });

    it("should update updated_at timestamp", () => {
      const created = createWallet({ name: "Cash" });

      const updated = updateWallet(created.id, { name: "New Name" });

      expect(updated).toBeDefined();
      expect(updated?.updated_at).toBeDefined();
    });
  });

  describe("deleteWallet", () => {
    it("should delete wallet and return true", () => {
      const created = createWallet({ name: "Cash" });

      const result = deleteWallet(created.id);

      expect(result).toBe(true);
      expect(getWalletById(created.id)).toBeNull();
    });

    it("should return false when wallet does not exist", () => {
      const result = deleteWallet(999);

      expect(result).toBe(false);
    });

    it("should throw error when wallet has transactions", () => {
      const wallet = createWallet({ name: "Cash" });

      // Create a transaction for this wallet
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('income', 100000, '2024-01-01', ?, datetime('now'), datetime('now'))`,
        [wallet.id],
      );

      expect(() => deleteWallet(wallet.id)).toThrow();
    });
  });

  describe("walletExists", () => {
    it("should return true when wallet exists", () => {
      const created = createWallet({ name: "Cash" });

      expect(walletExists(created.id)).toBe(true);
    });

    it("should return false when wallet does not exist", () => {
      expect(walletExists(999)).toBe(false);
    });
  });

  describe("countWallets", () => {
    it("should return 0 when no wallets exist", () => {
      expect(countWallets()).toBe(0);
    });

    it("should return correct count", () => {
      createWallet({ name: "Cash" });
      createWallet({ name: "Bank" });
      createWallet({ name: "E-Wallet" });

      expect(countWallets()).toBe(3);
    });
  });

  describe("getWalletBalance", () => {
    it("should return 0 for wallet with no transactions", () => {
      const wallet = createWallet({ name: "Cash" });

      expect(getWalletBalance(wallet.id)).toBe(0);
    });

    it("should calculate balance correctly with income", () => {
      const wallet = createWallet({ name: "Cash" });

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('income', 100000, '2024-01-01', ?, datetime('now'), datetime('now'))`,
        [wallet.id],
      );

      expect(getWalletBalance(wallet.id)).toBe(100000);
    });

    it("should calculate balance correctly with expenses", () => {
      const wallet = createWallet({ name: "Cash" });

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('income', 100000, '2024-01-01', ?, datetime('now'), datetime('now'))`,
        [wallet.id],
      );

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('expense', 30000, '2024-01-02', ?, datetime('now'), datetime('now'))`,
        [wallet.id],
      );

      expect(getWalletBalance(wallet.id)).toBe(70000);
    });
  });

  describe("getAllWalletsWithBalances", () => {
    it("should return wallets with their balances", () => {
      const wallet1 = createWallet({ name: "Cash" });
      const wallet2 = createWallet({ name: "Bank" });

      // Add income to wallet1
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('income', 100000, '2024-01-01', ?, datetime('now'), datetime('now'))`,
        [wallet1.id],
      );

      // Add income and expense to wallet2
      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('income', 200000, '2024-01-01', ?, datetime('now'), datetime('now'))`,
        [wallet2.id],
      );

      testDb.run(
        `INSERT INTO transactions (type, amount, date, wallet_id, created_at, updated_at)
         VALUES ('expense', 50000, '2024-01-02', ?, datetime('now'), datetime('now'))`,
        [wallet2.id],
      );

      const walletsWithBalances = getAllWalletsWithBalances();

      expect(walletsWithBalances).toHaveLength(2);

      // Ordered by name: Bank, Cash
      const bankWallet = walletsWithBalances.find((w) => w.name === "Bank");
      const cashWallet = walletsWithBalances.find((w) => w.name === "Cash");

      expect(bankWallet?.balance).toBe(150000);
      expect(cashWallet?.balance).toBe(100000);
    });
  });
});
