import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getBudgets,
  createBudget,
  upsertBudget,
  getBudgetsWithActual,
  countBudgets,
} from "@/lib/db/repositories/budgets";
import type { CreateBudgetInput, BudgetFilter } from "@/lib/db/types";

/**
 * GET /api/budgets
 * Get all budgets with optional filters and aggregations
 */
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const filter: BudgetFilter = {};

    const month = searchParams.get("month");
    if (month && /^\d{4}-\d{2}-01$/.test(month)) {
      filter.month = month;
    }

    const categoryId = searchParams.get("category_id");
    if (categoryId) {
      const id = parseInt(categoryId, 10);
      if (!isNaN(id) && id > 0) {
        filter.category_id = id;
      }
    }

    const includeActual = searchParams.get("includeActual") === "true";

    // If includeActual is requested, we need a month
    if (includeActual && !filter.month) {
      return Response.json(
        { error: "Month is required when includeActual=true" },
        { status: 400 },
      );
    }

    if (includeActual && filter.month) {
      // Get budgets with actual spending data
      const budgets = getBudgetsWithActual(filter.month);

      // Filter by category_id if specified
      if (filter.category_id) {
        return Response.json(
          budgets.filter((b) => b.category_id === filter.category_id),
        );
      }

      return Response.json(budgets);
    }

    // Get regular budgets
    const budgets = getBudgets(filter);
    const total = countBudgets(filter);

    return Response.json({
      data: budgets,
      pagination: {
        total,
        count: budgets.length,
      },
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return Response.json(
      { error: "Failed to fetch budgets" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/budgets
 * Create or upsert a budget
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { month, category_id, limit_amount } = body as CreateBudgetInput;

    // Validate required fields
    if (!month || !/^\d{4}-\d{2}-01$/.test(month)) {
      return Response.json(
        { error: "Month is required and must be in YYYY-MM-01 format" },
        { status: 400 },
      );
    }

    if (typeof category_id !== "number" || isNaN(category_id) || category_id <= 0) {
      return Response.json(
        { error: "category_id is required and must be a positive number" },
        { status: 400 },
      );
    }

    if (typeof limit_amount !== "number" || isNaN(limit_amount) || limit_amount <= 0) {
      return Response.json(
        { error: "limit_amount is required and must be a positive number" },
        { status: 400 },
      );
    }

    // Determine operation based on query parameter
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "upsert"; // 'upsert' or 'create'

    let budget;

    if (mode === "upsert") {
      // Upsert: create if doesn't exist, update if exists
      budget = upsertBudget({
        month,
        category_id,
        limit_amount: Math.round(limit_amount), // Ensure integer
      });
    } else {
      // Create only: fail if budget already exists
      budget = createBudget({
        month,
        category_id,
        limit_amount: Math.round(limit_amount),
      });
    }

    return Response.json(budget, { status: 201 });
  } catch (error: any) {
    console.error("Error creating/upserting budget:", error);

    // Handle unique constraint error (budget already exists in create mode)
    if (error.message && error.message.includes("UNIQUE constraint")) {
      return Response.json(
        {
          error: "A budget for this month and category already exists",
          hint: "Use mode=upsert to update the existing budget"
        },
        { status: 409 },
      );
    }

    // Handle foreign key constraint errors
    if (error.message && error.message.includes("FOREIGN KEY")) {
      if (error.message.includes("categories")) {
        return Response.json(
          { error: "Invalid category_id: category does not exist" },
          { status: 400 },
        );
      }
    }

    return Response.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }
}

