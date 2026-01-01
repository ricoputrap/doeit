import { NextRequest } from "next/server";
import { ensureDatabase } from "@/lib/db/init";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/lib/db/repositories/categories";
import type { UpdateCategoryInput } from "@/lib/db/types";

/**
 * GET /api/categories/:id
 * Get a single category by ID
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
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const category = getCategoryById(id);

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return Response.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/categories/:id
 * Update a category
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
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, type } = body as UpdateCategoryInput;

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

    if (type !== undefined) {
      if (!["expense", "income"].includes(type)) {
        return Response.json(
          { error: "Type must be 'expense' or 'income'" },
          { status: 400 },
        );
      }
    }

    const updatedCategory = updateCategory(id, {
      name: name?.trim(),
      type,
    });

    if (!updatedCategory) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json(updatedCategory);
  } catch (error: any) {
    console.error("Error updating category:", error);

    // Handle unique constraint error (category name + type already exists)
    if (error.message && error.message.includes("UNIQUE constraint")) {
      return Response.json(
        { error: "A category with this name and type already exists" },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/categories/:id
 * Delete a category
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
      return Response.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const deleted = deleteCategory(id);

    if (!deleted) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    // Return 204 No Content for successful DELETE
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error("Error deleting category:", error);

    // Handle foreign key constraint error (category has transactions)
    if (error.message && error.message.includes("FOREIGN KEY")) {
      return Response.json(
        {
          error:
            "Cannot delete category that has transactions. Delete or reassign the transactions first.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
