import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import { getSpendingByCategory } from "@/lib/db/repositories/transactions";
import { getCategoriesByType } from "@/lib/db/repositories/categories";

/**
 * GET /api/dashboard/spending-by-category
 * Get spending breakdown by category for dashboard visualization
 */
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;

    // Parse date range parameters (default to current month)
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Default to current month if no dates provided
    const today = new Date();
    const defaultStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

    // Calculate end of current month
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const defaultEndDate = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;

    const finalStartDate = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)
      ? startDate
      : defaultStartDate;
    const finalEndDate = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ? endDate
      : defaultEndDate;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalStartDate) || !/^\d{4}-\d{2}-\d{2}$/.test(finalEndDate)) {
      return Response.json(
        { error: "Dates must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    // Get spending data by category
    const spendingData = getSpendingByCategory(finalStartDate, finalEndDate);

    // Get expense categories to match IDs with names
    const expenseCategories = getCategoriesByType("expense");

    // Calculate total spending for percentage calculations
    const totalSpending = spendingData.reduce((sum, item) => sum + item.total, 0);

    // Build the response with category names and percentages
    const spendingByCategory = spendingData
      .map(item => {
        const category = expenseCategories.find(c => c.id === item.category_id);
        return {
          category_id: item.category_id,
          category_name: category?.name || "Unknown Category",
          total: item.total,
          percentage: totalSpending > 0 ? Math.round((item.total / totalSpending) * 10000) / 100 : 0, // Round to 2 decimal places
        };
      })
      .sort((a, b) => b.total - a.total); // Sort by amount descending

    // Group small categories into "Other" if there are many categories
    const MAX_CATEGORIES = 10;
    let finalSpending = spendingByCategory;

    if (spendingByCategory.length > MAX_CATEGORIES) {
      const topCategories = spendingByCategory.slice(0, MAX_CATEGORIES - 1);
      const otherCategories = spendingByCategory.slice(MAX_CATEGORIES - 1);

      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.total, 0);
      const otherPercentage = totalSpending > 0 ? Math.round((otherTotal / totalSpending) * 10000) / 100 : 0;

      finalSpending = [
        ...topCategories,
        {
          category_id: 0,
          category_name: "Other",
          total: otherTotal,
          percentage: otherPercentage,
        },
      ];
    }

    // Calculate summary statistics
    const summary = {
      period: {
        start_date: finalStartDate,
        end_date: finalEndDate,
      },
      totals: {
        total_spending: totalSpending,
        category_count: spendingData.length,
      },
      categories: finalSpending,
    };

    return Response.json(summary);
  } catch (error) {
    console.error("Error fetching spending by category:", error);
    return Response.json(
      { error: "Failed to fetch spending by category" },
      { status: 500 },
    );
  }
}
