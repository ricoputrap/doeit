import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Categories Table Schema
 *
 * Represents transaction categories for organizing expenses and income.
 * Each category has a type (expense or income) and forms a unique pair with name.
 */
export const categoriesTable = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    type: text("type", { enum: ["expense", "income"] }).notNull(),
    created_at: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    // Unique constraint on (name, type) combination
    uniqueNameType: uniqueIndex("unique_name_type").on(table.name, table.type),
  }),
);

// TypeScript types inferred from schema
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type CategoryType = "expense" | "income";
