"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tags,
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  Heart,
  Music,
  BookOpen,
  Plane,
  ArrowUpDown,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useCategories,
  useCategoriesWithSpent,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/lib/hooks";
import { formatCurrency } from "@/lib/api";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading categories...</span>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-red-600">
      <AlertCircle className="h-5 w-5 mr-2" />
      <span>{message}</span>
    </div>
  );
}

function CategoryForm({
  onSubmit,
  loading = false,
  initialData,
  submitLabel = "Create Category",
}: {
  onSubmit: (data: {
    name: string;
    type: "income" | "expense";
  }) => Promise<void>;
  loading?: boolean;
  initialData?: { name?: string; type?: "income" | "expense" };
  submitLabel?: string;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<"income" | "expense">(
    initialData?.type || "expense",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Category name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }

    if (!["income", "expense"].includes(type)) {
      newErrors.type = "Valid type is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({ name: name.trim(), type });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Category Name</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          placeholder="e.g., Food & Dining, Salary, Rent"
          disabled={loading}
          maxLength={100}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-type">Type</Label>
        <Select
          value={type}
          onValueChange={(value: "income" | "expense") => setType(value)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function getCategoryIcon(name: string, type: "income" | "expense") {
  const iconMap: Record<string, any> = {
    food: Utensils,
    dining: Utensils,
    restaurant: Utensils,
    transportation: Car,
    transport: Car,
    fuel: Car,
    shopping: ShoppingBag,
    grocery: ShoppingBag,
    entertainment: Gamepad2,
    gaming: Gamepad2,
    health: Heart,
    medical: Heart,
    education: BookOpen,
    books: BookOpen,
    travel: Plane,
    vacation: Plane,
    home: Home,
    rent: Home,
    utilities: Home,
    salary: TrendingUp,
    income: TrendingUp,
    bonus: TrendingUp,
    investment: TrendingUp,
  };

  const lowerName = name.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return <Icon className="h-4 w-4" />;
    }
  }

  return type === "income" ? (
    <TrendingUp className="h-4 w-4 text-green-600" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-600" />
  );
}

export default function CategoriesPage() {
  const {
    data: categories,
    loading,
    error,
    refetch,
  } = useCategoriesWithSpent();
  const { execute: createCategory, loading: creating } = useCreateCategory();
  const { execute: updateCategory, loading: updating } = useUpdateCategory();
  const { execute: deleteCategory, loading: deleting } = useDeleteCategory();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null,
  );
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );

  const handleCreateCategory = async (data: {
    name: string;
    type: "income" | "expense";
  }) => {
    const result = await createCategory(data);
    if (result) {
      setShowCreateDialog(false);
      refetch();
    }
  };

  const handleUpdateCategory = async (data: {
    name: string;
    type: "income" | "expense";
  }) => {
    if (!editingCategory) return;

    const result = await updateCategory({ id: editingCategory.id, data });
    if (result) {
      setEditingCategory(null);
      setShowEditDialog(false);
      refetch();
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const result = await deleteCategory(id);
    if (result) {
      setDeletingCategoryId(null);
      refetch();
    }
  };

  const startEdit = (category: any) => {
    setEditingCategory({ ...category });
    setShowEditDialog(true);
  };

  // Calculate summary statistics
  const summary = categories?.reduce(
    (acc, category) => {
      acc.totalCategories += 1;
      if (category.type === "expense") {
        acc.expenseCategories += 1;
        acc.totalSpent += category.spent || 0;
      } else {
        acc.incomeCategories += 1;
      }
      return acc;
    },
    {
      totalCategories: 0,
      expenseCategories: 0,
      incomeCategories: 0,
      totalSpent: 0,
    },
  ) || {
    totalCategories: 0,
    expenseCategories: 0,
    incomeCategories: 0,
    totalSpent: 0,
  };

  // Filter categories based on selected type
  const filteredCategories =
    categories?.filter(
      (category) => filterType === "all" || category.type === filterType,
    ) || [];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Organize your income and expenses with custom categories
            </p>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Organize your income and expenses with custom categories
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Categories
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your income and expenses with custom categories
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Categories
            </CardTitle>
            <Tags className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalCategories}
            </div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.expenseCategories}
            </div>
            <p className="text-xs text-muted-foreground">Spending categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.incomeCategories}
            </div>
            <p className="text-xs text-muted-foreground">Earning categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Common Categories</CardTitle>
          <CardDescription>
            Add frequently used categories to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <Utensils className="h-4 w-4" />
                  <span className="font-medium">Food & Dining</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Restaurants, groceries, snacks
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Salary</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Regular employment income
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span className="font-medium">Transportation</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Fuel, public transport, rideshare
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span className="font-medium">Housing</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Rent, utilities, maintenance
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Categories</CardTitle>
              <CardDescription>
                All your income and expense categories
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={filterType}
                onValueChange={(value: "all" | "income" | "expense") =>
                  setFilterType(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                  <DropdownMenuItem>View Reports</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category.name, category.type)}
                        <span>{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.type === "income" ? "default" : "destructive"
                        }
                      >
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.spent !== undefined ? (
                        <span
                          className={`font-medium ${
                            category.spent > 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatCurrency(category.spent)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => startEdit(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/transactions?category=${category.id}`}
                            >
                              View Transactions
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingCategoryId(category.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-3">
                <Tags className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">
                  {filterType === "all"
                    ? "No categories yet"
                    : `No ${filterType} categories`}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {filterType === "all"
                    ? "Add your first category to start organizing your transactions"
                    : `Create a ${filterType} category to get started`}
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Types Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tags className="h-5 w-5" />
              <span>Why use categories?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Better Organization</p>
                  <p className="text-sm text-muted-foreground">
                    Group similar transactions for easier tracking
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Budget Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    Set spending limits per category
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Spending Insights</p>
                  <p className="text-sm text-muted-foreground">
                    See where your money goes with detailed reports
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowUpDown className="h-5 w-5" />
              <span>Getting Started Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Start with Basics</p>
                  <p className="text-sm text-muted-foreground">
                    Food, Transportation, Housing, Salary
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Be Specific</p>
                  <p className="text-sm text-muted-foreground">
                    "Food & Dining" vs just "Food"
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Review Regularly</p>
                  <p className="text-sm text-muted-foreground">
                    Add new categories as needed
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your transactions. You can
              always edit or delete it later.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm onSubmit={handleCreateCategory} loading={creating} />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update your category information.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              onSubmit={handleUpdateCategory}
              loading={updating}
              initialData={{
                name: editingCategory.name,
                type: editingCategory.type,
              }}
              submitLabel="Update Category"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingCategoryId !== null}
        onOpenChange={() => setDeletingCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category and remove it from all
              associated transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingCategoryId && handleDeleteCategory(deletingCategoryId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
