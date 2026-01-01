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
} from "lucide-react";
import Link from "next/link";

export default function WalletsPage() {
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
        <Link href="/wallets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Wallet
          </Button>
        </Link>
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
            <div className="text-2xl font-bold text-blue-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-Wallets</CardTitle>
            <Smartphone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-xs text-muted-foreground">Digital wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Rp 0</div>
            <p className="text-xs text-muted-foreground">Physical cash</p>
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
            <Link href="/wallets/new?type=bank" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
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
            </Link>
            <Link href="/wallets/new?type=ewallet" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
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
            </Link>
            <Link href="/wallets/new?type=cash" className="block">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
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
            </Link>
            <Link href="/wallets/new?type=investment" className="block">
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
                    Stocks, mutual funds
                  </span>
                </div>
              </Button>
            </Link>
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
            <Link href="/wallets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Wallet
              </Button>
            </Link>
          </div>
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
    </div>
  );
}
