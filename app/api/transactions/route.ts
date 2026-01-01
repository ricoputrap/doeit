import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getTransactions,
  createTransaction,
  countTransactions,
} from "@/lib/db/repositories/transactions";
import type { CreateTransactionInput, TransactionFilter } from "@/lib/db/types";

/**
 * GET /api/transactions
 * Get all transactions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const filter: TransactionFilter = {};

    const type = searchParams.get("type");
    if (type && ["expense", "income", "transfer", "savings"].includes(type)) {
      filter.type = type as any;
    }

    const walletId = searchParams.get("wallet_id");
    if (walletId) {
      const id = parseInt(walletId, 10);
      if (!isNaN(id) && id > 0) {
        filter.wallet_id = id;
      }
    }

    const categoryId = searchParams.get("category_id");
    if (categoryId) {
      const id = parseInt(categoryId, 10);
      if (!isNaN(id) && id > 0) {
        filter.category_id = id;
      }
    }

    const startDate = searchParams.get("start_date");
    if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      filter.start_date = startDate;
    }

    const endDate = searchParams.get("end_date");
    if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      filter.end_date = endDate;
    }

    const limit = searchParams.get("limit");
    if (limit) {
      const lim = parseInt(limit, 10);
      if (!isNaN(lim) && lim > 0 && lim <= 1000) {
        filter.limit = lim;
      }
    }

    const offset = searchParams.get("offset");
    if (offset) {
      const off = parseInt(offset, 10);
      if (!isNaN(off) && off >= 0) {
        filter.offset = off;
      }
    }

    // Get transactions with filter
    const transactions = getTransactions(filter);

    // Get total count for pagination
    const total = countTransactions(filter);

    return Response.json({
      transactions,
      pagination: {
        total,
        limit: filter.limit,
        offset: filter.offset,
        hasMore: filter.offset !== undefined && filter.limit !== undefined
          ? (filter.offset + (filter.limit || 0)) < total
          : false,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const {
      type,
      amount,
      date,
      note,
      wallet_id,
      category_id,
      savings_bucket_id,
    } = body as CreateTransactionInput;

    // Validate required fields
    if (!type || !["expense", "income", "transfer", "savings"].includes(type)) {
      return Response.json(
        { error: "Type is required and must be 'expense', 'income', 'transfer', or 'savings'" },
        { status: 400 },
      );
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return Response.json(
        { error: "Amount is required and must be a positive number" },
        { status: 400 },
      );
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { error: "Date is required and must be in YYYY-MM-DD format" },
        { status: 400 },
      );
    }

    if (typeof wallet_id !== "number" || isNaN(wallet_id) || wallet_id <= 0) {
      return Response.json(
        { error: "Wallet ID is required and must be a positive number" },
        { status: 400 },
      );
    }

    if (category_id !== undefined && category_id !== null) {
      if (typeof category_id !== "number" || isNaN(category_id) || category_id <= 0) {
        return Response.json(
          { error: "Category ID must be a positive number if provided" },
          { status: 400 },
        );
      }
    }

    if (savings_bucket_id !== undefined && savings_bucket_id !== null) {
      if (typeof savings_bucket_id !== "number" || isNaN(savings_bucket_id) || savings_bucket_id <= 0) {
        return Response.json(
          { error: "Savings bucket ID must be a positive number if provided" },
          { status: 400 },
        );
      }
    }

    // Validate note length
    if (note && typeof note === "string" && note.length > 500) {
      return Response.json(
        { error: "Note cannot exceed 500 characters" },
        { status: 400 },
      );
    }

    // Business logic validation
    if (type === "expense" && !category_id) {
      return Response.json(
        { error: "Category ID is required for expense transactions" },
        { status: 400 },
      );
    }

    const transaction = createTransaction({
      type,
      amount: Math.round(amount), // Ensure integer
      date,
      note: note?.trim() || null,
      wallet_id,
      category_id: category_id || null,
      savings_bucket_id: savings_bucket_id || null,
    });

    return Response.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error);

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
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
