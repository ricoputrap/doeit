import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Wallets Table Schema
 *
 * Represents financial wallets/accounts where money is stored.
 * Examples: Cash, Bank Account, E-Wallet, etc.
 */
export const walletsTable = sqliteTable("wallets", {
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
export type Wallet = typeof walletsTable.$inferSelect;
export type NewWallet = typeof walletsTable.$inferInsert;
