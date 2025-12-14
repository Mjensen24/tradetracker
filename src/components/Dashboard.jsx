function Dashboard({ trades, stats }) {
  // Calculate additional stats for legacy compatibility
  const growthPercentage = stats.roi
  const avgWin = stats.avgWin

  // Get last 5 trades
  const recentTrades = trades.slice(-5).reverse()

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Performance Overview</h2>

      {/* Top Stats Row - Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Current Balance */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Current Balance</div>
          <div className="text-4xl font-bold text-white">
            ${stats.currentBalance.toFixed(2)}
          </div>
          <div className={`text-sm mt-2 flex items-center gap-1 ${growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
            {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(2)}% from start
          </div>
        </div>

        {/* Growth Percentage */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">ROI</div>
          <div className={`text-4xl font-bold ${
            growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Since ${stats.startingBalance.toFixed(2)}
          </div>
        </div>

        {/* Total P/L */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Total P/L</div>
          <div className={`text-4xl font-bold ${
            stats.netPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {stats.netPL >= 0 ? '+' : ''}${stats.netPL.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {trades.length} total trades
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Current Streak</div>
          <div className="text-4xl font-bold text-white">
            {stats.currentStreak}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Active streak
          </div>
        </div>
      </div>

      {/* Three Column Layout - Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Column 1: Profit & Loss (Teal) */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-teal-500 pb-2">
            Profit & Loss
          </h3>
          <div className="space-y-3">
            <div className="bg-teal-800/50 p-3 rounded-lg">
              <div className="text-xs text-teal-200 mb-1">Gross Wins</div>
              <div className="text-xl font-bold text-white">${stats.grossWins.toFixed(2)}</div>
            </div>
            <div className="bg-teal-800/50 p-3 rounded-lg">
              <div className="text-xs text-teal-200 mb-1">Gross Losses</div>
              <div className="text-xl font-bold text-white">-${stats.grossLosses.toFixed(2)}</div>
            </div>
            <div className="bg-teal-800/50 p-3 rounded-lg">
              <div className="text-xs text-teal-200 mb-1">Profit Factor</div>
              <div className="text-xl font-bold text-white">{stats.profitFactor.toFixed(2)}</div>
            </div>
            <div className="bg-teal-800/50 p-3 rounded-lg">
              <div className="text-xs text-teal-200 mb-1">Win Rate</div>
              <div className="text-xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div className="bg-teal-800/50 p-3 rounded-lg">
              <div className="text-xs text-teal-200 mb-1">Expectancy</div>
              <div className="text-xl font-bold text-white">${stats.expectancy.toFixed(2)}</div>
              <div className="text-xs text-teal-300">per trade</div>
            </div>
          </div>
        </div>

        {/* Column 2: Winners (Green) */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-green-500 pb-2">
            Winners
          </h3>
          <div className="space-y-3">
            <div className="bg-green-800/50 p-3 rounded-lg">
              <div className="text-xs text-green-200 mb-1">Average Win</div>
              <div className="text-xl font-bold text-white">${stats.avgWin.toFixed(2)}</div>
            </div>
            <div className="bg-green-800/50 p-3 rounded-lg">
              <div className="text-xs text-green-200 mb-1">Largest Gain</div>
              <div className="text-xl font-bold text-white">${stats.largestWin.toFixed(2)}</div>
            </div>
            <div className="bg-green-800/50 p-3 rounded-lg">
              <div className="text-xs text-green-200 mb-1">Total Winners</div>
              <div className="text-xl font-bold text-white">{stats.totalWins} trades</div>
            </div>
            <div className="bg-green-800/50 p-3 rounded-lg">
              <div className="text-xs text-green-200 mb-1">Best Setup Quality</div>
              <div className="text-xl font-bold text-white">{stats.bestSetup.quality}</div>
              <div className="text-xs text-green-300">{stats.bestSetup.winRate.toFixed(1)}% WR, ${stats.bestSetup.avgPL.toFixed(0)} avg</div>
            </div>
            <div className="bg-green-800/50 p-3 rounded-lg">
              <div className="text-xs text-green-200 mb-1">Best Strategy</div>
              <div className="text-xl font-bold text-white">{stats.bestStrategy.name}</div>
              <div className="text-xs text-green-300">${stats.bestStrategy.totalPL.toFixed(0)} total P/L</div>
            </div>
          </div>
        </div>

        {/* Column 3: Losers (Red) */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 border-b border-red-500 pb-2">
            Losers
          </h3>
          <div className="space-y-3">
            <div className="bg-red-800/50 p-3 rounded-lg">
              <div className="text-xs text-red-200 mb-1">Average Loss</div>
              <div className="text-xl font-bold text-white">-${Math.abs(stats.avgLoss).toFixed(2)}</div>
            </div>
            <div className="bg-red-800/50 p-3 rounded-lg">
              <div className="text-xs text-red-200 mb-1">Largest Loss</div>
              <div className="text-xl font-bold text-white">-${Math.abs(stats.largestLoss).toFixed(2)}</div>
            </div>
            <div className="bg-red-800/50 p-3 rounded-lg">
              <div className="text-xs text-red-200 mb-1">Total Losers</div>
              <div className="text-xl font-bold text-white">{stats.totalLosses} trades</div>
            </div>
            <div className="bg-red-800/50 p-3 rounded-lg">
              <div className="text-xs text-red-200 mb-1">Worst Setup Quality</div>
              <div className="text-xl font-bold text-white">{stats.worstSetup.quality}</div>
              <div className="text-xs text-red-300">{stats.worstSetup.winRate.toFixed(1)}% WR, ${stats.worstSetup.avgPL.toFixed(0)} avg</div>
            </div>
            <div className="bg-red-800/50 p-3 rounded-lg">
              <div className="text-xs text-red-200 mb-1">Risk/Reward Ratio</div>
              <div className="text-xl font-bold text-white">{stats.riskRewardRatio.toFixed(2)}</div>
              <div className="text-xs text-red-300">Avg Win ÷ Avg Loss</div>
            </div>
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
                  trade.strategy === 'Momentum' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' : 
                  trade.strategy === 'Dip' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {trade.strategy}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`font-bold ${
                  trade.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  trade.setupQuality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                  trade.setupQuality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {trade.setupQuality}
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