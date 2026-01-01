export default function BudgetsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-sm text-gray-600">Manage Monthly Budgets</p>
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
            <div className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
              Budgets
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Month Selector */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Current Month: January 2025
            </h2>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                ← Previous
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Budget
            </p>
            <p className="text-3xl font-bold text-blue-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Spent
            </p>
            <p className="text-3xl font-bold text-red-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600 mb-2">Remaining</p>
            <p className="text-3xl font-bold text-green-600">Rp 0</p>
            <p className="text-sm text-gray-500 mt-2">Budget left</p>
          </div>
        </div>

        {/* Budget List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Category Budgets
            </h3>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
              Add Budget
            </button>
          </div>

          {/* Budget Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="mb-4">No budgets set for this month</p>
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                        Create Your First Budget
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Tips */}
        <div className="mt-6 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Budget Tips
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
              Start with your essential categories (food, transport, housing)
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
              Review and adjust your budgets monthly based on actual spending
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
              Set realistic limits that you can actually stick to
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></span>
              Use the progress bar to track how close you are to your limits
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
