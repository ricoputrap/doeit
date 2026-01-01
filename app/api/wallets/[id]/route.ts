import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getWalletById,
  updateWallet,
  deleteWallet,
} from "@/lib/db/repositories/wallets";
import type { UpdateWalletInput } from "@/lib/db/types";

/**
 * GET /api/wallets/:id
 * Get a specific wallet by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await ensureDatabase();

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return Response.json(
        { error: "Invalid wallet ID" },
        { status: 400 },
      );
    }

    const wallet = getWalletById(id);

    if (!wallet) {
      return Response.json(
        { error: "Wallet not found" },
        { status: 404 },
      );
    }

    return Response.json(wallet);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return Response.json(
      { error: "Failed to fetch wallet" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/wallets/:id
 * Update a specific wallet
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await ensureDatabase();

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return Response.json(
        { error: "Invalid wallet ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name } = body as UpdateWalletInput;

    // Validate input if provided
    if (name !== undefined) {
      if (typeof name !== "string") {
        return Response.json(
          { error: "Name must be a string" },
          { status: 400 },
        );
      }

      if (name.trim().length === 0) {
        return Response.json(
          { error: "Name cannot be empty" },
          { status: 400 },
        );
      }

      if (name.length > 100) {
        return Response.json(
          { error: "Name cannot exceed 100 characters" },
          { status: 400 },
        );
      }
    }

    // Check if wallet exists
    const existingWallet = getWalletById(id);
    if (!existingWallet) {
      return Response.json(
        { error: "Wallet not found" },
        { status: 404 },
      );
    }

    const wallet = updateWallet(id, { name: name?.trim() });

    if (!wallet) {
      return Response.json(
        { error: "Failed to update wallet" },
        { status: 500 },
      );
    }

    return Response.json(wallet);
  } catch (error) {
    console.error("Error updating wallet:", error);
    return Response.json(
      { error: "Failed to update wallet" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/wallets/:id
 * Delete a specific wallet
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await ensureDatabase();

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return Response.json(
        { error: "Invalid wallet ID" },
        { status: 400 },
      );
    }

    // Check if wallet exists
    const existingWallet = getWalletById(id);
    if (!existingWallet) {
      return Response.json(
        { error: "Wallet not found" },
        { status: 404 },
      );
    }

    try {
      const deleted = deleteWallet(id);

      if (!deleted) {
        return Response.json(
          { error: "Failed to delete wallet" },
          { status: 500 },
        );
      }

      // Return success with deleted wallet data
      return Response.json({
        success: true,
        message: "Wallet deleted successfully",
        wallet: existingWallet,
      });
    } catch (error: any) {
      // Handle foreign key constraint errors
      if (error.message && error.message.includes("FOREIGN KEY")) {
        return Response.json(
          {
            error: "Cannot delete wallet with existing transactions",
            details: "Please delete all transactions associated with this wallet first",
          },
          { status: 400 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return Response.json(
      { error: "Failed to delete wallet" },
      { status: 500 },
    );
  }
}
