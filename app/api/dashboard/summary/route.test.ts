import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";

// Mock the database modules
vi.mock("@/lib/db/init", () => ({
  ensureDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/repositories/transactions", () => ({
  getTotalIncome: vi.fn(),
  getTotalExpenses: vi.fn(),
  getNetWorth: vi.fn(),
  getSpendingByCategory: vi.fn(),
}));

vi.mock("@/lib/db/repositories/wallets", () => ({
  getAllWalletsWithBalances: vi.fn(),
}));

import {
  getTotalIncome,
  getTotalExpenses,
  getNetWorth,
} from "@/lib/db/repositories/transactions";
import { getAllWalletsWithBalances } from "@/lib/db/repositories/wallets";

// Mock NextRequest
const mockNextRequest = (url: string) => {
  const urlObj = new URL(url, "http://localhost");
  const request = {
    nextUrl: urlObj,
  } as any;

  return request;
};

describe("GET /api/dashboard/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return summary with default current month date range", async () => {
    const mockWallets = [
      {
        id: 1,
        name: "Main Wallet",
        balance: 1500000,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Savings",
        balance: 500000,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    vi.mocked(getTotalIncome).mockReturnValue(3000000);
    vi.mocked(getTotalExpenses).mockReturnValue(2000000);
    vi.mocked(getNetWorth).mockReturnValue(2000000);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue(mockWallets);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("period");
    expect(data).toHaveProperty("totals");
    expect(data).toHaveProperty("netWorth");
    expect(data).toHaveProperty("moneyLeftToSpend");
    expect(data).toHaveProperty("walletCount");
    expect(data).toHaveProperty("wallets");

    expect(data.totals.income).toBe(3000000);
    expect(data.totals.expenses).toBe(2000000);
    expect(data.totals.net).toBe(1000000);
    expect(data.netWorth).toBe(2000000);
    expect(data.moneyLeftToSpend).toBe(1000000);
    expect(data.walletCount).toBe(2);
    expect(data.wallets).toEqual(mockWallets);
  });

  it("should use custom date range when provided", async () => {
    vi.mocked(getTotalIncome).mockReturnValue(1500000);
    vi.mocked(getTotalExpenses).mockReturnValue(1000000);
    vi.mocked(getNetWorth).mockReturnValue(2000000);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(
      mockNextRequest(
        "/api/dashboard/summary?start_date=2024-01-01&end_date=2024-01-31",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getTotalIncome).toHaveBeenCalledWith("2024-01-01", "2024-01-31");
    expect(getTotalExpenses).toHaveBeenCalledWith("2024-01-01", "2024-01-31");
    expect(data.period.start).toBe("2024-01-01");
    expect(data.period.end).toBe("2024-01-31");
  });

  it("should return 400 for invalid date format", async () => {
    const response = await GET(
      mockNextRequest(
        "/api/dashboard/summary?start_date=invalid&end_date=2024-01-31",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error", "Dates must be in YYYY-MM-DD format");
  });

  it("should return 400 when only start_date is provided", async () => {
    const response = await GET(
      mockNextRequest("/api/dashboard/summary?start_date=2024-01-01"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error", "Dates must be in YYYY-MM-DD format");
  });

  it("should return 400 when only end_date is provided", async () => {
    const response = await GET(
      mockNextRequest("/api/dashboard/summary?end_date=2024-01-31"),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error", "Dates must be in YYYY-MM-DD format");
  });

  it("should handle zero values correctly", async () => {
    vi.mocked(getTotalIncome).mockReturnValue(0);
    vi.mocked(getTotalExpenses).mockReturnValue(0);
    vi.mocked(getNetWorth).mockReturnValue(0);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totals.income).toBe(0);
    expect(data.totals.expenses).toBe(0);
    expect(data.totals.net).toBe(0);
    expect(data.netWorth).toBe(0);
    expect(data.moneyLeftToSpend).toBe(0);
  });

  it("should handle negative net amount correctly", async () => {
    vi.mocked(getTotalIncome).mockReturnValue(1000000);
    vi.mocked(getTotalExpenses).mockReturnValue(2000000);
    vi.mocked(getNetWorth).mockReturnValue(500000);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totals.income).toBe(1000000);
    expect(data.totals.expenses).toBe(2000000);
    expect(data.totals.net).toBe(-1000000);
    expect(data.moneyLeftToSpend).toBe(-1000000);
  });

  it("should format wallet data correctly", async () => {
    const mockWallets = [
      {
        id: 1,
        name: "Wallet 1",
        balance: 1000000,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Wallet 2",
        balance: -500000,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    vi.mocked(getTotalIncome).mockReturnValue(0);
    vi.mocked(getTotalExpenses).mockReturnValue(0);
    vi.mocked(getNetWorth).mockReturnValue(500000);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue(mockWallets);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.wallets).toHaveLength(2);
    expect(data.wallets[0]).toHaveProperty("id");
    expect(data.wallets[0]).toHaveProperty("name");
    expect(data.wallets[0]).toHaveProperty("balance");
    expect(data.wallets[1].balance).toBe(-500000);
  });

  it("should handle empty wallets list", async () => {
    vi.mocked(getTotalIncome).mockReturnValue(1000000);
    vi.mocked(getTotalExpenses).mockReturnValue(500000);
    vi.mocked(getNetWorth).mockReturnValue(500000);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.walletCount).toBe(0);
    expect(data.wallets).toEqual([]);
  });

  it("should handle database errors gracefully", async () => {
    vi.mocked(getTotalIncome).mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty("error", "Failed to fetch dashboard summary");
  });

  it("should calculate correct net amount (income - expenses)", async () => {
    vi.mocked(getTotalIncome).mockReturnValue(5000000);
    vi.mocked(getTotalExpenses).mockReturnValue(3000000);
    vi.mocked(getNetWorth).mockReturnValue(10000000);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totals.net).toBe(2000000); // 5000000 - 3000000
    expect(data.moneyLeftToSpend).toBe(2000000);
  });

  it("should use correct default date range for current month", async () => {
    // Mock the current date to January 15, 2024
    const mockDate = new Date("2024-01-15T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    vi.mocked(getTotalIncome).mockReturnValue(0);
    vi.mocked(getTotalExpenses).mockReturnValue(0);
    vi.mocked(getNetWorth).mockReturnValue(0);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.start).toBe("2024-01-01"); // Start of January
    expect(data.period.end).toBe("2024-02-01"); // Start of February (end of January)

    vi.useRealTimers();
  });

  it("should use correct default date range for December", async () => {
    // Mock the current date to December 15, 2024
    const mockDate = new Date("2024-12-15T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    vi.mocked(getTotalIncome).mockReturnValue(0);
    vi.mocked(getTotalExpenses).mockReturnValue(0);
    vi.mocked(getNetWorth).mockReturnValue(0);
    vi.mocked(getSpendingByCategory).mockReturnValue([]);
    vi.mocked(getAllWalletsWithBalances).mockReturnValue([]);
    vi.mocked(getCategoriesByType).mockReturnValue([]);

    const response = await GET(mockNextRequest("/api/dashboard/summary"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.start).toBe("2024-12-01"); // Start of December
    expect(data.period.end).toBe("2025-01-01"); // Start of January next year

    vi.useRealTimers();
  });
});
