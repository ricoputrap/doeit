import { getDatabase, saveDatabase } from "../index";
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateTransferInput,
  Transfer,
  TransactionFilter,
} from "../types";
import { randomUUID } from "node:crypto";

/**
 * Transaction Repository
 * Handles all database operations for transactions
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
 * Get all transactions with optional filters
 */
export function getTransactions(filter?: TransactionFilter): Transaction[] {
  const db = getDatabase();

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filter?.type) {
    conditions.push("type = ?");
    values.push(filter.type);
  }

  if (filter?.wallet_id) {
    conditions.push("wallet_id = ?");
    values.push(filter.wallet_id);
  }

  if (filter?.category_id) {
    conditions.push("category_id = ?");
    values.push(filter.category_id);
  }

  if (filter?.start_date) {
    conditions.push("date >= ?");
    values.push(filter.start_date);
  }

  if (filter?.end_date) {
    conditions.push("date < ?");
    values.push(filter.end_date);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let query = `SELECT * FROM transactions ${whereClause} ORDER BY date DESC, created_at DESC`;

  if (filter?.limit) {
    query += ` LIMIT ${filter.limit}`;
    if (filter?.offset) {
      query += ` OFFSET ${filter.offset}`;
    }
  }

  const result = db.exec(query, values);
  return resultToArray<Transaction>(result);
}

/**
 * Get a transaction by ID
 */
export function getTransactionById(id: number): Transaction | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM transactions WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Transaction;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Get transactions by transfer ID (returns the pair of transfer transactions)
 */
export function getTransactionsByTransferId(transferId: string): Transaction[] {
  const db = getDatabase();
  const result = db.exec(
    "SELECT * FROM transactions WHERE transfer_id = ? ORDER BY amount DESC",
    [transferId],
  );
  return resultToArray<Transaction>(result);
}

/**
 * Create a new transaction
 */
