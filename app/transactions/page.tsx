export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-600">
              Track your income and expenses
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <a
              href="/dashboard"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Dashboard
            </a>
            <div className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
              Transactions
            </div>
            <a
              href="/wallets"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Wallets
            </a>
            <a
              href="/categories"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Categories
            </a>
            <a
              href="/budgets"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Budgets
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar Placeholder */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 3 Months</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                <option>All</option>
                <option>Income</option>
                <option>Expense</option>
                <option>Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet
              </label>
              <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                <option>All Wallets</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Add Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction History
            </h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No transactions yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Start tracking your income and expenses
            </p>
            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                + Add Income
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                + Add Expense
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                + Transfer
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
