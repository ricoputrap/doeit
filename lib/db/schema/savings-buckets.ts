import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Savings Buckets Table Schema
 *
 * Represents savings goals or buckets where money is allocated.
 * Examples: Emergency Fund, Vacation, New Car, etc.
 */
export const savingsBucketsTable = sqliteTable("savings_buckets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// TypeScript types inferred from schema
export type SavingsBucket = typeof savingsBucketsTable.$inferSelect;
export type NewSavingsBucket = typeof savingsBucketsTable.$inferInsert;
