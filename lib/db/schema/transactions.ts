import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { walletsTable } from "./wallets";
import { categoriesTable } from "./categories";
import { savingsBucketsTable } from "./savings-buckets";

/**
 * Transactions Table Schema
 *
 * Represents all financial transactions (expenses, income, transfers, savings).
 * This is the core ledger table that tracks all money movements.
 *
 * Transaction Types:
 * - expense: Money spent from a wallet
 * - income: Money received into a wallet
 * - transfer: Money moved between wallets (uses transfer_id to link pairs)
 * - savings: Money allocated to a savings bucket
 */
export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", {
      enum: ["expense", "income", "transfer", "savings"],
    }).notNull(),
    amount: integer("amount").notNull(), // Amount in IDR (integer to avoid floating point issues)
    date: text("date").notNull(), // ISO 8601 date string
    note: text("note"), // Optional note/description
    wallet_id: integer("wallet_id")
      .notNull()
      .references(() => walletsTable.id, { onDelete: "restrict" }),
    category_id: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "restrict",
    }),
    transfer_id: text("transfer_id"), // Links two transactions in a transfer
    savings_bucket_id: integer("savings_bucket_id").references(
      () => savingsBucketsTable.id,
      { onDelete: "restrict" },
    ),
    created_at: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    // Indexes for common query patterns
    dateIdx: index("idx_transactions_date").on(table.date),
    walletIdIdx: index("idx_transactions_wallet_id").on(table.wallet_id),
    categoryIdIdx: index("idx_transactions_category_id").on(table.category_id),
    typeIdx: index("idx_transactions_type").on(table.type),
    transferIdIdx: index("idx_transactions_transfer_id").on(table.transfer_id),
  }),
);

// TypeScript types inferred from schema
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;
export type TransactionType = "expense" | "income" | "transfer" | "savings";
