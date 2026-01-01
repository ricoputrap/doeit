import { getDatabase, saveDatabase } from "../index";
import type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetFilter,
  BudgetWithActual,
} from "../types";
import { budgetsTable } from "../schema/budgets.js";
import { categoriesTable } from "../schema/categories.js";
import { transactionsTable } from "../schema/transactions.js";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Budget Repository using Drizzle ORM
 * Handles all database operations for budgets
 */

/**
 * Get all budgets with optional filters
 */
export function getBudgets(filter?: BudgetFilter): Budget[] {
  const db = getDatabase();

  let query = db.select().from(budgetsTable);

  const conditions = [];

  if (filter?.month) {
    conditions.push(eq(budgetsTable.month, filter.month));
  }

  if (filter?.category_id) {
    conditions.push(eq(budgetsTable.category_id, filter.category_id));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(budgetsTable.month));

  const result = query;
  return result;
}

/**
 * Get a budget by ID
 */
export function getBudgetById(id: number): Budget | null {
  const db = getDatabase();
  const result = db.select().from(budgetsTable).where(eq(budgetsTable.id, id));
  return result[0] || null;
}

/**
 * Get a budget by month and category
 */
export function getBudgetByMonthAndCategory(
  month: string,
  categoryId: number,
): Budget | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(budgetsTable)
    .where(
      and(
        eq(budgetsTable.month, month),
        eq(budgetsTable.category_id, categoryId),
      ),
    );
  return result[0] || null;
}

/**
 * Create a new budget
 */
export function createBudget(input: CreateBudgetInput): Budget {
  const db = getDatabase();

  const result = db
    .insert(budgetsTable)
    .values({
      month: input.month,
      category_id: input.category_id,
      limit_amount: input.limit_amount,
    })
    .returning();

  saveDatabase();

  return result[0];
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

  // Build update values dynamically
  const updateValues: Partial<typeof budgetsTable.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (input.limit_amount !== undefined) {
    updateValues.limit_amount = input.limit_amount;
  }

  const result = db
    .update(budgetsTable)
    .set(updateValues)
    .where(eq(budgetsTable.id, id))
    .returning();

  saveDatabase();

  return result[0] || null;
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

  const result = db
    .delete(budgetsTable)
    .where(eq(budgetsTable.id, id))
    .returning({ id: budgetsTable.id });

  saveDatabase();
  return result.length > 0;
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

  const result = db
    .delete(budgetsTable)
    .where(
      and(
        eq(budgetsTable.month, month),
        eq(budgetsTable.category_id, categoryId),
      ),
    )
    .returning({ id: budgetsTable.id });

  saveDatabase();
  return result.length > 0;
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

  const result = db
    .select({
      id: budgetsTable.id,
      month: budgetsTable.month,
      category_id: budgetsTable.category_id,
      limit_amount: budgetsTable.limit_amount,
      created_at: budgetsTable.created_at,
      updated_at: budgetsTable.updated_at,
      category_name: categoriesTable.name,
      actual_spent: sql<number>`
        COALESCE(
          (
            SELECT SUM(${transactionsTable.amount})
            FROM ${transactionsTable}
            WHERE ${transactionsTable.category_id} = ${budgetsTable.category_id}
              AND ${transactionsTable.type} = 'expense'
              AND ${transactionsTable.date} >= ${budgetsTable.month}
              AND ${transactionsTable.date} < ${endDate}
          ),
          0
        )
      `,
      remaining: sql<number>`
        ${budgetsTable.limit_amount} - COALESCE(
          (
            SELECT SUM(${transactionsTable.amount})
            FROM ${transactionsTable}
            WHERE ${transactionsTable.category_id} = ${budgetsTable.category_id}
              AND ${transactionsTable.type} = 'expense'
              AND ${transactionsTable.date} >= ${budgetsTable.month}
              AND ${transactionsTable.date} < ${endDate}
          ),
          0
        )
      `,
    })
    .from(budgetsTable)
    .innerJoin(
      categoriesTable,
      eq(budgetsTable.category_id, categoriesTable.id),
    )
    .where(eq(budgetsTable.month, month))
    .orderBy(categoriesTable.name);

  return result as BudgetWithActual[];
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

  const result = db
    .select({
      id: budgetsTable.id,
      month: budgetsTable.month,
      category_id: budgetsTable.category_id,
      limit_amount: budgetsTable.limit_amount,
      created_at: budgetsTable.created_at,
      updated_at: budgetsTable.updated_at,
      category_name: categoriesTable.name,
      actual_spent: sql<number>`
        COALESCE(
          (
            SELECT SUM(${transactionsTable.amount})
            FROM ${transactionsTable}
            WHERE ${transactionsTable.category_id} = ${budgetsTable.category_id}
              AND ${transactionsTable.type} = 'expense'
              AND ${transactionsTable.date} >= ${budgetsTable.month}
              AND ${transactionsTable.date} < ${endDate}
          ),
          0
        )
      `,
      remaining: sql<number>`
        ${budgetsTable.limit_amount} - COALESCE(
          (
            SELECT SUM(${transactionsTable.amount})
            FROM ${transactionsTable}
            WHERE ${transactionsTable.category_id} = ${budgetsTable.category_id}
              AND ${transactionsTable.type} = 'expense'
              AND ${transactionsTable.date} >= ${budgetsTable.month}
              AND ${transactionsTable.date} < ${endDate}
          ),
          0
        )
      `,
    })
    .from(budgetsTable)
    .innerJoin(
      categoriesTable,
      eq(budgetsTable.category_id, categoriesTable.id),
    )
    .where(eq(budgetsTable.id, id));

  const results = result as BudgetWithActual[];
  return results.length > 0 ? results[0] : null;
}

/**
 * Get total budgeted amount for a month
 */
export function getTotalBudgetForMonth(month: string): number {
  const db = getDatabase();

  const result = db
    .select({
      total: sql<number>`
        COALESCE(SUM(${budgetsTable.limit_amount}), 0)
      `,
    })
    .from(budgetsTable)
    .where(eq(budgetsTable.month, month));

  return result[0]?.total || 0;
}

/**
 * Get distinct months that have budgets
 */
export function getBudgetMonths(): string[] {
  const db = getDatabase();

  const result = db
    .select({ month: budgetsTable.month })
    .from(budgetsTable)
    .groupBy(budgetsTable.month)
    .orderBy(desc(budgetsTable.month));

  return result.map((row) => row.month);
}

/**
 * Count total number of budgets
 */
export function countBudgets(filter?: BudgetFilter): number {
  const db = getDatabase();

  let query = db.select({ count: sql<number>`COUNT(*)` }).from(budgetsTable);

  const conditions = [];

  if (filter?.month) {
    conditions.push(eq(budgetsTable.month, filter.month));
  }

  if (filter?.category_id) {
    conditions.push(eq(budgetsTable.category_id, filter.category_id));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = query;

  return result[0]?.count || 0;
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
