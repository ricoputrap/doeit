import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Doeit</h1>
            <p className="text-sm text-gray-600">Personal Finance Manager</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500"
            >
              Dashboard
            </Link>
            <Link
              href="/transactions"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Transactions
            </Link>
            <Link
              href="/wallets"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Wallets
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Categories
            </Link>
            <Link
              href="/budgets"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Budgets
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Doeit
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Your personal finance manager. Track expenses, income, and
              budgets.
            </p>

            {/* Quick Stats Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-sm font-medium text-blue-600 mb-2">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-blue-900">Rp 0</p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg">
                <p className="text-sm font-medium text-red-600 mb-2">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-red-900">Rp 0</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm font-medium text-green-600 mb-2">
                  Net Worth
                </p>
                <p className="text-2xl font-bold text-green-900">Rp 0</p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-12 text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Next Steps:
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Add your wallets (cash, bank accounts, e-wallets)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Create categories for your income and expenses
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Start tracking your transactions
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Set monthly budgets and monitor your progress
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-sm text-gray-500 text-center">
            Doeit MVP - Desktop-first personal finance manager
          </p>
        </div>
      </footer>
    </div>
  );
}
