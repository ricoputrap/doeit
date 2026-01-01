import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { categoriesTable } from "./categories";

/**
 * Budgets Table Schema
 *
 * Represents monthly budgets set for expense categories.
 * Tracks budget limits and helps monitor spending against planned amounts.
 *
 * Each budget is unique per (month, category) combination.
 * Month is stored as YYYY-MM format (e.g., "2024-01").
 */
export const budgetsTable = sqliteTable(
  "budgets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    month: text("month").notNull(), // Format: YYYY-MM
    category_id: integer("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
    limit_amount: integer("limit_amount").notNull(), // Budget limit in IDR
    created_at: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    // Unique constraint on (month, category_id) combination
    uniqueMonthCategory: uniqueIndex("unique_month_category").on(
      table.month,
      table.category_id,
    ),
    // Indexes for common query patterns
    monthIdx: index("idx_budgets_month").on(table.month),
    categoryIdIdx: index("idx_budgets_category_id").on(table.category_id),
  }),
);

// TypeScript types inferred from schema
export type Budget = typeof budgetsTable.$inferSelect;
export type NewBudget = typeof budgetsTable.$inferInsert;
