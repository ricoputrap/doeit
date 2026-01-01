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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  PiggyBank,
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  Calendar,
  BarChart3,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useCopyBudgets,
  useCategoriesByType,
  useDateRange,
} from "@/lib/hooks";
import { formatCurrency } from "@/lib/api";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading budgets...</span>
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

function ProgressBar({
  current,
  target,
  label,
}: {
  current: number;
  target: number;
  label: string;
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOverBudget = current > target;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={`font-medium ${isOverBudget ? "text-red-600" : "text-green-600"}`}
        >
          {formatCurrency(current)} / {formatCurrency(target)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isOverBudget
              ? "bg-red-500"
              : percentage > 80
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{percentage.toFixed(1)}%</span>
        <span>
          {isOverBudget
            ? `${formatCurrency(current - target)} over`
            : `${formatCurrency(target - current)} left`}
        </span>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7), // YYYY-MM format
  );

  const {
    data: budgets,
    loading,
    error,
    refetch,
  } = useBudgets({ month: selectedMonth });
  const { execute: createBudget, loading: creating } = useCreateBudget();
  const { execute: updateBudget, loading: updating } = useUpdateBudget();
  const { execute: deleteBudget, loading: deleting } = useDeleteBudget();
  const { execute: copyBudgets, loading: copying } = useCopyBudgets();
  const { data: expenseCategories } = useCategoriesByType("expense");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<number | null>(null);
  const [newBudget, setNewBudget] = useState({
    month: selectedMonth,
    category_id: 0,
    limit_amount: 0,
  });

  const handleCreateBudget = async () => {
    if (!newBudget.category_id || !newBudget.limit_amount) return;

    const result = await createBudget(newBudget);
    if (result) {
      setNewBudget({
        month: selectedMonth,
        category_id: 0,
        limit_amount: 0,
      });
      setShowCreateDialog(false);
      refetch();
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget || !editingBudget.limit_amount) return;

    const result = await updateBudget({
      id: editingBudget.id,
      data: {
        limit_amount: editingBudget.limit_amount,
      },
    });
    if (result) {
      setEditingBudget(null);
      setShowEditDialog(false);
      refetch();
    }
  };

  const handleDeleteBudget = async (id: number) => {
    const result = await deleteBudget(id);
    if (result) {
      setDeletingBudgetId(null);
      refetch();
    }
  };

  const handleCopyFromPrevious = async () => {
    const prevMonth = new Date(selectedMonth + "-01");
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const fromMonth = prevMonth.toISOString().slice(0, 7);

    const result = await copyBudgets({ fromMonth, toMonth: selectedMonth });
    if (result) {
      refetch();
    }
  };

  const startEdit = (budget: any) => {
    setEditingBudget({ ...budget });
    setShowEditDialog(true);
  };

  // Calculate summary statistics
  const summary = budgets?.reduce(
    (acc, budget) => {
      acc.totalBudget += budget.limit_amount;
      acc.totalSpent += budget.spent || 0;
      acc.totalRemaining += budget.remaining || 0;
      if (budget.percentage_used && budget.percentage_used > acc.highestUsage) {
        acc.highestUsage = budget.percentage_used;
      }
      return acc;
    },
    {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      highestUsage: 0,
    },
  ) || {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    highestUsage: 0,
  };

  const budgetUsagePercentage =
    summary.totalBudget > 0
      ? (summary.totalSpent / summary.totalBudget) * 100
      : 0;

  // Get available months for selection
  const getAvailableMonths = () => {
    const months = [];
    const current = new Date();
    for (let i = -6; i <= 6; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      months.push({
        value: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
        }),
      });
    }
    return months;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">
              Set monthly spending limits and track your progress
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
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">
              Set monthly spending limits and track your progress
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Budgets
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
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Set monthly spending limits and track your progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getAvailableMonths().map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCopyFromPrevious}
            variant="outline"
            size="sm"
            disabled={copying}
          >
            {copying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy Previous
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetUsagePercentage.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">Left to spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.highestUsage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Highest usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>
              Budget Overview -{" "}
              {new Date(selectedMonth + "-01").toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
              })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgets && budgets.length > 0 ? (
            <div className="space-y-6">
              {budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{budget.category_name}</h4>
                    <div className="flex items-center space-x-2">
                      {budget.percentage_used &&
                      budget.percentage_used >= 100 ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : budget.percentage_used &&
                        budget.percentage_used >= 80 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <Badge
                        variant={
                          budget.percentage_used &&
                          budget.percentage_used >= 100
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {budget.percentage_used?.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <ProgressBar
                    current={budget.spent || 0}
                    target={budget.limit_amount}
                    label={`${formatCurrency(budget.spent || 0)} of ${formatCurrency(budget.limit_amount)}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No budgets set for this month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budgets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Details</CardTitle>
              <CardDescription>
                Detailed view of your monthly budgets
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Export Budgets</DropdownMenuItem>
                <DropdownMenuItem>View Reports</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {budgets && budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Budget Limit</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {budget.category_name}
                    </TableCell>
                    <TableCell>{formatCurrency(budget.limit_amount)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          budget.spent && budget.spent > budget.limit_amount
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {formatCurrency(budget.spent || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          (budget.remaining || 0) < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(budget.remaining || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              budget.percentage_used &&
                              budget.percentage_used >= 100
                                ? "bg-red-500"
                                : budget.percentage_used &&
                                    budget.percentage_used >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(budget.percentage_used || 0, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {budget.percentage_used?.toFixed(0)}%
                        </span>
                      </div>
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
                          <DropdownMenuItem onClick={() => startEdit(budget)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingBudgetId(budget.id)}
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
                <PiggyBank className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">No budgets yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Set spending limits for your categories to track your budget
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Common Budgets</CardTitle>
          <CardDescription>
            Set up budgets for typical expense categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setNewBudget({
                  month: selectedMonth,
                  category_id: 1,
                  limit_amount: 1500000,
                });
                setShowCreateDialog(true);
              }}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Food & Dining</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Rp 1,500,000/month
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setNewBudget({
                  month: selectedMonth,
                  category_id: 2,
                  limit_amount: 800000,
                });
                setShowCreateDialog(true);
              }}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Transportation</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Rp 800,000/month
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setNewBudget({
                  month: selectedMonth,
                  category_id: 3,
                  limit_amount: 2000000,
                });
                setShowCreateDialog(true);
              }}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">Shopping</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Rp 2,000,000/month
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => {
                setNewBudget({
                  month: selectedMonth,
                  category_id: 4,
                  limit_amount: 500000,
                });
                setShowCreateDialog(true);
              }}
            >
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Entertainment</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Rp 500,000/month
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for a category in{" "}
              {new Date(selectedMonth + "-01").toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
              })}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newBudget.category_id.toString()}
                onValueChange={(value) =>
                  setNewBudget((prev) => ({
                    ...prev,
                    category_id: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories?.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget Limit (IDR)</Label>
              <Input
                type="number"
                value={newBudget.limit_amount || ""}
                onChange={(e) =>
                  setNewBudget((prev) => ({
                    ...prev,
                    limit_amount: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBudget}
              disabled={
                creating || !newBudget.category_id || !newBudget.limit_amount
              }
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update the spending limit for {editingBudget?.category_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={editingBudget?.category_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Budget Limit (IDR)</Label>
              <Input
                type="number"
                value={editingBudget?.limit_amount || ""}
                onChange={(e) =>
                  setEditingBudget((prev) => ({
                    ...prev,
                    limit_amount: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBudget}
              disabled={updating || !editingBudget?.limit_amount}
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingBudgetId !== null}
        onOpenChange={() => setDeletingBudgetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the budget. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingBudgetId && handleDeleteBudget(deletingBudgetId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
