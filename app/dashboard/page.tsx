"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  BarChart3,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  Target,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import {
  useDashboardSummary,
  useSpendingByCategory,
  useWalletsWithBalances,
  useDateRange,
} from "@/lib/hooks";
import { formatCurrency, formatDate, formatMonth } from "@/lib/api";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading dashboard...</span>
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

function SimpleBarChart({
  data,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{formatCurrency(item.value)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${item.color || "bg-blue-500"}`}
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SimplePieChart({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              let cumulativePercentage = 0;

              return (
                <path
                  key={index}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-cumulativePercentage}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {total > 0 ? formatCurrency(total) : "No data"}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </div>
              <span className="font-medium">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WalletBalanceCard({
  wallet,
}: {
  wallet: { id: number; name: string; balance: number };
}) {
  const isPositive = wallet.balance >= 0;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-muted rounded-lg">
          <Wallet className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{wallet.name}</p>
          <p className="text-xs text-muted-foreground">
            {isPositive ? "Available" : "Overdrawn"}
          </p>
        </div>
      </div>
      <span
        className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
      >
        {formatCurrency(wallet.balance)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setThisMonth,
    setLastMonth,
    setLast30Days,
  } = useDateRange();
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary(startDate, endDate);
  const {
    data: spendingByCategory,
    loading: categoryLoading,
    error: categoryError,
  } = useSpendingByCategory(startDate, endDate);
  const {
    data: wallets,
    loading: walletsLoading,
    error: walletsError,
  } = useWalletsWithBalances();

  const [selectedPeriod, setSelectedPeriod] = useState<
    "thisMonth" | "lastMonth" | "last30Days" | "custom"
  >("thisMonth");

  const handlePeriodChange = (
    period: "thisMonth" | "lastMonth" | "last30Days" | "custom",
  ) => {
    setSelectedPeriod(period);

    switch (period) {
      case "thisMonth":
        setThisMonth();
        break;
      case "lastMonth":
        setLastMonth();
        break;
      case "last30Days":
        setLast30Days();
        break;
      case "custom":
        // Keep current dates
        break;
    }
  };

  const loading = summaryLoading || categoryLoading || walletsLoading;
  const error = summaryError || categoryError || walletsError;

  // Prepare chart data
  const spendingChartData =
    spendingByCategory?.slice(0, 5).map((item, index) => ({
      label: item.category_name,
      value: item.total,
      color: `hsl(${index * 60}, 70%, 50%)`,
    })) || [];

  const walletChartData =
    wallets?.slice(0, 5).map((wallet, index) => ({
      label: wallet.name,
      value: wallet.balance,
      color: `hsl(${index * 72}, 70%, 50%)`,
    })) || [];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Financial overview and insights
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Financial overview and insights
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetchSummary}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Financial overview and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last30Days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totals.income || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.metrics.savings_rate
                ? `${summary.metrics.savings_rate.toFixed(1)}% savings rate`
                : "This period"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totals.expenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.totals.income
                ? `${((summary.totals.expenses / summary.totals.income) * 100).toFixed(1)}% of income`
                : "This period"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Left</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (summary?.metrics.money_left_to_spend || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(summary?.metrics.money_left_to_spend || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(summary?.totals.net_worth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total across all wallets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Spending by Category</span>
            </CardTitle>
            <CardDescription>
              Top spending categories this period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spendingByCategory && spendingByCategory.length > 0 ? (
              <SimplePieChart data={spendingChartData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  No spending data yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Add transactions to see category breakdown
                </p>
                <Link href="/transactions">
                  <Button size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Wallet Balances</span>
            </CardTitle>
            <CardDescription>
              Current balance across your wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wallets && wallets.length > 0 ? (
              <div className="space-y-4">
                <SimpleBarChart data={walletChartData} />
                <div className="pt-4 border-t">
                  <Link href="/wallets">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Wallets
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  No wallets yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Add your first wallet to get started
                </p>
                <Link href="/wallets">
                  <Button size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Wallet
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wallet Balances & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Wallet Overview</span>
            </CardTitle>
            <CardDescription>Your current wallet balances</CardDescription>
          </CardHeader>
          <CardContent>
            {wallets && wallets.length > 0 ? (
              <div className="space-y-3">
                {wallets.slice(0, 4).map((wallet) => (
                  <WalletBalanceCard key={wallet.id} wallet={wallet} />
                ))}
                {wallets.length > 4 && (
                  <div className="pt-3 border-t">
                    <Link href="/wallets">
                      <Button variant="outline" size="sm" className="w-full">
                        View All {wallets.length} Wallets
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No wallets configured
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common tasks to manage your finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/transactions">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Add Transaction</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Record income or expense
                    </span>
                  </div>
                </Button>
              </Link>
              <Link href="/wallets">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4" />
                      <span className="font-medium">Manage Wallets</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Add or edit accounts
                    </span>
                  </div>
                </Button>
              </Link>
              <Link href="/categories">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center space-x-2">
                      <PieChart className="h-4 w-4" />
                      <span className="font-medium">Categories</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Organize transactions
                    </span>
                  </div>
                </Button>
              </Link>
              <Link href="/budgets">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">Set Budget</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Monthly spending limits
                    </span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Insights</CardTitle>
            <CardDescription>
              Analysis of your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.breakdown.spending_by_category &&
            summary.breakdown.spending_by_category.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Top Category</span>
                    <span className="font-medium">
                      {summary.breakdown.spending_by_category[0]?.category_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Largest Expense</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.max(
                          ...summary.breakdown.spending_by_category.map(
                            (c) => c.total,
                          ),
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Categories Used</span>
                    <span className="font-medium">
                      {summary.breakdown.spending_by_category.length}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Link href="/transactions">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Transactions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No spending data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Your budget status this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  Budget tracking coming soon
                </p>
                <Link href="/budgets">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Set Up Budgets
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
