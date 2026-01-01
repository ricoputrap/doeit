import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/lib/db/repositories/transactions";
import type { UpdateTransactionInput } from "@/lib/db/types";

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID
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
      return Response.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    const transaction = getTransactionById(id);

    if (!transaction) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    return Response.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return Response.json(
      { error: "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/transactions/:id
 * Update a transaction
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
      return Response.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      type,
      amount,
      date,
      note,
      wallet_id,
      category_id,
      savings_bucket_id,
    } = body as UpdateTransactionInput;

    // Validate type if provided
    if (type !== undefined) {
      if (!["expense", "income", "transfer", "savings"].includes(type)) {
        return Response.json(
          { error: "Type must be 'expense', 'income', 'transfer', or 'savings'" },
          { status: 400 },
        );
      }
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        return Response.json(
          { error: "Amount must be a positive number" },
          { status: 400 },
        );
      }
    }

    // Validate date if provided
    if (date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Response.json(
          { error: "Date must be in YYYY-MM-DD format" },
          { status: 400 },
        );
      }
    }

    // Validate wallet_id if provided
    if (wallet_id !== undefined) {
      if (typeof wallet_id !== "number" || isNaN(wallet_id) || wallet_id <= 0) {
        return Response.json(
          { error: "Wallet ID must be a positive number" },
          { status: 400 },
        );
      }
    }

    // Validate category_id if provided
    if (category_id !== undefined && category_id !== null) {
      if (typeof category_id !== "number" || isNaN(category_id) || category_id <= 0) {
        return Response.json(
          { error: "Category ID must be a positive number if provided" },
          { status: 400 },
        );
      }
    }

    // Validate savings_bucket_id if provided
    if (savings_bucket_id !== undefined && savings_bucket_id !== null) {
      if (typeof savings_bucket_id !== "number" || isNaN(savings_bucket_id) || savings_bucket_id <= 0) {
        return Response.json(
          { error: "Savings bucket ID must be a positive number if provided" },
          { status: 400 },
        );
      }
    }

    // Validate note length if provided
    if (note !== undefined && note !== null) {
      if (typeof note === "string" && note.length > 500) {
        return Response.json(
          { error: "Note cannot exceed 500 characters" },
          { status: 400 },
        );
      }
    }

    const updatedTransaction = updateTransaction(id, {
      type,
      amount: amount !== undefined ? Math.round(amount) : undefined,
      date,
      note: note !== undefined ? (note?.trim() || null) : undefined,
      wallet_id,
      category_id,
      savings_bucket_id,
    });

    if (!updatedTransaction) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    return Response.json(updatedTransaction);
  } catch (error: any) {
    console.error("Error updating transaction:", error);

    // Handle foreign key constraint errors
    if (error.message && error.message.includes("FOREIGN KEY")) {
      if (error.message.includes("wallet_id")) {
        return Response.json(
          { error: "Invalid wallet ID" },
          { status: 400 },
        );
      }
      if (error.message.includes("category_id")) {
        return Response.json(
          { error: "Invalid category ID" },
          { status: 400 },
        );
      }
      if (error.message.includes("savings_bucket_id")) {
        return Response.json(
          { error: "Invalid savings bucket ID" },
          { status: 400 },
        );
      }
    }

    return Response.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
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
      return Response.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    const deleted = deleteTransaction(id);

    if (!deleted) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Return 204 No Content for successful DELETE
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return Response.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
