import { getDatabase, saveDatabase } from "../index";
import type {
  SavingsBucket,
  CreateSavingsBucketInput,
  UpdateSavingsBucketInput,
} from "../types";

/**
 * Savings Bucket Repository
 * Handles all database operations for savings buckets
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
 * Get all savings buckets
 */
export function getAllSavingsBuckets(): SavingsBucket[] {
  const db = getDatabase();
  const result = db.exec("SELECT * FROM savings_buckets ORDER BY name");
  return resultToArray<SavingsBucket>(result);
}

/**
 * Get a savings bucket by ID
 */
export function getSavingsBucketById(id: number): SavingsBucket | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM savings_buckets WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as SavingsBucket;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Get a savings bucket by name
 */
export function getSavingsBucketByName(name: string): SavingsBucket | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM savings_buckets WHERE name = ?");
  stmt.bind([name]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as SavingsBucket;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Create a new savings bucket
 */
export function createSavingsBucket(
  input: CreateSavingsBucketInput,
): SavingsBucket {
  const db = getDatabase();

  db.run(
    `INSERT INTO savings_buckets (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`,
    [input.name],
  );

  const id = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  saveDatabase();

  return getSavingsBucketById(id)!;
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

  db.run(
    `UPDATE savings_buckets SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );

  saveDatabase();

  return getSavingsBucketById(id);
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
    db.run("DELETE FROM savings_buckets WHERE id = ?", [id]);
    saveDatabase();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a savings bucket exists
 */
export function savingsBucketExists(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare("SELECT 1 FROM savings_buckets WHERE id = ?");
  stmt.bind([id]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

/**
 * Get savings bucket balance (total savings allocated to this bucket)
 */
export function getSavingsBucketBalance(id: number): number {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT COALESCE(SUM(amount), 0) as balance
    FROM transactions
    WHERE savings_bucket_id = ?
      AND type = 'savings'
  `,
    [id],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Get all savings buckets with their calculated balances
 */
export function getAllSavingsBucketsWithBalances(): (SavingsBucket & {
  balance: number;
})[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT
      sb.*,
      COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.savings_bucket_id = sb.id
            AND t.type = 'savings'
        ),
        0
      ) as balance
    FROM savings_buckets sb
    ORDER BY sb.name
  `);

  return resultToArray<SavingsBucket & { balance: number }>(result);
}

/**
 * Count total number of savings buckets
 */
export function countSavingsBuckets(): number {
  const db = getDatabase();

  const result = db.exec("SELECT COUNT(*) as count FROM savings_buckets");

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}
