import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getBudgetById,
  getBudgetWithActual,
  updateBudget,
  deleteBudget,
} from "@/lib/db/repositories/budgets";
import type { UpdateBudgetInput } from "@/lib/db/types";

/**
 * GET /api/budgets/:id
 * Get a single budget by ID (optionally with actual spending)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await ensureDatabase();

    const id = parseInt(params.id, 10);

    // Validate ID
    if (isNaN(id) || id <= 0) {
      return Response.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeActual = searchParams.get("includeActual") === "true";

    let budget;

    if (includeActual) {
      budget = getBudgetWithActual(id);
    } else {
      budget = getBudgetById(id);
    }

    if (!budget) {
      return Response.json({ error: "Budget not found" }, { status: 404 });
    }

    return Response.json(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return Response.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

/**
 * PUT /api/budgets/:id
 * Update a budget
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await ensureDatabase();

    const id = parseInt(params.id, 10);

    // Validate ID
    if (isNaN(id) || id <= 0) {
      return Response.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const body = await request.json();
    const { limit_amount } = body as UpdateBudgetInput;

    // Validate input
    if (limit_amount !== undefined) {
      if (
        typeof limit_amount !== "number" ||
        isNaN(limit_amount) ||
        limit_amount < 0
      ) {
        return Response.json(
          { error: "limit_amount must be a non-negative number" },
          { status: 400 },
        );
      }
    }

    // Ensure at least one field is being updated
    if (limit_amount === undefined) {
      return Response.json(
        { error: "At least one field must be provided for update" },
        { status: 400 },
      );
    }

    const updatedBudget = updateBudget(id, {
      ...(limit_amount !== undefined && {
        limit_amount: Math.round(limit_amount),
      }),
    });

    if (!updatedBudget) {
      return Response.json({ error: "Budget not found" }, { status: 404 });
    }

    return Response.json(updatedBudget);
  } catch (error: any) {
    console.error("Error updating budget:", error);
    return Response.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

/**
 * DELETE /api/budgets/:id
 * Delete a budget
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await ensureDatabase();

    const id = parseInt(params.id, 10);

    // Validate ID
    if (isNaN(id) || id <= 0) {
      return Response.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const deleted = deleteBudget(id);

    if (!deleted) {
      return Response.json({ error: "Budget not found" }, { status: 404 });
    }

    // Return 204 No Content for successful DELETE
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return Response.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
