/**
 * Database Repositories
 * Export all repository functions for easy access
 */

// Wallet operations
export {
  getAllWallets,
  getWalletById,
  getWalletByName,
  createWallet,
  updateWallet,
  deleteWallet,
  walletExists,
  getAllWalletsWithBalances,
  getWalletBalance,
  countWallets,
} from "./wallets";

// Category operations
export {
  getAllCategories,
  getCategoriesByType,
  getCategoryById,
  getCategoryByNameAndType,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryExists,
  getCategoriesWithSpent,
  getCategorySpent,
  countCategories,
  countCategoriesByType,
} from "./categories";

// Savings Bucket operations
export {
  getAllSavingsBuckets,
  getSavingsBucketById,
  getSavingsBucketByName,
  createSavingsBucket,
  updateSavingsBucket,
  deleteSavingsBucket,
  savingsBucketExists,
  getSavingsBucketBalance,
  getAllSavingsBucketsWithBalances,
  countSavingsBuckets,
} from "./savings-buckets";

// Transaction operations
export {
  getTransactions,
  getTransactionById,
  getTransactionsByTransferId,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  deleteTransfer,
  getTotalIncome,
  getTotalExpenses,
  getSpendingByCategory,
  getNetWorth,
  countTransactions,
} from "./transactions";

// Budget operations
export {
  getBudgets,
  getBudgetById,
  getBudgetByMonthAndCategory,
  createBudget,
  upsertBudget,
  updateBudget,
  deleteBudget,
  deleteBudgetByMonthAndCategory,
  getBudgetsWithActual,
  getBudgetWithActual,
  getTotalBudgetForMonth,
  getBudgetMonths,
  countBudgets,
  copyBudgetsToMonth,
} from "./budgets";
