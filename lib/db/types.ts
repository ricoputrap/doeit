/**
 * Database entity types for Doeit
 * These represent the structure of data as stored in SQLite
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export const TRANSACTION_TYPES = ["expense", "income", "transfer", "savings"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORY_TYPES = ["expense", "income"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

// ============================================================================
// Base Entity (common fields)
// ============================================================================

export interface BaseEntity {
  id: number;
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
}

// ============================================================================
// Wallet
// ============================================================================

export interface Wallet extends BaseEntity {
  name: string;
}

export interface CreateWalletInput {
  name: string;
}

export interface UpdateWalletInput {
  name?: string;
}

// ============================================================================
// Category
// ============================================================================

export interface Category extends BaseEntity {
  name: string;
  type: CategoryType;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: CategoryType;
}

// ============================================================================
// Savings Bucket
// ============================================================================

export interface SavingsBucket extends BaseEntity {
  name: string;
}

export interface CreateSavingsBucketInput {
  name: string;
}

export interface UpdateSavingsBucketInput {
  name?: string;
}

// ============================================================================
// Transaction
// ============================================================================

export interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number; // Stored in IDR (smallest unit)
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  note: string | null;
  wallet_id: number;
  category_id: number | null; // Required for expense, optional for income
  transfer_id: string | null; // UUID to link transfer pairs
  savings_bucket_id: number | null; // For savings transactions
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  note?: string | null;
  wallet_id: number;
  category_id?: number | null;
  transfer_id?: string | null;
  savings_bucket_id?: number | null;
}

export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  date?: string;
  note?: string | null;
  wallet_id?: number;
  category_id?: number | null;
  savings_bucket_id?: number | null;
}

// ============================================================================
// Transfer (helper type for creating transfers)
// ============================================================================

export interface CreateTransferInput {
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  date: string;
  note?: string | null;
}

export interface Transfer {
  id: string; // The transfer_id that links both transactions
  from_transaction: Transaction;
  to_transaction: Transaction;
}

// ============================================================================
// Budget
// ============================================================================

export interface Budget extends BaseEntity {
  month: string; // YYYY-MM-01 format (first day of month)
  category_id: number;
  limit_amount: number; // Stored in IDR
}

export interface CreateBudgetInput {
  month: string;
  category_id: number;
  limit_amount: number;
}

export interface UpdateBudgetInput {
  limit_amount?: number;
}

// ============================================================================
// Aggregation types (for dashboard/reporting)
// ============================================================================

export interface WalletWithBalance extends Wallet {
  balance: number;
}

export interface CategoryWithSpent extends Category {
  spent: number;
}

export interface BudgetWithActual extends Budget {
  actual_spent: number;
  remaining: number;
  category_name: string;
}

export interface MonthlyStats {
  month: string;
  total_income: number;
  total_expense: number;
  net: number;
}

export interface NetWorthDataPoint {
  date: string;
  net_worth: number;
}

// ============================================================================
// Query/Filter types
// ============================================================================

export interface TransactionFilter {
  type?: TransactionType;
  wallet_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface BudgetFilter {
  month?: string;
  category_id?: number;
}
