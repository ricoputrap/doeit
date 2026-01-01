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
} from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
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
        <Link href="/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
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
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Spending categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Earning categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">-</div>
            <p className="text-xs text-muted-foreground">Top category</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Categories</CardTitle>
          <CardDescription>
            Add common categories to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                Expense Categories
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/categories/new?type=expense&preset=food"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Utensils className="h-4 w-4" />
                        <span className="font-medium">Food & Dining</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Restaurants, groceries
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link
                  href="/categories/new?type=expense&preset=transport"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4" />
                        <span className="font-medium">Transportation</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Fuel, public transport
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link
                  href="/categories/new?type=expense&preset=shopping"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="font-medium">Shopping</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Clothes, electronics
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link
                  href="/categories/new?type=expense&preset=entertainment"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Gamepad2 className="h-4 w-4" />
                        <span className="font-medium">Entertainment</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Movies, games, hobbies
                      </span>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Income Categories
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/categories/new?type=income&preset=salary"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Salary</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Monthly paycheck
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link
                  href="/categories/new?type=income&preset=freelance"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">Freelance</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Side projects
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link
                  href="/categories/new?type=income&preset=investment"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Investment</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Dividends, returns
                      </span>
                    </div>
                  </Button>
                </Link>
                <Link
                  href="/categories/new?type=income&preset=other"
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Other Income</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Miscellaneous earnings
                      </span>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>
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
                Manage your income and expense categories
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense Only</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
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
                  <DropdownMenuItem>Export Categories</DropdownMenuItem>
                  <DropdownMenuItem>Import Categories</DropdownMenuItem>
                  <DropdownMenuItem>Reset to Defaults</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-3">
              <Tags className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">No categories yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create categories to organize your transactions and track
                spending patterns
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/categories/new?type=expense">
                <Button variant="outline" size="sm">
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Add Expense Category
                </Button>
              </Link>
              <Link href="/categories/new?type=income">
                <Button variant="outline" size="sm">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Add Income Category
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Management Tips */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tags className="h-5 w-5" />
              <span>Best Practices</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Be Specific</p>
                  <p className="text-sm text-muted-foreground">
                    Use descriptive names like "Coffee Shops" instead of "Food"
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Keep It Simple</p>
                  <p className="text-sm text-muted-foreground">
                    Start with 10-15 categories, then refine as needed
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Use Consistently</p>
                  <p className="text-sm text-muted-foreground">
                    Apply the same categories to similar transactions
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Review Regularly</p>
                  <p className="text-sm text-muted-foreground">
                    Adjust categories based on your spending patterns
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Suggested Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-red-600">
                  Common Expenses
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Housing</Badge>
                  <Badge variant="outline">Food</Badge>
                  <Badge variant="outline">Transportation</Badge>
                  <Badge variant="outline">Utilities</Badge>
                  <Badge variant="outline">Healthcare</Badge>
                  <Badge variant="outline">Entertainment</Badge>
                  <Badge variant="outline">Shopping</Badge>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-green-600">
                  Common Income
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Salary</Badge>
                  <Badge variant="outline">Freelance</Badge>
                  <Badge variant="outline">Business</Badge>
                  <Badge variant="outline">Investment</Badge>
                  <Badge variant="outline">Rental</Badge>
                  <Badge variant="outline">Gift</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
