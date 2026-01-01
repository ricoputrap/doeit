import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import Link from "next/link";

export default function BudgetsPage() {
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
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            January 2025
          </Button>
          <Link href="/budgets/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </Link>
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
            <div className="text-2xl font-bold text-blue-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">Budget used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">Budget left</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-xs text-muted-foreground">Active budgets</p>
          </CardContent>
        </Card>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Month Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                ← Previous
              </Button>
              <div className="text-center">
                <h3 className="font-semibold">January 2025</h3>
                <p className="text-sm text-muted-foreground">Current month</p>
              </div>
              <Button variant="outline" size="sm">
                Next →
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="2025-01">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-12">December 2024</SelectItem>
                  <SelectItem value="2025-01">January 2025</SelectItem>
                  <SelectItem value="2025-02">February 2025</SelectItem>
                  <SelectItem value="2025-03">March 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Budgets</CardTitle>
          <CardDescription>
            Set up common budget categories to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/budgets/new?category=food" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Food & Dining</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Set limit for meals
                  </span>
                </div>
              </Button>
            </Link>
            <Link href="/budgets/new?category=transport" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Transportation</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Fuel, public transport
                  </span>
                </div>
              </Button>
            </Link>
            <Link href="/budgets/new?category=entertainment" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="h-4 w-4" />
                    <span className="font-medium">Entertainment</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Movies, hobbies
                  </span>
                </div>
              </Button>
            </Link>
            <Link href="/budgets/new?category=shopping" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Shopping</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Clothes, purchases
                  </span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Category Budgets</CardTitle>
              <CardDescription>
                Track spending against your monthly limits
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
                  <DropdownMenuItem>Export Budgets</DropdownMenuItem>
                  <DropdownMenuItem>Copy from Last Month</DropdownMenuItem>
                  <DropdownMenuItem>Reset All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-3">
              <PiggyBank className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">No budgets set yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create your first budget to start tracking your spending and
                stay within your limits
              </p>
            </div>
            <Link href="/budgets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Budget Progress Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Budget Alerts</span>
            </CardTitle>
            <CardDescription>Categories approaching limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="font-medium">No alerts yet</p>
                    <p className="text-xs text-muted-foreground">
                      Set budgets to get started
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Budget Success</span>
            </CardTitle>
            <CardDescription>Categories under budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">No data yet</p>
                    <p className="text-xs text-muted-foreground">
                      Create budgets to track success
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Budget Management Tips</CardTitle>
          <CardDescription>
            Make the most of your budget tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold">Getting Started</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Start with Essentials</p>
                    <p className="text-sm text-muted-foreground">
                      Set budgets for must-have categories first
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Be Realistic</p>
                    <p className="text-sm text-muted-foreground">
                      Set achievable limits based on your actual spending
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Review Monthly</p>
                    <p className="text-sm text-muted-foreground">
                      Adjust budgets based on your spending patterns
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Pro Tips</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Use the 50/30/20 Rule</p>
                    <p className="text-sm text-muted-foreground">
                      50% needs, 30% wants, 20% savings
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Set Buffer Limits</p>
                    <p className="text-sm text-muted-foreground">
                      Add 10-15% extra for unexpected expenses
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Track Consistently</p>
                    <p className="text-sm text-muted-foreground">
                      Update your transactions regularly for accuracy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
