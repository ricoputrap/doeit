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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  BarChart3,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Financial overview for this month
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            January 2025
          </Badge>
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
            <div className="text-2xl font-bold text-green-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0%</span> from last month
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
            <div className="text-2xl font-bold text-red-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+0%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Left</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Rp 0</div>
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
              <BarChart3 className="h-5 w-5" />
              <span>Spending Over Time</span>
            </CardTitle>
            <CardDescription>
              Track your expenses throughout the month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Chart visualization coming soon
                </p>
                <p className="text-xs text-muted-foreground">
                  Add transactions to see your spending trends
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Spending by Category</span>
            </CardTitle>
            <CardDescription>See where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center space-y-2">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Category breakdown coming soon
                </p>
                <p className="text-xs text-muted-foreground">
                  Create categories to organize expenses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">No transactions yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start tracking your finances by adding your first transaction
              </p>
            </div>
            <Link href="/transactions">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/transactions" className="block">
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
            <Link href="/wallets" className="block">
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
            <Link href="/categories" className="block">
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
            <Link href="/budgets" className="block">
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
  );
}
