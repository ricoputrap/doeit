import { getDatabase, saveDatabase } from "../index";
import type {
  SavingsBucket,
  CreateSavingsBucketInput,
  UpdateSavingsBucketInput,
} from "../types";
import { savingsBucketsTable } from "../schema/savings-buckets.js";
import { transactionsTable } from "../schema/transactions.js";
import { eq, sql } from "drizzle-orm";

/**
 * Savings Bucket Repository using Drizzle ORM
 * Handles all database operations for savings buckets
 */

/**
 * Get all savings buckets
 */
export function getAllSavingsBuckets(): SavingsBucket[] {
  const db = getDatabase();
  const result = db
    .select()
    .from(savingsBucketsTable)
    .orderBy(savingsBucketsTable.name);
  return result;
}

/**
 * Get a savings bucket by ID
 */
export function getSavingsBucketById(id: number): SavingsBucket | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(savingsBucketsTable)
    .where(eq(savingsBucketsTable.id, id));
  return result[0] || null;
}

/**
 * Get a savings bucket by name
 */
export function getSavingsBucketByName(name: string): SavingsBucket | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(savingsBucketsTable)
    .where(eq(savingsBucketsTable.name, name));
  return result[0] || null;
}

/**
 * Create a new savings bucket
 */
export function createSavingsBucket(
  input: CreateSavingsBucketInput,
): SavingsBucket {
  const db = getDatabase();

  const result = db
    .insert(savingsBucketsTable)
    .values({
      name: input.name,
    })
    .returning();

  saveDatabase();

  return result[0];
}

/**
 * Update a savings bucket
 */
export function updateSavingsBucket(
  id: number,
  input: UpdateSavingsBucketInput,
): SavingsBucket | null {
  const db = getDatabase();

  // Check if savings bucket exists
  const existing = getSavingsBucketById(id);
  if (!existing) {
    return null;
  }

  // Build update values dynamically
  const updateValues: Partial<typeof savingsBucketsTable.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updateValues.name = input.name;
  }

  const result = db
    .update(savingsBucketsTable)
    .set(updateValues)
    .where(eq(savingsBucketsTable.id, id))
    .returning();

  saveDatabase();

  return result[0] || null;
}

/**
 * Delete a savings bucket
 * Returns true if deleted, false if not found
 * Throws error if bucket has transactions (due to foreign key constraint)
 */
export function deleteSavingsBucket(id: number): boolean {
  const db = getDatabase();

  // Check if savings bucket exists first
  const existing = getSavingsBucketById(id);
  if (!existing) {
    return false;
  }

  try {
    const result = db
      .delete(savingsBucketsTable)
      .where(eq(savingsBucketsTable.id, id))
      .returning({ id: savingsBucketsTable.id });

    saveDatabase();
    return result.length > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a savings bucket exists
 */
export function savingsBucketExists(id: number): boolean {
  const db = getDatabase();
  const result = db
    .select({ id: savingsBucketsTable.id })
    .from(savingsBucketsTable)
    .where(eq(savingsBucketsTable.id, id))
    .limit(1);

  return result.length > 0;
}

/**
 * Get savings bucket balance (total savings allocated to this bucket)
 */
export function getSavingsBucketBalance(id: number): number {
  const db = getDatabase();

  const result = db
    .select({
      balance: sql<number>`
        COALESCE(
          SUM(${transactionsTable.amount}),
          0
        )
      `,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.savings_bucket_id, id));

  return result[0]?.balance || 0;
}

/**
 * Get all savings buckets with their calculated balances
 */
export function getAllSavingsBucketsWithBalances(): (SavingsBucket & {
  balance: number;
})[] {
  const db = getDatabase();

  const result = db
    .select({
      id: savingsBucketsTable.id,
      name: savingsBucketsTable.name,
      created_at: savingsBucketsTable.created_at,
      updated_at: savingsBucketsTable.updated_at,
      balance: sql<number>`
        COALESCE(
          (
            SELECT SUM(${transactionsTable.amount})
            FROM ${transactionsTable}
            WHERE ${transactionsTable.savings_bucket_id} = ${savingsBucketsTable.id}
              AND ${transactionsTable.type} = 'savings'
          ),
          0
        )
      `,
    })
    .from(savingsBucketsTable)
    .orderBy(savingsBucketsTable.name);

  return result as (SavingsBucket & { balance: number })[];
}

/**
 * Count total number of savings buckets
 */
export function countSavingsBuckets(): number {
  const db = getDatabase();

  const result = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(savingsBucketsTable);

  return result[0]?.count || 0;
}
