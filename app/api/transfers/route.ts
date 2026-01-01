import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import { createTransfer } from "@/lib/db/repositories/transactions";
import type { CreateTransferInput } from "@/lib/db/types";

/**
 * POST /api/transfers
 * Create a new transfer between wallets
 * This creates two linked transactions with a shared transfer_id
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { from_wallet_id, to_wallet_id, amount, date, note } =
      body as CreateTransferInput;

    // Validate required fields
    if (typeof from_wallet_id !== "number" || from_wallet_id <= 0) {
      return Response.json(
        { error: "from_wallet_id is required and must be a positive number" },
        { status: 400 },
      );
    }

    if (typeof to_wallet_id !== "number" || to_wallet_id <= 0) {
      return Response.json(
        { error: "to_wallet_id is required and must be a positive number" },
        { status: 400 },
      );
    }

    // Validate that wallets are different
    if (from_wallet_id === to_wallet_id) {
      return Response.json(
        { error: "Source and destination wallets must be different" },
        { status: 400 },
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
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

    // Validate note length if provided
    if (note && typeof note === "string" && note.length > 500) {
      return Response.json(
        { error: "Note cannot exceed 500 characters" },
        { status: 400 },
      );
    }

    // Create the transfer (atomic operation)
    const transfer = createTransfer({
      from_wallet_id,
      to_wallet_id,
      amount: Math.round(amount), // Ensure integer
      date,
      note: note?.trim() || null,
    });

    return Response.json(transfer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transfer:", error);

    // Handle specific error cases from the repository
    if (error.message) {
      if (
        error.message.includes(
          "Source and destination wallets must be different",
        )
      ) {
        return Response.json(
          { error: "Source and destination wallets must be different" },
          { status: 400 },
        );
      }

      if (error.message.includes("Transfer amount must be positive")) {
        return Response.json(
          { error: "Transfer amount must be positive" },
          { status: 400 },
        );
      }
    }

    // Handle foreign key constraint errors
    if (error.message && error.message.includes("FOREIGN KEY")) {
      if (
        error.message.includes("from_wallet_id") ||
        error.message.includes("to_wallet_id")
      ) {
        return Response.json(
          { error: "Invalid wallet ID: one or both wallets do not exist" },
          { status: 400 },
        );
      }
    }

    return Response.json(
      { error: "Failed to create transfer" },
      { status: 500 },
    );
  }
}
