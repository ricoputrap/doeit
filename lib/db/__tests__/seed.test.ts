/**
 * Tests for seed data utilities
 * Tests the database seeding functionality for default categories
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  vi,
} from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { categoriesTable } from "../schema";
import {
  seedDefaultCategories,
  clearAllCategories,
  resetCategoriesToDefaults,
  getCategoryCount,
  verifyDefaultCategories,
} from "../seed";
import { eq } from "drizzle-orm";

// Mock the drizzle module before importing
vi.mock("../drizzle", () => ({
  db: {} as any, // Will be replaced in tests
}));

describe("Seed Data Utilities", () => {
  let sqlite: Database;
  let testDb: any;

  beforeEach(() => {
    // Create in-memory SQLite database
    sqlite = new Database(":memory:");
    testDb = drizzle(sqlite);

    // Mock the global db module
    vi.doMock("../drizzle", () => ({
      db: testDb,
    }));
  });

  afterAll(() => {
    if (sqlite) {
      sqlite.close();
    }
  });

  describe("seedDefaultCategories", () => {
    it("should seed all default expense categories", async () => {
      await seedDefaultCategories(testDb);

      // Verify expense categories were added
      const expenseCategories = await testDb
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.type, "expense"));

      expect(expenseCategories).toHaveLength(8);
      const categoryNames = expenseCategories.map((cat: any) => cat.name);
      expect(categoryNames).toContain("Food & Dining");
      expect(categoryNames).toContain("Transportation");
      expect(categoryNames).toContain("Shopping");
      expect(categoryNames).toContain("Bills & Utilities");
      expect(categoryNames).toContain("Entertainment");
      expect(categoryNames).toContain("Healthcare");
      expect(categoryNames).toContain("Education");
      expect(categoryNames).toContain("Other Expense");
    });

    it("should seed all default income categories", async () => {
      await seedDefaultCategories(testDb);

      // Verify income categories were added
      const incomeCategories = await testDb
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.type, "income"));

      expect(incomeCategories).toHaveLength(5);
      const categoryNames = incomeCategories.map((cat: any) => cat.name);
      expect(categoryNames).toContain("Salary");
      expect(categoryNames).toContain("Freelance");
      expect(categoryNames).toContain("Investment");
      expect(categoryNames).toContain("Gift");
      expect(categoryNames).toContain("Other Income");
    });

    it("should use INSERT OR IGNORE semantics (not duplicate existing)", async () => {
      // First seed
      await seedDefaultCategories(testDb);
      const firstCount = await getCategoryCount("expense", testDb);
      expect(firstCount).toBe(8);

      // Second seed should not duplicate
      await seedDefaultCategories(testDb);
      const secondCount = await getCategoryCount("expense", testDb);
      expect(secondCount).toBe(firstCount); // Should remain the same
    });

    it("should handle database errors gracefully", async () => {
      // Close database to force an error
      sqlite.close();

      await expect(seedDefaultCategories(testDb)).rejects.toThrow();
    });
  });

  describe("clearAllCategories", () => {
    it("should remove all categories from database", async () => {
      await seedDefaultCategories(testDb);
      expect(await getCategoryCount("expense", testDb)).toBe(8);
      expect(await getCategoryCount("income", testDb)).toBe(5);

      await clearAllCategories(testDb);

      expect(await getCategoryCount("expense", testDb)).toBe(0);
      expect(await getCategoryCount("income", testDb)).toBe(0);
    });

    it("should work on empty database", async () => {
      await clearAllCategories(testDb); // Should not throw
      expect(await getCategoryCount("expense", testDb)).toBe(0);
    });
  });

  describe("resetCategoriesToDefaults", () => {
    it("should clear and reseed categories", async () => {
      // Add some custom categories first
      await testDb.insert(categoriesTable).values([
        { name: "Custom Category 1", type: "expense" },
        { name: "Custom Category 2", type: "income" },
      ]);

      await resetCategoriesToDefaults(testDb);

      // Should have only default categories
      expect(await getCategoryCount("expense", testDb)).toBe(8);
      expect(await getCategoryCount("income", testDb)).toBe(5);

      // Custom categories should not exist
      const customCategories = await testDb
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.name, "Custom Category 1"));

      expect(customCategories).toHaveLength(0);
    });
  });

  describe("getCategoryCount", () => {
    it("should return correct count for expense categories", async () => {
      expect(await getCategoryCount("expense", testDb)).toBe(0);

      await seedDefaultCategories(testDb);
      expect(await getCategoryCount("expense", testDb)).toBe(8);
    });

    it("should return correct count for income categories", async () => {
      expect(await getCategoryCount("income", testDb)).toBe(0);

      await seedDefaultCategories(testDb);
      expect(await getCategoryCount("income", testDb)).toBe(5);
    });
  });

  describe("verifyDefaultCategories", () => {
    it("should return true when all default categories exist", async () => {
      await seedDefaultCategories(testDb);

      const result = await verifyDefaultCategories(testDb);
      expect(result).toBe(true);
    });

    it("should return false when expense categories are missing", async () => {
      await seedDefaultCategories(testDb);

      // Remove one expense category
      await testDb
        .delete(categoriesTable)
        .where(eq(categoriesTable.name, "Food & Dining"));

      const result = await verifyDefaultCategories(testDb);
      expect(result).toBe(false);
    });

    it("should return false when income categories are missing", async () => {
      await seedDefaultCategories(testDb);

      // Remove one income category
      await testDb
        .delete(categoriesTable)
        .where(eq(categoriesTable.name, "Salary"));

      const result = await verifyDefaultCategories(testDb);
      expect(result).toBe(false);
    });

    it("should return false on empty database", async () => {
      const result = await verifyDefaultCategories(testDb);
      expect(result).toBe(false);
    });

    it("should return false when database has fewer categories than expected", async () => {
      // Only add some categories
      await testDb.insert(categoriesTable).values([
        { name: "Food & Dining", type: "expense" },
        { name: "Transportation", type: "expense" },
        { name: "Salary", type: "income" },
      ]);

      const result = await verifyDefaultCategories(testDb);
      expect(result).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    it("should handle full seeding workflow", async () => {
      // Verify empty database
      expect(await verifyDefaultCategories(testDb)).toBe(false);

      // Seed categories
      await seedDefaultCategories(testDb);

      // Verify all categories exist
      expect(await verifyDefaultCategories(testDb)).toBe(true);
      expect(await getCategoryCount("expense", testDb)).toBe(8);
      expect(await getCategoryCount("income", testDb)).toBe(5);

      // Clear and verify
      await clearAllCategories(testDb);
      expect(await verifyDefaultCategories(testDb)).toBe(false);
    });

    it("should handle reset workflow", async () => {
      // Start with defaults
      await seedDefaultCategories(testDb);
      expect(await getCategoryCount("expense", testDb)).toBe(8);

      // Add custom category
      await testDb.insert(categoriesTable).values({
        name: "Custom Expense",
        type: "expense",
      });
      expect(await getCategoryCount("expense", testDb)).toBe(9);

      // Reset to defaults
      await resetCategoriesToDefaults(testDb);
      expect(await getCategoryCount("expense", testDb)).toBe(8);
      expect(await verifyDefaultCategories(testDb)).toBe(true);
    });
  });
});
