export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Doeit Dashboard
            </h1>
            <p className="text-sm text-gray-600">Financial Overview</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <div className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
              Dashboard
            </div>
            <a
              href="/transactions"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Transactions
            </a>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Income
            </p>
            <p className="text-3xl font-bold text-blue-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Expenses
            </p>
            <p className="text-3xl font-bold text-red-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">Money Left</p>
            <p className="text-3xl font-bold text-green-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">Income - Expenses</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">Net Worth</p>
            <p className="text-3xl font-bold text-purple-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">Total across wallets</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spending Over Time
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Chart coming soon...</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spending by Category
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Chart coming soon...</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <a
              href="/transactions"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all →
            </a>
          </div>
          <div className="text-center py-12 bg-gray-50 rounded">
            <p className="text-gray-500">No transactions yet</p>
            <a
              href="/transactions"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Transaction
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
