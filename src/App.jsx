import { useState } from 'react'

function App() {
  const [trades, setTrades] = useState([
    {
      id: 1,
      date: '2025-12-13',
      ticker: 'ALTY',
      long_short: 'L',
      entry_price: 14.80,
      exit_price: 15.49,
      shares: 500,
      profit_loss: 345.00,
      setup_quality: 'A',
      setup_type: '1 Minu',
      notes: 'Great setup'
    }
  ])

  const stats = {
    startingBal: 5000.00,
    currentBal: 5000 + trades.reduce((sum, t) => sum + t.profit_loss, 0),
    profitLoss: trades.reduce((sum, t) => sum + t.profit_loss, 0),
    wins: trades.filter(t => t.profit_loss > 0).length,
    losses: trades.filter(t => t.profit_loss < 0).length,
    winRate: (trades.filter(t => t.profit_loss > 0).length / trades.length) * 100,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Trade Tracker</h1>

        {/* Stats Dashboard */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Starting Balance</div>
              <div className="text-2xl font-bold text-blue-600">${stats.startingBal.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Current Balance</div>
              <div className="text-2xl font-bold text-green-600">${stats.currentBal.toFixed(2)}</div>
            </div>
            <div className={`p-4 rounded-lg ${stats.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-sm text-gray-600">Total P/L</div>
              <div className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.profitLoss.toFixed(2)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-2xl font-bold text-purple-600">{stats.winRate.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Trade Log */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Trade Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ticker</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">L/S</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Entry</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Exit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Shares</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">P/L</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Quality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trades.map((trade, idx) => (
                  <tr key={trade.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm">{trade.date}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{trade.ticker}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.long_short === 'L' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.long_short}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">${trade.entry_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">${trade.exit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">{trade.shares}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${
                      trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${trade.profit_loss.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.setup_quality === 'A' ? 'bg-green-500 text-white' :
                        trade.setup_quality === 'B' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {trade.setup_quality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{trade.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            + Add Trade
          </button>
        </div>
      </div>
    </div>
  )
}

export default App