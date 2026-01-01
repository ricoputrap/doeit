import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getAllCategories,
  getCategoriesByType,
  createCategory,
} from "@/lib/db/repositories/categories";
import type {
  Category,
  CreateCategoryInput,
  CategoryType,
} from "@/lib/db/types";

/**
 * GET /api/categories
 * Get all categories (optionally filtered by type)
 */
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as CategoryType | null;

    // Validate type if provided
    if (type && !["expense", "income"].includes(type)) {
      return Response.json(
        { error: "Type must be 'expense' or 'income'" },
        { status: 400 },
      );
    }

    let categories: Category[];

    if (type) {
      categories = getCategoriesByType(type);
    } else {
      categories = getAllCategories();
    }

    return Response.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const body = await request.json();
    const { name, type } = body as CreateCategoryInput;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return Response.json(
        { error: "Name is required and must be a string" },
        { status: 400 },
      );
    }

    if (!type || !["expense", "income"].includes(type)) {
      return Response.json(
        { error: "Type is required and must be 'expense' or 'income'" },
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

    const category = createCategory({
      name: name.trim(),
      type,
    });

    return Response.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);

    // Handle unique constraint error (category name + type already exists)
    if (error.message && error.message.includes("UNIQUE constraint")) {
      return Response.json(
        {
          error:
            "A category with this name and type already exists",
        },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
