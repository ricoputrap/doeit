/**
 * API utilities for frontend-backend communication
 * Handles HTTP requests to the Next.js API routes
 */

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:3000';

/**
 * Generic API request wrapper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Dashboard API
 */
export const dashboardApi = {
  getSummary: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const endpoint = `/api/dashboard/summary${queryString ? `?${queryString}` : ''}`;

    return apiRequest<{
      period: { start_date: string; end_date: string };
      totals: { income: number; expenses: number; net: number; net_worth: number };
      metrics: { money_left_to_spend: number; savings_rate: number; total_transactions: number };
      breakdown: {
        spending_by_category: Array<{ category_id: number; category_name: string; total: number; percentage: number }>;
        wallet_balances: Array<{ id: number; name: string; balance: number }>;
      };
    }>(endpoint);
  },

  getSpendingByCategory: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const endpoint = `/api/dashboard/spending-by-category${queryString ? `?${queryString}` : ''}`;

    return apiRequest<Array<{ category_id: number; category_name: string; total: number; percentage: number }>>(endpoint);
  },
};

/**
 * Wallets API
 */
export interface Wallet {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WalletWithBalance extends Wallet {
  balance: number;
}

export interface CreateWalletInput {
  name: string;
}

export const walletsApi = {
  getAll: async (): Promise<Wallet[]> => {
    return apiRequest<Wallet[]>('/api/wallets');
  },

  getAllWithBalances: async (): Promise<WalletWithBalance[]> => {
    return apiRequest<WalletWithBalance[]>('/api/wallets?includeBalances=true');
  },

  getById: async (id: number): Promise<Wallet> => {
    return apiRequest<Wallet>(`/api/wallets/${id}`);
  },

  create: async (data: CreateWalletInput): Promise<Wallet> => {
    return apiRequest<Wallet>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<CreateWalletInput>): Promise<Wallet> => {
    return apiRequest<Wallet>(`/api/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/wallets/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Categories API
 */
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface CategoryWithSpent extends Category {
  spent: number;
}

export interface CreateCategoryInput {
  name: string;
  type: 'income' | 'expense';
}

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/api/categories');
  },

  getByType: async (type: 'income' | 'expense'): Promise<Category[]> => {
    return apiRequest<Category[]>(`/api/categories?type=${type}`);
  },

  getById: async (id: number): Promise<Category> => {
    return apiRequest<Category>(`/api/categories/${id}`);
  },

  getWithSpent: async (): Promise<CategoryWithSpent[]> => {
    return apiRequest<CategoryWithSpent[]>('/api/categories?includeSpent=true');
  },

  create: async (data: CreateCategoryInput): Promise<Category> => {
    return apiRequest<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<CreateCategoryInput>): Promise<Category> => {
    return apiRequest<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Transactions API
 */
export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  note: string | null;
  wallet_id: number;
  category_id: number | null;
  transfer_id: number | null;
  savings_bucket_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  date: string;
  note?: string;
  wallet_id: number;
  category_id?: number;
  savings_bucket_id?: number;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  wallet_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  has_more: boolean;
}

export const transactionsApi = {
  getAll: async (filters?: TransactionFilters): Promise<PaginatedTransactions> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.wallet_id) params.append('wallet_id', filters.wallet_id.toString());
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const endpoint = `/api/transactions${queryString ? `?${queryString}` : ''}`;

    return apiRequest<PaginatedTransactions>(endpoint);
  },

  getById: async (id: number): Promise<Transaction> => {
    return apiRequest<Transaction>(`/api/transactions/${id}`);
  },

  create: async (data: CreateTransactionInput): Promise<Transaction> => {
    return apiRequest<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<CreateTransactionInput>): Promise<Transaction> => {
    return apiRequest<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Transfers API
 */
export interface CreateTransferInput {
  amount: number;
  from_wallet_id: number;
  to_wallet_id: number;
  date: string;
  note?: string;
}

export interface Transfer {
  id: number;
  amount: number;
  from_wallet_id: number;
  to_wallet_id: number;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  // Linked transactions
  from_transaction: Transaction;
  to_transaction: Transaction;
}

export const transfersApi = {
  create: async (data: CreateTransferInput): Promise<Transfer> => {
    return apiRequest<Transfer>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Budgets API
 */
export interface Budget {
  id: number;
  month: string; // YYYY-MM format
  category_id: number;
  limit_amount: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name?: string;
  spent?: number;
  remaining?: number;
  percentage_used?: number;
}

export interface CreateBudgetInput {
  month: string;
  category_id: number;
  limit_amount: number;
}

export interface BudgetFilters {
  month?: string;
  category_id?: number;
}

export const budgetsApi = {
  getAll: async (filters?: BudgetFilters): Promise<Budget[]> => {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month);
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());

    const queryString = params.toString();
    const endpoint = `/api/budgets${queryString ? `?${queryString}` : ''}`;

    return apiRequest<Budget[]>(endpoint);
  },

  getById: async (id: number): Promise<Budget> => {
    return apiRequest<Budget>(`/api/budgets/${id}`);
  },

  create: async (data: CreateBudgetInput): Promise<Budget> => {
    return apiRequest<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<CreateBudgetInput>): Promise<Budget> => {
    return apiRequest<Budget>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  upsert: async (data: CreateBudgetInput): Promise<Budget> => {
    return apiRequest<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ ...data, upsert: true }),
    });
  },

  copyFromPrevious: async (fromMonth: string, toMonth: string): Promise<Budget[]> => {
    return apiRequest<Budget[]>('/api/budgets/copy', {
      method: 'POST',
      body: JSON.stringify({ from_month: fromMonth, to_month: toMonth }),
    });
  },
};

/**
 * Utility functions for formatting
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatMonth = (monthString: string): string => {
  const [year, month] = monthString.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
  });
};

/**
 * Hook utilities for React components
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const createApiHook = <T>(
  apiFunction: () => Promise<T>
) => {
  return {
    useData: (): ApiState<T> => {
      // This would be implemented with React hooks in a real React component
      // For now, just return the API function
      const state: ApiState<T> = {
        data: null,
        loading: false,
        error: null,
      };
      return state;
    },
    fetch: apiFunction,
  };
};

/**
 * Error handling utilities
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unknown error occurred');
};

/**
 * Validation utilities
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === null || value === undefined || value === '') {
    throw new ApiError(`${fieldName} is required`);
  }
};

export const validateAmount = (amount: number): void => {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new ApiError('Amount must be a positive number');
  }
};

export const validateDate = (dateString: string): void => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new ApiError('Invalid date format');
  }
};
