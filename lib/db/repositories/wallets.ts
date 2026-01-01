import { getDatabase, saveDatabase } from "../index";
import type {
  Wallet,
  CreateWalletInput,
  UpdateWalletInput,
  WalletWithBalance,
} from "../types";
import { walletsTable } from "../schema/wallets.js";
import { transactionsTable } from "../schema/transactions.js";
import { and, eq, sql, desc } from "drizzle-orm";

/**
 * Wallet Repository using Drizzle ORM
 * Handles all database operations for wallets
 */

/**
 * Get all wallets
 */
export function getAllWallets(): Wallet[] {
  const db = getDatabase();
  const result = db.select().from(walletsTable).orderBy(walletsTable.name);
  return result;
}

/**
 * Get a wallet by ID
 */
export function getWalletById(id: number): Wallet | null {
  const db = getDatabase();
  const result = db.select().from(walletsTable).where(eq(walletsTable.id, id));
  return result[0] || null;
}

/**
 * Get a wallet by name
 */
export function getWalletByName(name: string): Wallet | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.name, name));
  return result[0] || null;
}

/**
 * Create a new wallet
 */
export function createWallet(input: CreateWalletInput): Wallet {
  const db = getDatabase();

  const result = db
    .insert(walletsTable)
    .values({
      name: input.name,
    })
    .returning();

  saveDatabase();

  return result[0];
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

  // Build update values dynamically
  const updateValues: Partial<typeof walletsTable.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updateValues.name = input.name;
  }

  const result = db
    .update(walletsTable)
    .set(updateValues)
    .where(eq(walletsTable.id, id))
    .returning();

  saveDatabase();

  return result[0] || null;
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
    const result = db
      .delete(walletsTable)
      .where(eq(walletsTable.id, id))
      .returning({ id: walletsTable.id });

    saveDatabase();
    return result.length > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a wallet exists
 */
export function walletExists(id: number): boolean {
  const db = getDatabase();
  const result = db
    .select({ id: walletsTable.id })
    .from(walletsTable)
    .where(eq(walletsTable.id, id))
    .limit(1);

  return result.length > 0;
}

/**
 * Get all wallets with their calculated balances
 * Balance = sum of income/transfer-in - sum of expense/transfer-out
 */
export function getAllWalletsWithBalances(): WalletWithBalance[] {
  const db = getDatabase();

  const result = db
    .select({
      id: walletsTable.id,
      name: walletsTable.name,
      created_at: walletsTable.created_at,
      updated_at: walletsTable.updated_at,
      balance: sql<number>`
        COALESCE(
          (
            SELECT SUM(
              CASE
                WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount}
                WHEN ${transactionsTable.type} = 'expense' THEN -${transactionsTable.amount}
                WHEN ${transactionsTable.type} = 'transfer' THEN ${transactionsTable.amount}
                WHEN ${transactionsTable.type} = 'savings' THEN -${transactionsTable.amount}
                ELSE 0
              END
            )
            FROM ${transactionsTable}
            WHERE ${transactionsTable.wallet_id} = ${walletsTable.id}
          ),
          0
        )
      `,
    })
    .from(walletsTable)
    .orderBy(walletsTable.name);

  return result as WalletWithBalance[];
}

/**
 * Get wallet balance
 */
export function getWalletBalance(id: number): number {
  const db = getDatabase();

  const result = db
    .select({
      balance: sql<number>`
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
    .from(transactionsTable)
    .where(eq(transactionsTable.wallet_id, id));

  return result[0]?.balance || 0;
}

/**
 * Count total number of wallets
 */
export function countWallets(): number {
  const db = getDatabase();

  const result = db.select({ count: sql<number>`COUNT(*)` }).from(walletsTable);

  return result[0]?.count || 0;
}
