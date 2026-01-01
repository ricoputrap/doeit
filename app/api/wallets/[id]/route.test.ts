import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, PUT, DELETE } from "./route";

// Mock the database modules
vi.mock("@/lib/db/init", () => ({
  ensureDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/repositories/wallets", () => ({
  getWalletById: vi.fn(),
  updateWallet: vi.fn(),
  deleteWallet: vi.fn(),
}));

import {
  getWalletById,
  updateWallet,
  deleteWallet,
} from "@/lib/db/repositories/wallets";

describe("GET /api/wallets/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a wallet when found", async () => {
    const mockWallet = {
      id: 1,
      name: "Test Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    };

    vi.mocked(getWalletById).mockReturnValue(mockWallet);

    const response = await GET({} as any, { params: { id: "1" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockWallet);
    expect(getWalletById).toHaveBeenCalledWith(1);
  });

  it("should return 404 when wallet not found", async () => {
    vi.mocked(getWalletById).mockReturnValue(null);

    const response = await GET({} as any, { params: { id: "999" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error", "Wallet not found");
  });

  it("should return 400 for invalid ID", async () => {
    const response = await GET({} as any, { params: { id: "abc" } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error", "Invalid wallet ID");
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(getWalletById).mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await GET({} as any, { params: { id: "1" } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Failed to fetch wallet");
  });
});

describe("PUT /api/wallets/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a wallet with valid data", async () => {
    const mockUpdatedWallet = {
      id: 1,
      name: "Updated Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T11:00:00Z",
    };

    vi.mocked(getWalletById).mockReturnValue({
      id: 1,
      name: "Old Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    });
    vi.mocked(updateWallet).mockReturnValue(mockUpdatedWallet);

    const response = await PUT(
      { json: async () => ({ name: "Updated Wallet" }) } as any,
      { params: { id: "1" } },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockUpdatedWallet);
    expect(updateWallet).toHaveBeenCalledWith(1, { name: "Updated Wallet" });
  });

  it("should return 404 when wallet not found", async () => {
    vi.mocked(getWalletById).mockReturnValue(null);

    const response = await PUT(
      { json: async () => ({ name: "New Name" }) } as any,
      { params: { id: "999" } },
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error", "Wallet not found");
  });

  it("should return 400 for invalid name", async () => {
    vi.mocked(getWalletById).mockReturnValue({
      id: 1,
      name: "Old Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    });

    const response = await PUT({ json: async () => ({ name: "" }) } as any, {
      params: { id: "1" },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error", "Name cannot be empty");
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(getWalletById).mockReturnValue({
      id: 1,
      name: "Old Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    });
    vi.mocked(updateWallet).mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await PUT(
      { json: async () => ({ name: "New Name" }) } as any,
      { params: { id: "1" } },
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Failed to update wallet");
  });
});

describe("DELETE /api/wallets/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a wallet successfully", async () => {
    vi.mocked(getWalletById).mockReturnValue({
      id: 1,
      name: "Test Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    });
    vi.mocked(deleteWallet).mockReturnValue(true);

    const response = await DELETE({} as any, { params: { id: "1" } });

    expect(response.status).toBe(204);
    expect(deleteWallet).toHaveBeenCalledWith(1);
  });

  it("should return 404 when wallet not found", async () => {
    vi.mocked(getWalletById).mockReturnValue(null);

    const response = await DELETE({} as any, { params: { id: "999" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty("error", "Wallet not found");
  });

  it("should handle foreign key constraint errors", async () => {
    vi.mocked(getWalletById).mockReturnValue({
      id: 1,
      name: "Test Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    });

    const error = new Error("FOREIGN KEY constraint failed");
    vi.mocked(deleteWallet).mockImplementation(() => {
      throw error;
    });

    const response = await DELETE({} as any, { params: { id: "1" } });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Cannot delete wallet");
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(getWalletById).mockReturnValue({
      id: 1,
      name: "Test Wallet",
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    });
    vi.mocked(deleteWallet).mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await DELETE({} as any, { params: { id: "1" } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Failed to delete wallet");
  });
});
