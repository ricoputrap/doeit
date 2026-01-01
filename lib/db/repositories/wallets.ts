import { getDatabase, saveDatabase } from "../index";
import type {
  Wallet,
  CreateWalletInput,
  UpdateWalletInput,
  WalletWithBalance,
} from "../types";

/**
 * Wallet Repository
 * Handles all database operations for wallets
 */

/**
 * Helper to convert sql.js result to array of objects
 */
function resultToArray<T>(result: any[]): T[] {
  if (!result || result.length === 0) return [];
  const [queryResult] = result;
  if (!queryResult) return [];

  const { columns, values } = queryResult;
  return values.map((row: any[]) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx];
    });
    return obj as T;
  });
}

/**
 * Get all wallets
 */
export function getAllWallets(): Wallet[] {
  const db = getDatabase();
  const result = db.exec("SELECT * FROM wallets ORDER BY name");
  return resultToArray<Wallet>(result);
}

/**
 * Get a wallet by ID
 */
export function getWalletById(id: number): Wallet | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM wallets WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Wallet;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Get a wallet by name
 */
export function getWalletByName(name: string): Wallet | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM wallets WHERE name = ?");
  stmt.bind([name]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Wallet;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Create a new wallet
 */
export function createWallet(input: CreateWalletInput): Wallet {
  const db = getDatabase();

  db.run(
    `INSERT INTO wallets (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`,
    [input.name],
  );

  const id = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  saveDatabase();

  return getWalletById(id)!;
}

/**
 * Update a wallet
 */
export function updateWallet(
  id: number,
  input: UpdateWalletInput,
): Wallet | null {
  const db = getDatabase();

  // Check if wallet exists
  const existing = getWalletById(id);
  if (!existing) {
    return null;
  }

  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }

  // Always update updated_at
  updates.push("updated_at = datetime('now')");

  // Add id for WHERE clause
  values.push(id);

  db.run(`UPDATE wallets SET ${updates.join(", ")} WHERE id = ?`, values);

  saveDatabase();

  return getWalletById(id);
}

/**
 * Delete a wallet
 * Returns true if deleted, false if not found
 * Throws error if wallet has transactions (due to foreign key constraint)
 */
export function deleteWallet(id: number): boolean {
  const db = getDatabase();

  // Check if wallet exists first
  const existing = getWalletById(id);
  if (!existing) {
    return false;
  }

  try {
    db.run("DELETE FROM wallets WHERE id = ?", [id]);
    saveDatabase();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a wallet exists
 */
export function walletExists(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare("SELECT 1 FROM wallets WHERE id = ?");
  stmt.bind([id]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

/**
 * Get all wallets with their calculated balances
 * Balance = sum of income/transfer-in - sum of expense/transfer-out
 */
export function getAllWalletsWithBalances(): WalletWithBalance[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT
      w.*,
      COALESCE(
        (
          SELECT SUM(
            CASE
              WHEN t.type = 'income' THEN t.amount
              WHEN t.type = 'expense' THEN -t.amount
              WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount
              WHEN t.type = 'transfer' AND t.amount < 0 THEN t.amount
              WHEN t.type = 'savings' THEN -t.amount
              ELSE 0
            END
          )
          FROM transactions t
          WHERE t.wallet_id = w.id
        ),
        0
      ) as balance
    FROM wallets w
    ORDER BY w.name
  `);

  return resultToArray<WalletWithBalance>(result);
}

/**
 * Get wallet balance
 */
export function getWalletBalance(id: number): number {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT COALESCE(
      SUM(
        CASE
          WHEN type = 'income' THEN amount
          WHEN type = 'expense' THEN -amount
          WHEN type = 'transfer' AND amount > 0 THEN amount
          WHEN type = 'transfer' AND amount < 0 THEN amount
          WHEN type = 'savings' THEN -amount
          ELSE 0
        END
      ),
      0
    ) as balance
    FROM transactions
    WHERE wallet_id = ?
  `,
    [id],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Count total number of wallets
 */
export function countWallets(): number {
  const db = getDatabase();

  const result = db.exec("SELECT COUNT(*) as count FROM wallets");

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}
