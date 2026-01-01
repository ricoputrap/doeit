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
  Wallet,
  Plus,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  CreditCard,
  Building,
  Smartphone,
  PiggyBank,
  ArrowUpDown,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useWalletsWithBalances,
  useCreateWallet,
  useUpdateWallet,
  useDeleteWallet,
} from "@/lib/hooks";
import { formatCurrency } from "@/lib/api";

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading wallets...</p>
      </div>
    </div>
  );
}

// Error component
function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="rounded-full bg-red-100 p-3">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold">Error Loading Wallets</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

// Wallet form component
function WalletForm({
  onSubmit,
  loading = false,
  initialName = "",
  submitLabel = "Create Wallet",
  title = "Add New Wallet",
}: {
  onSubmit: (data: { name: string }) => Promise<void>;
  loading?: boolean;
  initialName?: string;
  submitLabel?: string;
  title?: string;
}) {
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Wallet name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({ name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Wallet Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
          }}
          placeholder="e.g., BCA Savings, GoPay, Cash"
          disabled={loading}
          maxLength={100}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
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

export default function WalletsPage() {
  const { data: wallets, loading, error, refetch } = useWalletsWithBalances();
  const { execute: createWallet, loading: creating } = useCreateWallet();
  const { execute: updateWallet, loading: updating } = useUpdateWallet();
  const { execute: deleteWallet, loading: deleting } = useDeleteWallet();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingWalletId, setDeletingWalletId] = useState<number | null>(null);

  const handleCreateWallet = async (data: { name: string }) => {
    const result = await createWallet(data);
    if (result) {
      setShowCreateDialog(false);
      refetch();
    }
  };

  const handleUpdateWallet = async (data: { name: string }) => {
    if (!editingWallet) return;

    const result = await updateWallet({ id: editingWallet.id, data });
    if (result) {
      setShowEditDialog(false);
      setEditingWallet(null);
      refetch();
    }
  };

  const handleDeleteWallet = async () => {
    if (!deletingWalletId) return;

    const result = await deleteWallet(deletingWalletId);
    if (result) {
      setDeletingWalletId(null);
      refetch();
    }
  };

  // Calculate summary statistics
  const summary = wallets?.reduce(
    (acc, wallet) => {
      acc.totalNetWorth += wallet.balance;
      acc.totalWallets += 1;
      if (wallet.balance > acc.highestBalance) {
        acc.highestBalance = wallet.balance;
      }
      return acc;
    },
    {
      totalNetWorth: 0,
      totalWallets: 0,
      highestBalance: 0,
    },
  ) || {
    totalNetWorth: 0,
    totalWallets: 0,
    highestBalance: 0,
  };

  const averageBalance =
    summary.totalWallets > 0 ? summary.totalNetWorth / summary.totalWallets : 0;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your cash, bank accounts, and digital wallets
            </p>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your cash, bank accounts, and digital wallets
            </p>
          </div>
        </div>
        <Card>
          <CardContent>
            <ErrorMessage message={error} onRetry={refetch} />
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
          <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
          <p className="text-muted-foreground">
            Manage your cash, bank accounts, and digital wallets
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Wallet
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Net Worth
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.totalNetWorth)}
            </div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalWallets}
            </div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Balance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(averageBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Per wallet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Highest Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.highestBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Top wallet</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Wallet</CardTitle>
          <CardDescription>
            Add a new wallet to start tracking your finances
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
                  <Building className="h-4 w-4" />
                  <span className="font-medium">Bank Account</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Savings, checking accounts
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
                  <Smartphone className="h-4 w-4" />
                  <span className="font-medium">E-Wallet</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  GoPay, OVO, DANA, etc.
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
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Cash</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Physical money
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
                  <span className="font-medium">Investment</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Stocks, mutual funds
                </span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Wallets</CardTitle>
              <CardDescription>
                All your financial accounts and their balances
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
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
          {wallets && wallets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span>{wallet.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          wallet.balance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(wallet.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(wallet.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
                            onClick={() => {
                              setEditingWallet(wallet);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/transactions?wallet=${wallet.id}`}>
                              View Transactions
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingWalletId(wallet.id)}
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
                <h3 className="font-semibold">No wallets yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Add your first wallet to start tracking your finances across
                  different accounts
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Types Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Why track multiple wallets?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Complete Financial Picture</p>
                  <p className="text-sm text-muted-foreground">
                    See your total net worth across all accounts
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Better Organization</p>
                  <p className="text-sm text-muted-foreground">
                    Separate money for different purposes
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Track Transfers</p>
                  <p className="text-sm text-muted-foreground">
                    Move money between accounts seamlessly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PiggyBank className="h-5 w-5" />
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
                  <p className="font-medium">Add Main Account</p>
                  <p className="text-sm text-muted-foreground">
                    Start with your primary bank account
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Add E-Wallets</p>
                  <p className="text-sm text-muted-foreground">
                    Include digital payment platforms
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Track Cash</p>
                  <p className="text-sm text-muted-foreground">
                    Don't forget physical money
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Wallet Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
            <DialogDescription>
              Create a new wallet to track your finances. You can always edit or
              delete it later.
            </DialogDescription>
          </DialogHeader>
          <WalletForm onSubmit={handleCreateWallet} loading={creating} />
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingWallet(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
            <DialogDescription>
              Update your wallet information.
            </DialogDescription>
          </DialogHeader>
          {editingWallet && (
            <WalletForm
              onSubmit={handleUpdateWallet}
              loading={updating}
              initialName={editingWallet.name}
              submitLabel="Update Wallet"
              title="Edit Wallet"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingWalletId !== null}
        onOpenChange={(open) => !open && setDeletingWalletId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the wallet and remove all associated
              transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWallet}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
