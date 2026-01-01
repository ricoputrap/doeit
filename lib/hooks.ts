/**
 * React hooks for API state management
 * Provides reusable hooks for data fetching, form handling, and CRUD operations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  dashboardApi,
  walletsApi,
  categoriesApi,
  transactionsApi,
  budgetsApi,
  transfersApi,
  type Wallet,
  type WalletWithBalance,
  type Category,
  type CategoryWithSpent,
  type Transaction,
  type Budget,
  type Transfer,
  handleApiError,
  type ApiError,
} from "@/lib/api";

/**
 * Generic hook for API data fetching with loading and error states
 */
function useApiData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Generic hook for async operations (create, update, delete)
 */
function useAsyncOperation<T, P extends any[]>(
  operation: (...args: P) => Promise<T>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await operation(...args);
        return result;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [operation],
  );

  return { execute, loading, error, clearError: () => setError(null) };
}

/**
 * Dashboard hooks
 */
export function useDashboardSummary(startDate?: string, endDate?: string) {
  return useApiData(
    () => dashboardApi.getSummary(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSpendingByCategory(startDate?: string, endDate?: string) {
  return useApiData(
    () => dashboardApi.getSpendingByCategory(startDate, endDate),
    [startDate, endDate],
  );
}

/**
 * Wallets hooks
 */
export function useWallets() {
  return useApiData(walletsApi.getAll);
}

export function useWalletsWithBalances() {
  return useApiData(walletsApi.getAllWithBalances);
}

export function useWallet(id: number) {
  return useApiData(() => walletsApi.getById(id), [id]);
}

export function useCreateWallet() {
  return useAsyncOperation(walletsApi.create);
}

export function useUpdateWallet() {
  return useAsyncOperation(
    ({ id, data }: { id: number; data: Partial<{ name: string }> }) =>
      walletsApi.update(id, data),
  );
}

export function useDeleteWallet() {
  return useAsyncOperation(walletsApi.delete);
}

/**
 * Categories hooks
 */
export function useCategories() {
  return useApiData(categoriesApi.getAll);
}

export function useCategoriesByType(type: "income" | "expense") {
  return useApiData(() => categoriesApi.getByType(type), [type]);
}

export function useCategoriesWithSpent() {
  return useApiData(categoriesApi.getWithSpent);
}

export function useCategory(id: number) {
  return useApiData(() => categoriesApi.getById(id), [id]);
}

export function useCreateCategory() {
  return useAsyncOperation(categoriesApi.create);
}

export function useUpdateCategory() {
  return useAsyncOperation(
    ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ name: string; type: "income" | "expense" }>;
    }) => categoriesApi.update(id, data),
  );
}

export function useDeleteCategory() {
  return useAsyncOperation(categoriesApi.delete);
}

/**
 * Transactions hooks
 */
export function useTransactions(filters?: {
  type?: "income" | "expense";
  wallet_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  return useApiData(
    () => transactionsApi.getAll(filters),
    [JSON.stringify(filters)],
  );
}

export function useTransaction(id: number) {
  return useApiData(() => transactionsApi.getById(id), [id]);
}

export function useCreateTransaction() {
  return useAsyncOperation(transactionsApi.create);
}

export function useUpdateTransaction() {
  return useAsyncOperation(
    ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        type: "income" | "expense";
        amount: number;
        date: string;
        note?: string;
        wallet_id: number;
        category_id?: number;
      }>;
    }) => transactionsApi.update(id, data),
  );
}

export function useDeleteTransaction() {
  return useAsyncOperation(transactionsApi.delete);
}

/**
 * Transfers hooks
 */
export function useCreateTransfer() {
  return useAsyncOperation(transfersApi.create);
}

/**
 * Budgets hooks
 */
export function useBudgets(filters?: { month?: string; category_id?: number }) {
  return useApiData(
    () => budgetsApi.getAll(filters),
    [JSON.stringify(filters)],
  );
}

export function useBudget(id: number) {
  return useApiData(() => budgetsApi.getById(id), [id]);
}

export function useCreateBudget() {
  return useAsyncOperation(budgetsApi.create);
}

export function useUpdateBudget() {
  return useAsyncOperation(
    ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        month: string;
        category_id: number;
        limit_amount: number;
      }>;
    }) => budgetsApi.update(id, data),
  );
}

export function useDeleteBudget() {
  return useAsyncOperation(budgetsApi.delete);
}

export function useUpsertBudget() {
  return useAsyncOperation(budgetsApi.upsert);
}

export function useCopyBudgets() {
  return useAsyncOperation(
    ({ fromMonth, toMonth }: { fromMonth: string; toMonth: string }) =>
      budgetsApi.copyFromPrevious(fromMonth, toMonth),
  );
}

