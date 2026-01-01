import { getDatabase, saveDatabase } from "../index";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryType,
  CategoryWithSpent,
} from "../types";

/**
 * Category Repository
 * Handles all database operations for categories
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
 * Get all categories
 */
export function getAllCategories(): Category[] {
  const db = getDatabase();
  const result = db.exec("SELECT * FROM categories ORDER BY type, name");
  return resultToArray<Category>(result);
}

/**
 * Get categories by type
 */
export function getCategoriesByType(type: CategoryType): Category[] {
  const db = getDatabase();
  const result = db.exec(
    "SELECT * FROM categories WHERE type = ? ORDER BY name",
    [type],
  );
  return resultToArray<Category>(result);
}

/**
 * Get a category by ID
 */
export function getCategoryById(id: number): Category | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM categories WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Category;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Get a category by name and type
 */
export function getCategoryByNameAndType(
  name: string,
  type: CategoryType,
): Category | null {
  const db = getDatabase();
  const stmt = db.prepare(
    "SELECT * FROM categories WHERE name = ? AND type = ?",
  );
  stmt.bind([name, type]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as Category;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Create a new category
 */
export function createCategory(input: CreateCategoryInput): Category {
  const db = getDatabase();

  db.run(
    `INSERT INTO categories (name, type, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`,
    [input.name, input.type],
  );

  const id = db.exec("SELECT last_insert_rowid() as id")[0]
    .values[0][0] as number;

  saveDatabase();

  return getCategoryById(id)!;
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

  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }

  if (input.type !== undefined) {
    updates.push("type = ?");
    values.push(input.type);
  }

  // Always update updated_at
  updates.push("updated_at = datetime('now')");

  // Add id for WHERE clause
  values.push(id);

  db.run(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, values);

  saveDatabase();

  return getCategoryById(id);
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
    db.run("DELETE FROM categories WHERE id = ?", [id]);
    saveDatabase();
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a category exists
 */
export function categoryExists(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare("SELECT 1 FROM categories WHERE id = ?");
  stmt.bind([id]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

/**
 * Get all expense categories with total spent in a date range
 */
export function getCategoriesWithSpent(
  startDate: string,
  endDate: string,
): CategoryWithSpent[] {
  const db = getDatabase();

  const result = db.exec(
    `
    SELECT
      c.*,
      COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category_id = c.id
            AND t.type = 'expense'
            AND t.date >= ?
            AND t.date < ?
        ),
        0
      ) as spent
    FROM categories c
    WHERE c.type = 'expense'
    ORDER BY c.name
  `,
    [startDate, endDate],
  );

  return resultToArray<CategoryWithSpent>(result);
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

  const result = db.exec(
    `
    SELECT COALESCE(SUM(amount), 0) as spent
    FROM transactions
    WHERE category_id = ?
      AND type = 'expense'
      AND date >= ?
      AND date < ?
  `,
    [categoryId, startDate, endDate],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Count total number of categories
 */
export function countCategories(): number {
  const db = getDatabase();

  const result = db.exec("SELECT COUNT(*) as count FROM categories");

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}

/**
 * Count categories by type
 */
export function countCategoriesByType(type: CategoryType): number {
  const db = getDatabase();

  const result = db.exec(
    "SELECT COUNT(*) as count FROM categories WHERE type = ?",
    [type],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }

  return result[0].values[0][0] as number;
}
