function AllTrades({ trades }) {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Complete Trade Log</h2>

      {/* Filters Section (placeholder) */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 mb-6 border border-gray-800">
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium text-gray-400">Filters:</span>
          <button className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors">
            Date Range ▼
          </button>
          <button className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors">
            Ticker ▼
          </button>
          <button className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors">
            Quality ▼
          </button>
          <button className="px-4 py-2 text-[#a4fc3c] text-sm hover:text-white transition-colors">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Trade Table */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Ticker</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">L/S</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Entry</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Exit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Shares</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">P/L</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Quality</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Setup</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Notes</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {trades.map((trade, idx) => (
                <tr key={trade.id} className={idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'}>
                  <td className="px-4 py-3 text-sm text-gray-300">{trade.date}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{trade.ticker}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.long_short === 'L' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.long_short}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">${trade.entry_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">${trade.exit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{trade.shares}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${
                    trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                  }`}>
                    {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                      trade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.setup_quality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{trade.setup_type}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate text-gray-400">{trade.notes}</td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-[#a4fc3c] hover:text-white mr-2 transition-colors" title="Edit">
                      ✏️
                    </button>
                    <button className="text-red-400 hover:text-red-300 transition-colors" title="Delete">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AllTrades