/**
 * Form state management hooks
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedFields] = useState<Record<string, boolean>>({});

  const setValue = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error when user starts typing
      if (errors[name as string]) {
        setErrors((prev) => ({ ...prev, [name as string]: "" }));
      }
    },
    [errors],
  );

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setTouched = useCallback((name: string) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  const validate = useCallback(
    (validationRules: Record<keyof T, (value: any) => string | null>) => {
      const newErrors: Record<string, string> = {};
      let isValid = true;

      Object.entries(validationRules).forEach(([field, rule]) => {
        const error = rule(values[field as keyof T]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [values],
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched,
    reset,
    validate,
    isValid: Object.keys(errors).length === 0,
  };
}

/**
 * Wallet form specific hooks
 */
export function useWalletForm(initialData?: { name?: string }) {
  const {
    values,
    setValue,
    errors,
    setError,
    touched,
    setTouched,
    validate,
    reset,
  } = useFormState({
    name: initialData?.name || "",
  });

  const validateForm = useCallback(() => {
    return validate({
      name: (value: string) => {
        if (!value || value.trim() === "") return "Wallet name is required";
        if (value.length > 100) return "Name cannot exceed 100 characters";
        return null;
      },
    });
  }, [validate]);

  return {
    name: values.name,
    errors,
    touched,
    setName: (name: string) => setValue("name", name),
    setNameTouched: () => setTouched("name"),
    validateForm,
    reset,
  };
}

/**
 * Category form specific hooks
 */
export function useCategoryForm(initialData?: {
  name?: string;
  type?: "income" | "expense";
}) {
  const {
    values,
    setValue,
    errors,
    setError,
    touched,
    setTouched,
    validate,
    reset,
  } = useFormState({
    name: initialData?.name || "",
    type: initialData?.type || "expense",
  });

  const validateForm = useCallback(() => {
    return validate({
      name: (value: string) => {
        if (!value || value.trim() === "") return "Category name is required";
        if (value.length > 100) return "Name cannot exceed 100 characters";
        return null;
      },
      type: (value: string) => {
        if (!value || !["income", "expense"].includes(value))
          return "Valid type is required";
        return null;
      },
    });
  }, [validate]);

  return {
    name: values.name,
    type: values.type,
    errors,
    touched,
    setName: (name: string) => setValue("name", name),
    setType: (type: "income" | "expense") => setValue("type", type),
    setNameTouched: () => setTouchedFields("name"),
    setTypeTouched: () => setTouchedFields("type"),
    validateForm,
    reset,
  };
}

/**
 * Transaction form specific hooks
 */
export function useTransactionForm(initialData?: {
  type?: "income" | "expense";
  amount?: number;
  date?: string;
  note?: string;
  wallet_id?: number;
  category_id?: number;
}) {
  const {
    values,
    setValue,
    errors,
    setError,
    touched,
    setTouched,
    validate,
    reset,
  } = useFormState({
    type: initialData?.type || "expense",
    amount: initialData?.amount || 0,
    date: initialData?.date || new Date().toISOString().split("T")[0],
    note: initialData?.note || "",
    wallet_id: initialData?.wallet_id || 0,
    category_id: initialData?.category_id || 0,
  });

  const validateForm = useCallback(() => {
    return validate({
      type: (value: string) => {
        if (!value || !["income", "expense"].includes(value))
          return "Valid type is required";
        return null;
      },
      amount: (value: number) => {
        if (!value || value <= 0) return "Amount must be greater than 0";
        if (value > 1000000000) return "Amount cannot exceed 1 billion";
        return null;
      },
      date: (value: string) => {
        if (!value) return "Date is required";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "Invalid date";
        return null;
      },
      note: (value: string) => {
        if (value && value.length > 500)
          return "Note cannot exceed 500 characters";
        return null;
      },
      wallet_id: (value: number) => {
        if (!value || value <= 0) return "Wallet is required";
        return null;
      },
      category_id: (value: number) => {
        if (values.type === "expense" && (!value || value <= 0))
          return "Category is required for expenses";
        return null;
      },
    });
  }, [validate, values.type]);

  return {
    type: values.type,
    amount: values.amount,
    date: values.date,
    note: values.note,
    wallet_id: values.wallet_id,
    category_id: values.category_id,
    errors,
    touched,
    setType: (type: "income" | "expense") => setValue("type", type),
    setAmount: (amount: number) => setValue("amount", amount),
    setDate: (date: string) => setValue("date", date),
    setNote: (note: string) => setValue("note", note),
    setWalletId: (wallet_id: number) => setValue("wallet_id", wallet_id),
    setCategoryId: (category_id: number) =>
      setValue("category_id", category_id),
    setTypeTouched: () => setTouchedFields("type"),
    setAmountTouched: () => setTouchedFields("amount"),
    setDateTouched: () => setTouchedFields("date"),
    setWalletIdTouched: () => setTouchedFields("wallet_id"),
    setCategoryIdTouched: () => setTouchedFields("category_id"),
    validateForm,
    reset,
  };
}

/**
 * Transfer form specific hooks
 */
