import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getAllWallets,
  createWallet,
  getAllWalletsWithBalances,
} from "@/lib/db/repositories/wallets";
import type {
  Wallet,
  CreateWalletInput,
  WalletWithBalance,
} from "@/lib/db/types";

/**
 * GET /api/wallets
 * Get all wallets (optionally with balances)
 */
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;
    const includeBalances = searchParams.get("includeBalances") === "true";

    if (includeBalances) {
      const wallets = getAllWalletsWithBalances();
      return Response.json(wallets);
    } else {
      const wallets = getAllWallets();
      return Response.json(wallets);
    }
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return Response.json(
      { error: "Failed to fetch wallets" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wallets
 * Create a new wallet
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { name } = body as CreateWalletInput;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return Response.json(
        { error: "Name is required and must be a string" },
        { status: 400 },
      );
    }

    // Validate name length
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

    const wallet = createWallet({ name: name.trim() });
    return Response.json(wallet, { status: 201 });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return Response.json(
      { error: "Failed to create wallet" },
      { status: 500 },
    );
  }
}
