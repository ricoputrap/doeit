"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  PiggyBank,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description?: string
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: "Financial overview"
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    description: "Track income & expenses"
  },
  {
    href: "/wallets",
    label: "Wallets",
    icon: <Wallet className="h-5 w-5" />,
    description: "Manage your accounts"
  },
  {
    href: "/categories",
    label: "Categories",
    icon: <Tags className="h-5 w-5" />,
    description: "Organize transactions"
  },
  {
    href: "/budgets",
    label: "Budgets",
    icon: <PiggyBank className="h-5 w-5" />,
    description: "Monthly limits"
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          {/* App Branding */}
          <div className="flex items-center space-x-2 px-4 py-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Doeit</h2>
              <p className="text-xs text-muted-foreground">Personal Finance</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Navigation
              </h2>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-auto p-3",
                          isActive && "bg-secondary"
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "mt-0.5",
                            isActive ? "text-blue-600" : "text-muted-foreground"
                          )}>
                            {item.icon}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="px-3 py-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Net Worth
              </h3>
              <p className="text-2xl font-bold text-blue-700">Rp 0</p>
              <p className="text-xs text-blue-600 mt-1">
                Total across all wallets
              </p>
            </Card>
          </div>

          {/* Footer */}
          <div className="px-3 py-4 mt-auto">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Doeit MVP v0.1.0
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Desktop-first finance manager
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