export function createTransaction(input: CreateTransactionInput): Transaction {
  const db = getDatabase();

  db.run(
    `INSERT INTO transactions (type, amount, date, note, wallet_id, category_id, transfer_id, savings_bucket_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      input.type,
      input.amount,
      input.date,
      input.note || null,
      input.wallet_id,
      input.category_id || null,
      input.transfer_id || null,
      input.savings_bucket_id || null,
    ],
  );

  const id = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  saveDatabase();

  return getTransactionById(id)!;
}

/**
 * Create a transfer (creates two linked transactions atomically)
 * Returns the Transfer object with both transactions
 */
export function createTransfer(input: CreateTransferInput): Transfer {
  const db = getDatabase();

  // Validate wallets are different
  if (input.from_wallet_id === input.to_wallet_id) {
    throw new Error("Source and destination wallets must be different");
  }

  // Validate amount
  if (input.amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }

  const transferId = randomUUID();

  // Create outgoing transaction (from source wallet) - negative amount
  db.run(
    `INSERT INTO transactions (type, amount, date, note, wallet_id, transfer_id, created_at, updated_at)
     VALUES ('transfer', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      -input.amount,
      input.date,
      input.note || null,
      input.from_wallet_id,
      transferId,
    ],
  );

  const fromId = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  // Create incoming transaction (to destination wallet) - positive amount
  db.run(
    `INSERT INTO transactions (type, amount, date, note, wallet_id, transfer_id, created_at, updated_at)
     VALUES ('transfer', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      input.amount,
      input.date,
      input.note || null,
      input.to_wallet_id,
      transferId,
    ],
  );

  const toId = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  saveDatabase();

  return {
    id: transferId,
    from_transaction: getTransactionById(fromId)!,
    to_transaction: getTransactionById(toId)!,
  };
}

/**
 * Update a transaction
 * Note: Transfers should be updated via updateTransfer to maintain consistency
 */
export function updateTransaction(
  id: number,
  input: UpdateTransactionInput,
): Transaction | null {
  const db = getDatabase();

  // Check if transaction exists
  const existing = getTransactionById(id);
  if (!existing) {
    return null;
  }

  // Don't allow updating transfer transactions through this method
  if (existing.type === "transfer") {
    throw new Error(
      "Transfer transactions cannot be updated directly. Use updateTransfer instead.",
    );
  }

  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.type !== undefined) {
    updates.push("type = ?");
    values.push(input.type);
  }

  if (input.amount !== undefined) {
    updates.push("amount = ?");
    values.push(input.amount);
  }

  if (input.date !== undefined) {
    updates.push("date = ?");
    values.push(input.date);
  }

  if (input.note !== undefined) {
    updates.push("note = ?");
    values.push(input.note);
  }

  if (input.wallet_id !== undefined) {
    updates.push("wallet_id = ?");
    values.push(input.wallet_id);
  }

  if (input.category_id !== undefined) {
    updates.push("category_id = ?");
    values.push(input.category_id);
  }

  if (input.savings_bucket_id !== undefined) {
    updates.push("savings_bucket_id = ?");
    values.push(input.savings_bucket_id);
  }

  // Always update updated_at
  updates.push("updated_at = datetime('now')");

  // Add id for WHERE clause
  values.push(id);

  db.run(`UPDATE transactions SET ${updates.join(", ")} WHERE id = ?`, values);

  saveDatabase();

  return getTransactionById(id);
}

/**
 * Delete a transaction
 * Returns true if deleted, false if not found
 */
export function deleteTransaction(id: number): boolean {
  const db = getDatabase();

  const existing = getTransactionById(id);
  if (!existing) {
    return false;
  }

  // If it's a transfer, delete both sides
  if (existing.type === "transfer" && existing.transfer_id) {
    db.run("DELETE FROM transactions WHERE transfer_id = ?", [
      existing.transfer_id,
    ]);
    saveDatabase();
    return true;
  }

  db.run("DELETE FROM transactions WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

/**
 * Delete a transfer by transfer ID
 * Returns true if deleted, false if not found
 */
export function deleteTransfer(transferId: string): boolean {
  const db = getDatabase();

  const transactions = getTransactionsByTransferId(transferId);
  if (transactions.length === 0) {
    return false;
  }

  db.run("DELETE FROM transactions WHERE transfer_id = ?", [transferId]);
  saveDatabase();
  return true;
}

/**
 * Get total income for a date range
 */
export function getTotalIncome(startDate: string, endDate: string): number {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'income'
      AND date >= ?
      AND date < ?
  `,
    [startDate, endDate],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Get total expenses for a date range
 */
export function getTotalExpenses(startDate: string, endDate: string): number {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'expense'
      AND date >= ?
      AND date < ?
  `,
    [startDate, endDate],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Get spending by category for a date range
 */
export function getSpendingByCategory(
  startDate: string,
  endDate: string,
): { category_id: number; category_name: string; total: number }[] {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT
      c.id as category_id,
      c.name as category_name,
      COALESCE(SUM(t.amount), 0) as total
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.type = 'expense'
      AND t.date >= ?
      AND t.date < ?
    WHERE c.type = 'expense'
    GROUP BY c.id, c.name
    HAVING total > 0
    ORDER BY total DESC
  `,
    [startDate, endDate],
  );

  return resultToArray<{
    category_id: number;
    category_name: string;
    total: number;
  }>(result);
}

/**
 * Get net worth (sum of all wallet balances)
 */
export function getNetWorth(): number {
  const db = getDatabase();

  const result = db.exec(`
    SELECT COALESCE(
      SUM(
        CASE
          WHEN type = 'income' THEN amount
          WHEN type = 'expense' THEN -amount
          WHEN type = 'transfer' THEN amount
          WHEN type = 'savings' THEN -amount
          ELSE 0
        END
      ),
      0
    ) as net_worth
    FROM transactions
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Count total number of transactions
 */
export function countTransactions(filter?: TransactionFilter): number {
  const db = getDatabase();

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filter?.type) {
    conditions.push("type = ?");
    values.push(filter.type);
  }

  if (filter?.wallet_id) {
    conditions.push("wallet_id = ?");
    values.push(filter.wallet_id);
  }

  if (filter?.category_id) {
    conditions.push("category_id = ?");
    values.push(filter.category_id);
  }

  if (filter?.start_date) {
    conditions.push("date >= ?");
    values.push(filter.start_date);
  }

  if (filter?.end_date) {
    conditions.push("date < ?");
    values.push(filter.end_date);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = db.exec(
    `SELECT COUNT(*) as count FROM transactions ${whereClause}`,
    values,
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}
