import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, TrendingUp, Target, PieChart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Doeit
          </h1>
          <Badge variant="secondary" className="ml-2">
            MVP
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your personal finance manager. Track expenses, income, and budgets
          with a clean, simple interface.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Left</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">
              Total across wallets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Getting Started</span>
            </CardTitle>
            <CardDescription>
              Follow these steps to set up your financial tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Add your wallets</p>
                <p className="text-sm text-muted-foreground">
                  Cash, bank accounts, e-wallets
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Create categories</p>
                <p className="text-sm text-muted-foreground">
                  For income and expenses
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Track transactions</p>
                <p className="text-sm text-muted-foreground">
                  Record income and expenses
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Set budgets</p>
                <p className="text-sm text-muted-foreground">
                  Monthly limits per category
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump right into managing your finances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full justify-between">
                View Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/transactions" className="block">
              <Button variant="outline" className="w-full justify-between">
                Add Transaction
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/wallets" className="block">
              <Button variant="outline" className="w-full justify-between">
                Manage Wallets
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/categories" className="block">
              <Button variant="outline" className="w-full justify-between">
                Setup Categories
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>What you can do with Doeit</CardTitle>
          <CardDescription>
            Powerful features to manage your personal finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Track Everything</h3>
              <p className="text-sm text-muted-foreground">
                Record income, expenses, transfers, and savings in one place
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Set Budgets</h3>
              <p className="text-sm text-muted-foreground">
                Create monthly budgets and track your progress
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">View Analytics</h3>
              <p className="text-sm text-muted-foreground">
                See spending patterns and track your net worth over time
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <ArrowRight className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold">Manage Wallets</h3>
              <p className="text-sm text-muted-foreground">
                Track multiple accounts and transfer money between them
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
