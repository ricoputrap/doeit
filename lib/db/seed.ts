/**
 * Seed Data Utilities using Drizzle ORM
 *
 * This module provides functions to populate the database with initial data.
 * Used for development, testing, and first-time setup.
 */

import { categoriesTable } from "./schema/categories.js";

/**
 * Default categories to seed into the database
 */
const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other Expense",
] as const;

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Other Income",
] as const;

/**
 * Seed default categories into the database
 * Uses INSERT OR IGNORE semantics to avoid duplicates
 *
 * @param db - Drizzle database instance
 */
export async function seedDefaultCategories(db: any): Promise<void> {
  console.log("[DB] Seeding default categories...");

  // Seed expense categories
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    try {
      await db
        .insert(categoriesTable)
        .values({
          name,
          type: "expense",
        })
        .onConflictDoNothing();
      console.log(`  ✓ Added expense category: ${name}`);
    } catch (error) {
      console.error(`  ✗ Failed to add expense category: ${name}`, error);
      throw error;
    }
  }

  // Seed income categories
  for (const name of DEFAULT_INCOME_CATEGORIES) {
    try {
      await db
        .insert(categoriesTable)
        .values({
          name,
          type: "income",
        })
        .onConflictDoNothing();
      console.log(`  ✓ Added income category: ${name}`);
    } catch (error) {
      console.error(`  ✗ Failed to add income category: ${name}`, error);
      throw error;
    }
  }

  console.log("[DB] Default categories seeded successfully");
}

/**
 * Clear all categories from the database
 * WARNING: This will delete all category data!
 *
 * @param db - Drizzle database instance
 */
export async function clearAllCategories(db: any): Promise<void> {
  console.log("[DB] Clearing all categories...");

  try {
    await db.delete(categoriesTable);
    console.log("[DB] All categories cleared");
  } catch (error) {
    console.error("[DB] Failed to clear categories", error);
    throw error;
  }
}

/**
 * Reset categories to default values
 * Clears existing categories and seeds new defaults
 *
 * @param db - Drizzle database instance
 */
export async function resetCategoriesToDefaults(db: any): Promise<void> {
  console.log("[DB] Resetting categories to defaults...");

  await clearAllCategories(db);
  await seedDefaultCategories(db);

  console.log("[DB] Categories reset to defaults");
}

/**
 * Get count of categories by type
 *
 * @param type - Category type to count
 * @param db - Drizzle database instance
 * @returns Promise<number> - Count of categories
 */
export async function getCategoryCount(
  type: "expense" | "income",
  db: any,
): Promise<number> {
  const { eq } = await import("drizzle-orm");

  const result = await db
    .select({ count: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.type, type));

  return result.length;
}

/**
 * Verify that default categories exist
 * Returns true if all expected categories are present
 *
 * @param db - Drizzle database instance
 * @returns Promise<boolean> - True if all defaults exist
 */
export async function verifyDefaultCategories(db: any): Promise<boolean> {
  try {
    const expenseCount = await getCategoryCount("expense", db);
    const incomeCount = await getCategoryCount("income", db);

    const hasAllExpense = expenseCount >= DEFAULT_EXPENSE_CATEGORIES.length;
    const hasAllIncome = incomeCount >= DEFAULT_INCOME_CATEGORIES.length;

    console.log(
      `[DB] Verification: ${expenseCount} expense categories (expected ${DEFAULT_EXPENSE_CATEGORIES.length})`,
    );
    console.log(
      `[DB] Verification: ${incomeCount} income categories (expected ${DEFAULT_INCOME_CATEGORIES.length})`,
    );

    return hasAllExpense && hasAllIncome;
  } catch (error) {
    console.error("[DB] Failed to verify default categories", error);
    return false;
  }
}
