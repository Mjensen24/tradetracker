function Dashboard({ trades, stats }) {
  // Calculate additional stats
  const growthPercentage = ((stats.currentBal - stats.startingBal) / stats.startingBal) * 100
  const avgWin = stats.wins > 0 
    ? trades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0) / stats.wins 
    : 0

  // Get last 5 trades
  const recentTrades = trades.slice(-5).reverse()

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Performance Overview</h2>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current Balance */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Current Balance</div>
          <div className="text-4xl font-bold text-white">
            ${stats.currentBal.toFixed(2)}
          </div>
          <div className={`text-sm mt-2 flex items-center gap-1 ${growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
            {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(2)}% from start
          </div>
        </div>

        {/* Growth Percentage */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Growth</div>
          <div className={`text-4xl font-bold ${
            growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Since ${stats.startingBal.toFixed(2)}
          </div>
        </div>

        {/* Total P/L */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Total P/L</div>
          <div className={`text-4xl font-bold ${
            stats.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {trades.length} total trades
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Win Rate */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Win Rate</div>
          <div className="text-4xl font-bold text-[#a4fc3c]">
            {stats.winRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {stats.wins}W / {stats.losses}L
          </div>
        </div>

        {/* Total Trades */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Total Trades</div>
          <div className="text-4xl font-bold text-white">
            {trades.length}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Since Dec 2, 2025
          </div>
        </div>

        {/* Average Win */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Average Win</div>
          <div className="text-4xl font-bold text-[#a4fc3c]">
            ${avgWin.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Per winning trade
          </div>
        </div>
      </div>

      {/* Recent Trades Section */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Recent Trades</h3>
          <span className="text-sm text-gray-500">Last 5 trades</span>
        </div>
        
        <div className="space-y-3">
          {recentTrades.map((trade) => (
            <div 
              key={trade.id} 
              className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400 w-20">{trade.date}</div>
                <div className="font-semibold text-white w-16">{trade.ticker}</div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  trade.long_short === 'L' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.long_short}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`font-bold ${
                  trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  trade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                  trade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {trade.setup_quality}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 py-2 text-[#a4fc3c] hover:text-white font-medium text-sm hover:bg-[#2a2a2a] rounded transition-colors">
          View All Trades →
        </button>
      </div>
    </div>
  )
}

export default Dashboard