import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getTotalIncome,
  getTotalExpenses,
  getNetWorth,
  getSpendingByCategory,
} from "@/lib/db/repositories/transactions";
import { getAllWalletsWithBalances } from "@/lib/db/repositories/wallets";
import { getCategoriesByType } from "@/lib/db/repositories/categories";

/**
 * GET /api/dashboard/summary
 * Get dashboard summary data including totals and spending breakdown
 */
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;

    // Parse date range (default to current month if not provided)
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Default to current month if no dates provided
    const today = new Date();
    const defaultStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const defaultEndDate = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;

    const finalStartDate =
      startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)
        ? startDate
        : defaultStartDate;
    const finalEndDate =
      endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : defaultEndDate;

    // Validate date format
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(finalStartDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(finalEndDate)
    ) {
      return Response.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    // Get all summary data
    const [totalIncome, totalExpenses, netWorth, spendingByCategory, wallets] =
      await Promise.all([
        getTotalIncome(finalStartDate, finalEndDate),
        getTotalExpenses(finalStartDate, finalEndDate),
        getNetWorth(),
        getSpendingByCategory(finalStartDate, finalEndDate),
        getAllWalletsWithBalances(),
      ]);

    // Calculate derived values
    const moneyLeftToSpend = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Get expense categories for the breakdown
    const expenseCategories = getCategoriesByType("expense");

    // Build spending breakdown with category names
    const spendingBreakdown = spendingByCategory
      .map((item) => {
        const category = expenseCategories.find(
          (c) => c.id === item.category_id,
        );
        return {
          category_id: item.category_id,
          category_name: category?.name || "Unknown Category",
          total: item.total,
          percentage:
            totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    // Build wallet balances
    const walletBalances = wallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      balance: wallet.balance,
    }));

    const summary = {
      period: {
        start_date: finalStartDate,
        end_date: finalEndDate,
      },
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses,
        net_worth: netWorth,
      },
      metrics: {
        money_left_to_spend: moneyLeftToSpend,
        savings_rate: Math.round(savingsRate * 100) / 100, // Round to 2 decimal places
        total_transactions: 0, // Could be added if needed
      },
      breakdown: {
        spending_by_category: spendingBreakdown,
        wallet_balances: walletBalances,
      },
    };

    return Response.json(summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return Response.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 },
    );
  }
}