export function useTransferForm(initialData?: {
  amount?: number;
  from_wallet_id?: number;
  to_wallet_id?: number;
  date?: string;
  note?: string;
}) {
  const {
    values,
    setValue,
    errors,
    setError,
    touched,
    setTouched,
    validate,
    reset,
  } = useFormState({
    amount: initialData?.amount || 0,
    from_wallet_id: initialData?.from_wallet_id || 0,
    to_wallet_id: initialData?.to_wallet_id || 0,
    date: initialData?.date || new Date().toISOString().split("T")[0],
    note: initialData?.note || "",
  });

  const validateForm = useCallback(() => {
    return validate({
      amount: (value: number) => {
        if (!value || value <= 0) return "Amount must be greater than 0";
        if (value > 1000000000) return "Amount cannot exceed 1 billion";
        return null;
      },
      from_wallet_id: (value: number) => {
        if (!value || value <= 0) return "Source wallet is required";
        if (value === values.to_wallet_id)
          return "Source and destination wallets must be different";
        return null;
      },
      to_wallet_id: (value: number) => {
        if (!value || value <= 0) return "Destination wallet is required";
        if (value === values.from_wallet_id)
          return "Source and destination wallets must be different";
        return null;
      },
      date: (value: string) => {
        if (!value) return "Date is required";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "Invalid date";
        return null;
      },
      note: (value: string) => {
        if (value && value.length > 500)
          return "Note cannot exceed 500 characters";
        return null;
      },
    });
  }, [validate, values.from_wallet_id, values.to_wallet_id]);

  return {
    amount: values.amount,
    from_wallet_id: values.from_wallet_id,
    to_wallet_id: values.to_wallet_id,
    date: values.date,
    note: values.note,
    errors,
    touched,
    setAmount: (amount: number) => setValue("amount", amount),
    setFromWalletId: (from_wallet_id: number) =>
      setValue("from_wallet_id", from_wallet_id),
    setToWalletId: (to_wallet_id: number) =>
      setValue("to_wallet_id", to_wallet_id),
    setDate: (date: string) => setValue("date", date),
    setNote: (note: string) => setValue("note", note),
    setAmountTouched: () => setTouchedFields("amount"),
    setFromWalletIdTouched: () => setTouchedFields("from_wallet_id"),
    setToWalletIdTouched: () => setTouchedFields("to_wallet_id"),
    setDateTouched: () => setTouchedFields("date"),
    validateForm,
    reset,
  };
}

/**
 * Budget form specific hooks
 */
export function useBudgetForm(initialData?: {
  month?: string;
  category_id?: number;
  limit_amount?: number;
}) {
  const {
    values,
    setValue,
    errors,
    setError,
    touched,
    setTouched,
    validate,
    reset,
  } = useFormState({
    month: initialData?.month || new Date().toISOString().slice(0, 7), // YYYY-MM format
    category_id: initialData?.category_id || 0,
    limit_amount: initialData?.limit_amount || 0,
  });

  const validateForm = useCallback(() => {
    return validate({
      month: (value: string) => {
        if (!value || !/^\d{4}-\d{2}$/.test(value))
          return "Valid month (YYYY-MM) is required";
        return null;
      },
      category_id: (value: number) => {
        if (!value || value <= 0) return "Category is required";
        return null;
      },
      limit_amount: (value: number) => {
        if (!value || value <= 0) return "Budget limit must be greater than 0";
        if (value > 1000000000) return "Budget limit cannot exceed 1 billion";
        return null;
      },
    });
  }, [validate]);

  return {
    month: values.month,
    category_id: values.category_id,
    limit_amount: values.limit_amount,
    errors,
    touched,
    setMonth: (month: string) => setValue("month", month),
    setCategoryId: (category_id: number) =>
      setValue("category_id", category_id),
    setLimitAmount: (limit_amount: number) =>
      setValue("limit_amount", limit_amount),
    setMonthTouched: () => setTouchedFields("month"),
    setCategoryIdTouched: () => setTouchedFields("category_id"),
    setLimitAmountTouched: () => setTouchedFields("limit_amount"),
    validateForm,
    reset,
  };
}

/**
 * Pagination hook
 */
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  return {
    page,
    limit,
    setPage,
    setLimit,
    reset,
    nextPage,
    prevPage,
    goToPage,
    offset: (page - 1) * limit,
  };
}

/**
 * Date range hook
 */
export function useDateRange() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(
    firstDayOfMonth.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const setCustomRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const setThisMonth = useCallback(() => {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, [today]);

  const setLastMonth = useCallback(() => {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, [today]);

  const setLast30Days = useCallback(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, [today]);

  const reset = useCallback(() => {
    setThisMonth();
  }, [setThisMonth]);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setCustomRange,
    setThisMonth,
    setLastMonth,
    setLast30Days,
    reset,
  };
}

/**
 * Loading states hook for better UX
 */
export function useLoadingState() {
  const [states, setStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback(
    (key: string) => {
      return states[key] || false;
    },
    [states],
  );

  const clearLoading = useCallback((key: string) => {
    setStates((prev) => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return { setLoading, isLoading, clearLoading };
}
