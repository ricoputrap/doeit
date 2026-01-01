export default function WalletsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Add Wallet
            </button>
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
            <div className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
              Wallets
            </div>
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
        {/* Total Net Worth */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg shadow mb-8 text-white">
          <h2 className="text-lg font-medium mb-2">Total Net Worth</h2>
          <p className="text-4xl font-bold">Rp 0</p>
          <p className="text-sm opacity-90 mt-2">Across all wallets</p>
        </div>

        {/* Wallets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Wallets</h3>
          </div>

          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No wallets yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Add your cash, bank accounts, e-wallets, and other financial accounts
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Add Your First Wallet
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Why add wallets?
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Track your net worth across all accounts
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Organize transactions by wallet
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Make transfers between wallets
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Get a complete picture of your finances
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
