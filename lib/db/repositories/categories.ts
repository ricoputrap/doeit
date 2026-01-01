import { getDatabase, saveDatabase } from "../index";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryType,
  CategoryWithSpent,
} from "../types";
import { categoriesTable } from "../schema/categories.js";
import { transactionsTable } from "../schema/transactions.js";
import { and, eq, sql, desc } from "drizzle-orm";

/**
 * Category Repository using Drizzle ORM
 * Handles all database operations for categories
 */

/**
 * Get all categories
 */
export function getAllCategories(): Category[] {
  const db = getDatabase();
  const result = db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.type, categoriesTable.name);
  return result;
}

/**
 * Get categories by type
 */
export function getCategoriesByType(type: CategoryType): Category[] {
  const db = getDatabase();
  const result = db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.type, type))
    .orderBy(categoriesTable.name);
  return result;
}

/**
 * Get a category by ID
 */
export function getCategoryById(id: number): Category | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id));
  return result[0] || null;
}

/**
 * Get a category by name and type
 */
export function getCategoryByNameAndType(
  name: string,
  type: CategoryType,
): Category | null {
  const db = getDatabase();
  const result = db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.name, name), eq(categoriesTable.type, type)));
  return result[0] || null;
}

/**
 * Create a new category
 */
export function createCategory(input: CreateCategoryInput): Category {
  const db = getDatabase();

  const result = db
    .insert(categoriesTable)
    .values({
      name: input.name,
      type: input.type,
    })
    .returning();

  saveDatabase();

  return result[0];
}

/**
 * Update a category
 */
export function updateCategory(
  id: number,
  input: UpdateCategoryInput,
): Category | null {
  const db = getDatabase();

  // Check if category exists
  const existing = getCategoryById(id);
  if (!existing) {
    return null;
  }

  // Build update values dynamically
  const updateValues: Partial<typeof categoriesTable.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updateValues.name = input.name;
  }

  if (input.type !== undefined) {
    updateValues.type = input.type;
  }

  const result = db
    .update(categoriesTable)
    .set(updateValues)
    .where(eq(categoriesTable.id, id))
    .returning();

  saveDatabase();

  return result[0] || null;
}

/**
 * Delete a category
 * Returns true if deleted, false if not found
 * Throws error if category has transactions (due to foreign key constraint)
 */
export function deleteCategory(id: number): boolean {
  const db = getDatabase();

  // Check if category exists first
  const existing = getCategoryById(id);
  if (!existing) {
    return false;
  }

  try {
    const result = db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning({ id: categoriesTable.id });

    saveDatabase();
    return result.length > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a category exists
 */
export function categoryExists(id: number): boolean {
  const db = getDatabase();
  const result = db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1);

  return result.length > 0;
}

/**
 * Get all expense categories with total spent in a date range
 */
export function getCategoriesWithSpent(
  startDate: string,
  endDate: string,
): CategoryWithSpent[] {
  const db = getDatabase();

  const result = db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      type: categoriesTable.type,
      created_at: categoriesTable.created_at,
      updated_at: categoriesTable.updated_at,
      spent: sql<number>`
        COALESCE(
          (
            SELECT SUM(${transactionsTable.amount})
            FROM ${transactionsTable}
            WHERE ${transactionsTable.category_id} = ${categoriesTable.id}
              AND ${transactionsTable.type} = 'expense'
              AND ${transactionsTable.date} >= ${startDate}
              AND ${transactionsTable.date} < ${endDate}
          ),
          0
        )
      `,
    })
    .from(categoriesTable)
    .where(eq(categoriesTable.type, "expense"))
    .orderBy(categoriesTable.name);

  return result as CategoryWithSpent[];
}

/**
 * Get total spent for a specific category in a date range
 */
export function getCategorySpent(
  categoryId: number,
  startDate: string,
  endDate: string,
): number {
  const db = getDatabase();

  const result = db
    .select({
      spent: sql<number>`
        COALESCE(
          SUM(${transactionsTable.amount}),
          0
        )
      `,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.category_id, categoryId),
        eq(transactionsTable.type, "expense"),
        sql`${transactionsTable.date} >= ${startDate}`,
        sql`${transactionsTable.date} < ${endDate}`,
      ),
    );

  return result[0]?.spent || 0;
}

/**
 * Count total number of categories
 */
export function countCategories(): number {
  const db = getDatabase();

  const result = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(categoriesTable);

  return result[0]?.count || 0;
}

/**
 * Count categories by type
 */
export function countCategoriesByType(type: CategoryType): number {
  const db = getDatabase();

  const result = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(categoriesTable)
    .where(eq(categoriesTable.type, type));

  return result[0]?.count || 0;
}
