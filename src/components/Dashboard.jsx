import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

function Dashboard({ trades, stats }) {
  // Calculate additional stats for legacy compatibility
  const growthPercentage = stats.roi

  // Get most recent 10 trades (trades are already sorted newest first)
  const recentTrades = trades.slice(0, 10)

  // Generate balance growth data BY DAY
  const getBalanceGrowthData = () => {
    // Group trades by date and calculate daily P/L
    const dailyMap = {}

    trades.forEach(trade => {
      const dateKey = trade.trade_date
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          dailyPL: 0
        }
      }
      dailyMap[dateKey].dailyPL += trade.profit_loss
    })
    
    // Sort dates
    const sortedDates = Object.keys(dailyMap).sort((a, b) => 
      new Date(a) - new Date(b)
    )
    
    // Calculate running balance for each day
    let runningBalance = stats.startingBalance
    
    const data = [{
      date: 'Start',
      balance: stats.startingBalance,
      displayDate: 'Start',
      fullDate: 'Starting Balance'
    }]
    
    sortedDates.forEach(dateKey => {
      runningBalance += dailyMap[dateKey].dailyPL
      data.push({
        date: dateKey,
        balance: runningBalance,
        displayDate: format(parseISO(dateKey), 'MMM d'),
        fullDate: format(parseISO(dateKey), 'MMM d, yyyy'),
        dailyPL: dailyMap[dateKey].dailyPL
      })
    })
    
    return data
  }

  const balanceData = getBalanceGrowthData()

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold text-sm mb-1">
            {data.fullDate || data.displayDate}
          </p>
          <p className="text-[#a4fc3c] font-bold text-lg">
            ${data.balance.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Performance Overview</h2>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Top Stats Row - 4 Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Current Balance */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <div className="text-xs text-gray-500 mb-2">CURRENT BALANCE</div>
          <div className="text-3xl font-bold text-white mb-2">
            ${stats.currentBalance.toFixed(2)}
          </div>
          <div className={`text-sm ${growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
            {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(2)}% from start
          </div>
        </div>

        {/* ROI */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <div className="text-xs text-gray-500 mb-2">ROI</div>
          <div className={`text-3xl font-bold mb-2 ${
            growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-500">
            Since ${stats.startingBalance.toFixed(2)}
          </div>
        </div>

        {/* Total P/L */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <div className="text-xs text-gray-500 mb-2">TOTAL P/L</div>
          <div className={`text-3xl font-bold mb-2 ${
            stats.netPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {stats.netPL >= 0 ? '+' : ''}${stats.netPL.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            {trades.length} trades
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <div className="text-xs text-gray-500 mb-2">WIN RATE</div>
          <div className="text-3xl font-bold text-white mb-2">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">
            {stats.totalWins}W / {stats.totalLosses}L
          </div>
        </div>
      </div>

      {/* Stats Grid - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Performance Metrics */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Key Metrics - Large and Prominent */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Gross Wins</div>
                <div className="text-3xl font-bold text-[#a4fc3c] mb-1">${stats.grossWins.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{stats.totalWins} wins</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Gross Losses</div>
                <div className="text-3xl font-bold text-red-400 mb-1">${Math.abs(stats.grossLosses).toFixed(2)}</div>
                <div className="text-xs text-gray-500">{stats.totalLosses} losses</div>
              </div>
            </div>

            {/* Secondary Metrics - Grouped by Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-xl font-bold text-[#a4fc3c]">${stats.avgWin.toFixed(2)}</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-xl font-bold text-red-400">${Math.abs(stats.avgLoss).toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Largest Win</div>
                <div className="text-xl font-bold text-[#a4fc3c]">${stats.largestWin.toFixed(2)}</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Largest Loss</div>
                <div className="text-xl font-bold text-red-400">${Math.abs(stats.largestLoss).toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">P&L Ratio</div>
                <div className="text-xl font-bold text-white">{stats.riskRewardRatio.toFixed(2)}:1</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Expectancy</div>
                <div className={`text-xl font-bold ${stats.expectancy >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  ${stats.expectancy.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Win/Loss Breakdown */}
            <div>
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Win/Loss Breakdown</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-400">Total Wins</div>
                    <div className="text-lg font-bold text-[#a4fc3c]">{stats.totalWins}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.totalWins > 0 ? ((stats.totalWins / trades.length) * 100).toFixed(1) : 0}% of trades
                  </div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-400">Total Losses</div>
                    <div className="text-lg font-bold text-red-400">{stats.totalLosses}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.totalLosses > 0 ? ((stats.totalLosses / trades.length) * 100).toFixed(1) : 0}% of trades
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Profit Factor</div>
                <div className={`text-xl font-bold ${stats.profitFactor >= 1 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {stats.profitFactor.toFixed(2)}
                </div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Max Consecutive Losses</div>
                <div className="text-xl font-bold text-red-400">{stats.maxConsecutiveLosses}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Analytics */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Trading Analytics</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                <div className="text-2xl font-bold text-white">{trades.length}</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Current Streak</div>
                <div className="text-2xl font-bold text-white">{stats.currentStreak}</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
            </div>

            {/* Setup Quality Breakdown */}
            <div>
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Setup Quality Performance</div>
              <div className="grid grid-cols-3 gap-4">
                {['A', 'B', 'C'].map(quality => {
                  const setup = stats.setupStats?.find(s => s.quality === quality);
                  if (!setup) return null;
                  return (
                    <div key={quality} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-lg font-bold text-white">{quality}</div>
                        <div className={`text-sm font-semibold ${setup.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          {setup.totalPL >= 0 ? '+' : ''}${setup.totalPL.toFixed(0)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {setup.winRate.toFixed(1)}% WR • {setup.trades} trades
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Breakdown */}
            {stats.strategyStats && stats.strategyStats.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Strategy Performance</div>
                <div className="space-y-2">
                  {stats.strategyStats.slice(0, 3).map((strategy, idx) => (
                    <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{strategy.name}</div>
                          <div className="text-xs text-gray-400">{strategy.trades} trades</div>
                        </div>
                        <div className={`text-lg font-bold ${strategy.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          {strategy.totalPL >= 0 ? '+' : ''}${strategy.totalPL.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best/Worst Ticker & Sector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Best Ticker</div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">{stats.bestTicker?.ticker || 'N/A'}</div>
                  {stats.bestTicker?.ticker !== 'N/A' && (
                    <div className="text-sm font-semibold text-[#a4fc3c]">
                      +${stats.bestTicker.totalPL.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
              {stats.bestSector && stats.bestSector.name !== 'N/A' && (
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Best Sector</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">{stats.bestSector.name}</div>
                    <div className="text-sm font-semibold text-[#a4fc3c]">
                      {stats.bestSector.winRate.toFixed(1)}% WR
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* News vs No-News */}
            {(stats.newsStats?.trades > 0 || stats.noNewsStats?.trades > 0) && (
              <div>
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">News Performance</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">With News</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">{stats.newsStats.trades} trades</div>
                      <div className={`text-sm font-semibold ${stats.newsStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                        {stats.newsStats.totalPL >= 0 ? '+' : ''}${stats.newsStats.totalPL.toFixed(0)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{stats.newsStats.winRate.toFixed(1)}% WR</div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">No News</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">{stats.noNewsStats.trades} trades</div>
                      <div className={`text-sm font-semibold ${stats.noNewsStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                        {stats.noNewsStats.totalPL >= 0 ? '+' : ''}${stats.noNewsStats.totalPL.toFixed(0)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{stats.noNewsStats.winRate.toFixed(1)}% WR</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Balance Growth Chart */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 mb-8">
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Account Balance</h3>
              <div className="text-3xl font-bold text-white">${stats.currentBalance.toFixed(2)}</div>
              <div className={`text-sm mt-1 ${growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                {growthPercentage >= 0 ? '+' : ''}${stats.netPL.toFixed(2)} ({growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(2)}%) All Time
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#a4fc3c" 
                  strokeWidth={3}
                  dot={{ fill: '#a4fc3c', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          <span className="text-sm text-gray-500">Last 10 trades</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Ticker</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Strategy</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Shares</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">P/L</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentTrades.map((trade, idx) => (
                <tr 
                  key={trade.id} 
                  className={`${idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'} hover:bg-[#2a2a2a] transition-colors`}
                >
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {format(parseISO(trade.trade_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">
                    {trade.ticker}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {trade.strategy}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {trade.shares}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard