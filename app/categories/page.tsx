export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600">
              Manage Income & Expense Categories
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
            <div className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
              Categories
            </div>
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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Your Categories
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Organize your income and expenses
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Add Category
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Expense Categories Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Expense Categories
            </h3>
            <div className="space-y-2">
              <div className="text-center py-8 bg-gray-50 rounded">
                <p className="text-gray-500">No expense categories yet</p>
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Create first category
                </button>
              </div>
            </div>
          </div>

          {/* Income Categories Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Income Categories
            </h3>
            <div className="space-y-2">
              <div className="text-center py-8 bg-gray-50 rounded">
                <p className="text-gray-500">No income categories yet</p>
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Create first category
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              💡 Tips
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                Create categories that match your lifestyle
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                Use specific names for better tracking
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                You can always edit or delete categories later
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Category Activity
          </h3>
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Categories will appear here once you start adding transactions
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
