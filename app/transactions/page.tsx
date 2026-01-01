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
  ArrowLeftRight,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  Heart,
  Music,
  BookOpen,
  Plane,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useWallets,
  useCategories,
  useDateRange,
} from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/api";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading transactions...</span>
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

function getTransactionIcon(type: string, categoryName: string) {
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
  };

  const lowerName = categoryName.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return <Icon className="h-4 w-4" />;
    }
  }

  return type === "income" ? (
    <TrendingUp className="h-4 w-4 text-green-600" />
  ) : type === "transfer" ? (
    <ArrowLeftRight className="h-4 w-4 text-blue-600" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-600" />
  );
}

function TransactionForm({
  onSubmit,
  loading = false,
  initialData,
  wallets,
  categories,
  submitLabel = "Add Transaction",
  title = "Add New Transaction",
}: {
  onSubmit: (data: {
    type: "income" | "expense";
    amount: number;
    date: string;
    note?: string;
    wallet_id: number;
    category_id?: number;
  }) => Promise<void>;
  loading?: boolean;
  initialData?: {
    type?: "income" | "expense";
    amount?: number;
    date?: string;
    note?: string;
    wallet_id?: number;
    category_id?: number;
  };
  wallets: any[];
  categories: any[];
  submitLabel?: string;
  title?: string;
}) {
  const [type, setType] = useState<"income" | "expense">(
    initialData?.type || "expense",
  );
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState(initialData?.note || "");
  const [walletId, setWalletId] = useState(
    initialData?.wallet_id?.toString() || "",
  );
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id?.toString() || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!walletId || isNaN(Number(walletId))) {
      newErrors.wallet_id = "Wallet is required";
    }

    if (type === "expense" && (!categoryId || isNaN(Number(categoryId)))) {
      newErrors.category_id = "Category is required for expenses";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      type,
      amount: Number(amount),
      date,
      note: note.trim() || undefined,
      wallet_id: Number(walletId),
      category_id: type === "expense" ? Number(categoryId) : undefined,
    });
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transaction-type">Type</Label>
          <Select
            value={type}
            onValueChange={(value: "income" | "expense") => setType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-amount">Amount (IDR)</Label>
          <Input
            id="transaction-amount"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
            }}
            placeholder="0"
            disabled={loading}
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transaction-date">Date</Label>
          <Input
            id="transaction-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
            }}
            disabled={loading}
          />
          {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-wallet">Wallet</Label>
          <Select value={walletId} onValueChange={setWalletId}>
            <SelectTrigger>
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id.toString()}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wallet_id && (
            <p className="text-sm text-red-600">{errors.wallet_id}</p>
          )}
        </div>
      </div>

      {type === "expense" && (
        <div className="space-y-2">
          <Label htmlFor="transaction-category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-sm text-red-600">{errors.category_id}</p>
          )}
        </div>
      )}

      {type === "income" && (
        <div className="space-y-2">
          <Label htmlFor="transaction-category">Category (Optional)</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {incomeCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="transaction-note">Note (Optional)</Label>
        <Input
          id="transaction-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          disabled={loading}
          maxLength={500}
        />
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

export default function TransactionsPage() {
  const { data: transactionsData, loading, error, refetch } = useTransactions();
  const { data: wallets } = useWallets();
  const { data: categories } = useCategories();
  const { execute: createTransaction, loading: creating } =
    useCreateTransaction();
  const { execute: updateTransaction, loading: updating } =
    useUpdateTransaction();
  const { execute: deleteTransaction, loading: deleting } =
    useDeleteTransaction();
  const { execute: createTransfer, loading: transferring } =
    useCreateTransfer();

  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    number | null
  >(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    from_wallet_id: 0,
    to_wallet_id: 0,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleCreateTransaction = async (data: any) => {
    const result = await createTransaction(data);
    if (result) {
      setShowCreateDialog(false);
      refetch();
    }
  };

  const handleUpdateTransaction = async (data: any) => {
    if (!editingTransaction) return;

    const result = await updateTransaction({ id: editingTransaction.id, data });
    if (result) {
      setEditingTransaction(null);
      setShowEditDialog(false);
      refetch();
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    const result = await deleteTransaction(id);
    if (result) {
      setDeletingTransactionId(null);
      refetch();
    }
  };

  const handleCreateTransfer = async () => {
    if (
      !newTransfer.amount ||
      !newTransfer.from_wallet_id ||
      !newTransfer.to_wallet_id
    )
      return;
    if (newTransfer.from_wallet_id === newTransfer.to_wallet_id) return;

    const result = await createTransfer(newTransfer);
    if (result) {
      setNewTransfer({
        from_wallet_id: 0,
        to_wallet_id: 0,
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
      setShowTransferDialog(false);
      refetch();
    }
  };

  const startEdit = (transaction: any) => {
    setEditingTransaction({ ...transaction });
    setShowEditDialog(true);
  };

  // Filter transactions
  const transactions = transactionsData?.transactions || [];
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      !searchTerm ||
      transaction.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm);

    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesWallet =
      filterWallet === "all" ||
      transaction.wallet_id.toString() === filterWallet;
    const matchesCategory =
      filterCategory === "all" ||
      transaction.category_id?.toString() === filterCategory;

    return matchesSearch && matchesType && matchesWallet && matchesCategory;
  });

  // Calculate summary statistics
  const currentMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const now = new Date();
    return (
      transactionDate.getMonth() === now.getMonth() &&
      transactionDate.getFullYear() === now.getFullYear()
    );
  });

  const summary = currentMonthTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        acc.totalExpenses += transaction.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 },
  );

  const netCashflow = summary.totalIncome - summary.totalExpenses;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Track your income, expenses, and transfers
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
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Track your income, expenses, and transfers
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Transactions
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
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Track your income, expenses, and transfers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                currentMonthTransactions.filter((t) => t.type === "income")
                  .length
              }{" "}
              transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                currentMonthTransactions.filter((t) => t.type === "expense")
                  .length
              }{" "}
              transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netCashflow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(netCashflow)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Transaction</CardTitle>
          <CardDescription>
            Add common transactions to get started quickly
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
                  Restaurant, groceries
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
                  Gas, rideshare, parking
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
                  Regular income
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
                  <ShoppingBag className="h-4 w-4" />
                  <span className="font-medium">Shopping</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Personal purchases
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filterType}
              onValueChange={(value: any) => setFilterType(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterWallet} onValueChange={setFilterWallet}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Wallets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wallets</SelectItem>
                {wallets?.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id.toString()}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTransferDialog(true)}
                size="sm"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Transfer
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
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "income"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          transaction.type === "income"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(
                          transaction.type,
                          transaction.category_id?.toString() || "",
                        )}
                        <span className="font-medium">
                          {transaction.note ||
                            `${transaction.type} transaction`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.category_id || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {wallets?.find((w) => w.id === transaction.wallet_id)
                        ?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
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
                          <DropdownMenuItem
                            onClick={() => startEdit(transaction)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              setDeletingTransactionId(transaction.id)
                            }
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
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">
                  {searchTerm ||
                  filterType !== "all" ||
                  filterWallet !== "all" ||
                  filterCategory !== "all"
                    ? "No matching transactions"
                    : "No transactions yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchTerm ||
                  filterType !== "all" ||
                  filterWallet !== "all" ||
                  filterCategory !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Start tracking your finances by adding your first transaction"}
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transaction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Record a new income or expense transaction.
            </DialogDescription>
          </DialogHeader>
          {wallets && categories && (
            <TransactionForm
              onSubmit={handleCreateTransaction}
              loading={creating}
              wallets={wallets}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update your transaction details.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && wallets && categories && (
            <TransactionForm
              onSubmit={handleUpdateTransaction}
              loading={updating}
              initialData={editingTransaction}
              wallets={wallets}
              categories={categories}
              submitLabel="Update Transaction"
              title="Edit Transaction"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
            <DialogDescription>
              Move money between your wallets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Wallet</Label>
                <Select
                  value={newTransfer.from_wallet_id.toString()}
                  onValueChange={(value) =>
                    setNewTransfer((prev) => ({
                      ...prev,
                      from_wallet_id: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Wallet</Label>
                <Select
                  value={newTransfer.to_wallet_id.toString()}
                  onValueChange={(value) =>
                    setNewTransfer((prev) => ({
                      ...prev,
                      to_wallet_id: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={newTransfer.amount || ""}
                  onChange={(e) =>
                    setNewTransfer((prev) => ({
                      ...prev,
                      amount: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newTransfer.date}
                  onChange={(e) =>
                    setNewTransfer((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input
                value={newTransfer.note}
                onChange={(e) =>
                  setNewTransfer((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Add a description..."
              />
            </div>
            {newTransfer.from_wallet_id === newTransfer.to_wallet_id &&
              newTransfer.from_wallet_id !== 0 && (
                <p className="text-sm text-red-600">
                  Source and destination wallets must be different
                </p>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransferDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTransfer}
              disabled={
                transferring ||
                !newTransfer.amount ||
                !newTransfer.from_wallet_id ||
                !newTransfer.to_wallet_id ||
                newTransfer.from_wallet_id === newTransfer.to_wallet_id
              }
            >
              {transferring && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Transfer Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingTransactionId !== null}
        onOpenChange={() => setDeletingTransactionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transaction. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingTransactionId &&
                handleDeleteTransaction(deletingTransactionId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
