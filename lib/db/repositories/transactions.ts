import { getDatabase, saveDatabase } from "../index";
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  CreateTransferInput,
  Transfer,
  TransactionFilter,
} from "../types";
import { transactionsTable } from "../schema/transactions.js";
import { walletsTable } from "../schema/wallets.js";
import { categoriesTable } from "../schema/categories.js";
import { savingsBucketsTable } from "../schema/savings-buckets.js";
import { eq, and, sql, desc, gt, lt } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * Transaction Repository using Drizzle ORM
 * Handles all database operations for transactions
 */

/**
 * Get all transactions with optional filters
 */
export function getTransactions(filter?: TransactionFilter): Transaction[] {
  const db = getDatabase();

  let query = db.select().from(transactionsTable);

  const conditions = [];

  if (filter?.type) {
    conditions.push(eq(transactionsTable.type, filter.type));
  }

  if (filter?.wallet_id) {
    conditions.push(eq(transactionsTable.wallet_id, filter.wallet_id));
  }

  if (filter?.category_id) {
    conditions.push(eq(transactionsTable.category_id, filter.category_id));
  }

  if (filter?.start_date) {
    conditions.push(sql`${transactionsTable.date} >= ${filter.start_date}`);
  }

  if (filter?.end_date) {
    conditions.push(sql`${transactionsTable.date} < ${filter.end_date}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Order by date DESC, then created_at DESC
  query = query.orderBy(
    desc(transactionsTable.date),
    desc(transactionsTable.created_at),
  );

  if (filter?.limit) {
    query = query.limit(filter.limit);
    if (filter?.offset) {
      query = query.offset(filter.offset);
    }
  }

  const result = query;
  return result;
}

/**
 * Get a transaction by ID
 */
export function getTransactionById(id: number): Transaction | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id));
  return result[0] || null;
}

/**
 * Get transactions by transfer ID (returns the pair of transfer transactions)
 */
export function getTransactionsByTransferId(transferId: string): Transaction[] {
  const db = getDatabase();
  const result = db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.transfer_id, transferId))
    .orderBy(desc(transactionsTable.amount));
  return result;
}

/**
 * Create a new transaction
 */
export function createTransaction(input: CreateTransactionInput): Transaction {
  const db = getDatabase();

  const result = db
    .insert(transactionsTable)
    .values({
      type: input.type,
      amount: input.amount,
      date: input.date,
      note: input.note || null,
      wallet_id: input.wallet_id,
      category_id: input.category_id || null,
      transfer_id: input.transfer_id || null,
      savings_bucket_id: input.savings_bucket_id || null,
    })
    .returning();

  saveDatabase();

  return result[0];
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
  const fromResult = db
    .insert(transactionsTable)
    .values({
      type: "transfer",
      amount: -input.amount,
      date: input.date,
      note: input.note || null,
      wallet_id: input.from_wallet_id,
      transfer_id: transferId,
    })
    .returning();

  // Create incoming transaction (to destination wallet) - positive amount
  const toResult = db
    .insert(transactionsTable)
    .values({
      type: "transfer",
      amount: input.amount,
      date: input.date,
      note: input.note || null,
      wallet_id: input.to_wallet_id,
      transfer_id: transferId,
    })
    .returning();

  saveDatabase();

  return {
    id: transferId,
    from_transaction: fromResult[0],
    to_transaction: toResult[0],
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

  // Build update values dynamically
  const updateValues: Partial<typeof transactionsTable.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (input.type !== undefined) {
    updateValues.type = input.type;
  }

  if (input.amount !== undefined) {
    updateValues.amount = input.amount;
  }

  if (input.date !== undefined) {
    updateValues.date = input.date;
  }

  if (input.note !== undefined) {
    updateValues.note = input.note;
  }

  if (input.wallet_id !== undefined) {
    updateValues.wallet_id = input.wallet_id;
  }

  if (input.category_id !== undefined) {
    updateValues.category_id = input.category_id;
  }

  if (input.savings_bucket_id !== undefined) {
    updateValues.savings_bucket_id = input.savings_bucket_id;
  }

  const result = db
    .update(transactionsTable)
    .set(updateValues)
    .where(eq(transactionsTable.id, id))
    .returning();

  saveDatabase();

  return result[0] || null;
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
    const result = db
      .delete(transactionsTable)
      .where(eq(transactionsTable.transfer_id, existing.transfer_id))
      .returning({ id: transactionsTable.id });
    saveDatabase();
    return result.length > 0;
  }

  const result = db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, id))
    .returning({ id: transactionsTable.id });

  saveDatabase();
  return result.length > 0;
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

  const result = db
    .delete(transactionsTable)
    .where(eq(transactionsTable.transfer_id, transferId))
    .returning({ id: transactionsTable.id });

  saveDatabase();
  return result.length > 0;
}

/**
 * Get total income for a date range
 */
export function getTotalIncome(startDate: string, endDate: string): number {
  const db = getDatabase();

  const result = db
    .select({
      total: sql<number>`
        COALESCE(SUM(${transactionsTable.amount}), 0)
      `,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "income"),
        sql`${transactionsTable.date} >= ${startDate}`,
        sql`${transactionsTable.date} < ${endDate}`,
      ),
    );

  return result[0]?.total || 0;
}

/**
 * Get total expenses for a date range
 */
export function getTotalExpenses(startDate: string, endDate: string): number {
  const db = getDatabase();

  const result = db
    .select({
      total: sql<number>`
        COALESCE(SUM(${transactionsTable.amount}), 0)
      `,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "expense"),
        sql`${transactionsTable.date} >= ${startDate}`,
        sql`${transactionsTable.date} < ${endDate}`,
      ),
    );

  return result[0]?.total || 0;
}

/**
 * Get spending by category for a date range
 */
export function getSpendingByCategory(
  startDate: string,
  endDate: string,
): { category_id: number; category_name: string; total: number }[] {
  const db = getDatabase();

  const result = db
    .select({
      category_id: categoriesTable.id,
      category_name: categoriesTable.name,
      total: sql<number>`
        COALESCE(SUM(${transactionsTable.amount}), 0)
      `,
    })
    .from(categoriesTable)
    .leftJoin(
      transactionsTable,
      and(
        eq(categoriesTable.id, transactionsTable.category_id),
        eq(transactionsTable.type, "expense"),
        sql`${transactionsTable.date} >= ${startDate}`,
        sql`${transactionsTable.date} < ${endDate}`,
      ),
    )
    .where(eq(categoriesTable.type, "expense"))
    .groupBy(categoriesTable.id, categoriesTable.name)
    .having(sql`total > 0`)
    .orderBy(desc(sql`total`));

  return result as {
    category_id: number;
    category_name: string;
    total: number;
  }[];
}

/**
 * Get net worth (sum of all wallet balances)
 */
export function getNetWorth(): number {
  const db = getDatabase();

  const result = db
    .select({
      net_worth: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount}
              WHEN ${transactionsTable.type} = 'expense' THEN -${transactionsTable.amount}
              WHEN ${transactionsTable.type} = 'transfer' THEN ${transactionsTable.amount}
              WHEN ${transactionsTable.type} = 'savings' THEN -${transactionsTable.amount}
              ELSE 0
            END
          ),
          0
        )
      `,
    })
    .from(transactionsTable);

  return result[0]?.net_worth || 0;
}

/**
 * Count total number of transactions
 */
export function countTransactions(filter?: TransactionFilter): number {
  const db = getDatabase();

  let query = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactionsTable);

  const conditions = [];

  if (filter?.type) {
    conditions.push(eq(transactionsTable.type, filter.type));
  }

  if (filter?.wallet_id) {
    conditions.push(eq(transactionsTable.wallet_id, filter.wallet_id));
  }

  if (filter?.category_id) {
    conditions.push(eq(transactionsTable.category_id, filter.category_id));
  }

  if (filter?.start_date) {
    conditions.push(sql`${transactionsTable.date} >= ${filter.start_date}`);
  }

  if (filter?.end_date) {
    conditions.push(sql`${transactionsTable.date} < ${filter.end_date}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = query;

  return result[0]?.count || 0;
}
