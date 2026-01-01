import { getDatabase, saveDatabase } from "../index";
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetFilter,
  BudgetWithActual,
} from "../types";

/**
 * Budget Repository
 * Handles all database operations for budgets
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
 * Get all budgets with optional filters
 */
export function getBudgets(filter?: BudgetFilter): Budget[] {
  const db = getDatabase();

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filter?.month) {
    conditions.push("month = ?");
    values.push(filter.month);
  }

  if (filter?.category_id) {
    conditions.push("category_id = ?");
    values.push(filter.category_id);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = db.exec(
    `SELECT * FROM budgets ${whereClause} ORDER BY month DESC`,
    values,
  );

  return resultToArray<Budget>(result);
}

/**
 * Get a budget by ID
 */
export function getBudgetById(id: number): Budget | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM budgets WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Budget;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Get a budget by month and category
 */
export function getBudgetByMonthAndCategory(
  month: string,
  categoryId: number,
): Budget | null {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM budgets WHERE month = ? AND category_id = ?",
  );
  stmt.bind([month, categoryId]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Budget;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Create a new budget
 */
export function createBudget(input: CreateBudgetInput): Budget {
  const db = getDatabase();

  db.run(
    `INSERT INTO budgets (month, category_id, limit_amount, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [input.month, input.category_id, input.limit_amount],
  );

  const id = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  saveDatabase();

  return getBudgetById(id)!;
}

/**
 * Update a budget (or create if it doesn't exist - upsert)
 */
export function upsertBudget(input: CreateBudgetInput): Budget {
  const existing = getBudgetByMonthAndCategory(input.month, input.category_id);

  if (existing) {
    return updateBudget(existing.id, { limit_amount: input.limit_amount })!;
  }

  return createBudget(input);
}

/**
 * Update a budget by ID
 */
export function updateBudget(
  id: number,
  input: UpdateBudgetInput,
): Budget | null {
  const db = getDatabase();

  // Check if budget exists
  const existing = getBudgetById(id);
  if (!existing) {
    return null;
  }

  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.limit_amount !== undefined) {
    updates.push("limit_amount = ?");
    values.push(input.limit_amount);
  }

  // Always update updated_at
  updates.push("updated_at = datetime('now')");

  // Add id for WHERE clause
  values.push(id);

  db.run(`UPDATE budgets SET ${updates.join(", ")} WHERE id = ?`, values);

  saveDatabase();

  return getBudgetById(id);
}

/**
 * Delete a budget
 * Returns true if deleted, false if not found
 */
export function deleteBudget(id: number): boolean {
  const db = getDatabase();

  // Check if budget exists first
  const existing = getBudgetById(id);
  if (!existing) {
    return false;
  }

  db.run("DELETE FROM budgets WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

/**
 * Delete a budget by month and category
 * Returns true if deleted, false if not found
 */
export function deleteBudgetByMonthAndCategory(
  month: string,
  categoryId: number,
): boolean {
  const db = getDatabase();

  const existing = getBudgetByMonthAndCategory(month, categoryId);
  if (!existing) {
    return false;
  }

  db.run("DELETE FROM budgets WHERE month = ? AND category_id = ?", [
    month,
    categoryId,
  ]);
  saveDatabase();
  return true;
}

/**
 * Get all budgets for a month with actual spending and remaining amounts
 */
export function getBudgetsWithActual(month: string): BudgetWithActual[] {
  const db = getDatabase();

  // Calculate the end of the month for date filtering
  // Month is stored as YYYY-MM-01, so we need to get the first day of next month
  const [year, monthNum] = month.split("-").map(Number);
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const result = db.exec(
    `
    SELECT
      b.*,
      c.name as category_name,
      COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category_id = b.category_id
            AND t.type = 'expense'
            AND t.date >= b.month
            AND t.date < ?
        ),
        0
      ) as actual_spent,
      b.limit_amount - COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category_id = b.category_id
            AND t.type = 'expense'
            AND t.date >= b.month
            AND t.date < ?
        ),
        0
      ) as remaining
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.month = ?
    ORDER BY c.name
  `,
    [endDate, endDate, month],
  );

  return resultToArray<BudgetWithActual>(result);
}

/**
 * Get a single budget with actual spending
 */
export function getBudgetWithActual(id: number): BudgetWithActual | null {
  const db = getDatabase();

  const budget = getBudgetById(id);
  if (!budget) {
    return null;
  }

  // Calculate end date for the budget month
  const [year, monthNum] = budget.month.split("-").map(Number);
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const result = db.exec(
    `
    SELECT
      b.*,
      c.name as category_name,
      COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category_id = b.category_id
            AND t.type = 'expense'
            AND t.date >= b.month
            AND t.date < ?
        ),
        0
      ) as actual_spent,
      b.limit_amount - COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category_id = b.category_id
            AND t.type = 'expense'
            AND t.date >= b.month
            AND t.date < ?
        ),
        0
      ) as remaining
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.id = ?
  `,
    [endDate, endDate, id],
  );

  const results = resultToArray<BudgetWithActual>(result);
  return results.length > 0 ? results[0] : null;
}

/**
 * Get total budgeted amount for a month
 */
export function getTotalBudgetForMonth(month: string): number {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT COALESCE(SUM(limit_amount), 0) as total
    FROM budgets
    WHERE month = ?
  `,
    [month],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Get distinct months that have budgets
 */
export function getBudgetMonths(): string[] {
  const db = getDatabase();

  const result = db.exec(`
    SELECT DISTINCT month
    FROM budgets
    ORDER BY month DESC
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }

  return result[0].values.map((row) => row[0] as string);
}

/**
 * Count total number of budgets
 */
export function countBudgets(filter?: BudgetFilter): number {
  const db = getDatabase();

  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (filter?.month) {
    conditions.push("month = ?");
    values.push(filter.month);
  }

  if (filter?.category_id) {
    conditions.push("category_id = ?");
    values.push(filter.category_id);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = db.exec(
    `SELECT COUNT(*) as count FROM budgets ${whereClause}`,
    values,
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Copy budgets from one month to another
 * Useful for setting up budgets for a new month based on previous month
 */
export function copyBudgetsToMonth(
  fromMonth: string,
  toMonth: string,
): Budget[] {
  // Get all budgets from source month
  const sourceBudgets = getBudgets({ month: fromMonth });

  const createdBudgets: Budget[] = [];

  for (const budget of sourceBudgets) {
    // Only create if it doesn't already exist
    const existing = getBudgetByMonthAndCategory(toMonth, budget.category_id);
    if (!existing) {
      const newBudget = createBudget({
        month: toMonth,
        category_id: budget.category_id,
        limit_amount: budget.limit_amount,
      });
      createdBudgets.push(newBudget);
    }
  }

  return createdBudgets;
}
