import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

function Dashboard({ trades, stats }) {
  // Calculate additional stats for legacy compatibility
  const growthPercentage = stats.roi

  // Get last 10 trades for better view
  const recentTrades = trades.slice(-10).reverse()

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
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Gross Wins</div>
                <div className="text-2xl font-bold text-[#a4fc3c]">${stats.grossWins.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Gross Losses</div>
                <div className="text-2xl font-bold text-red-400">-${stats.grossLosses.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Average Win</div>
                <div className="text-2xl font-bold text-[#a4fc3c]">${stats.avgWin.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Average Loss</div>
                <div className="text-2xl font-bold text-red-400">-${Math.abs(stats.avgLoss).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Largest Win</div>
                <div className="text-2xl font-bold text-[#a4fc3c]">${stats.largestWin.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Largest Loss</div>
                <div className="text-2xl font-bold text-red-400">-${Math.abs(stats.largestLoss).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">P&L Ratio</div>
                <div className="text-2xl font-bold text-white">{stats.riskRewardRatio.toFixed(2)}:1</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Expectancy</div>
                <div className="text-2xl font-bold text-[#a4fc3c]">${stats.expectancy.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Analytics */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Trading Analytics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Best Setup Quality</div>
                <div className="text-2xl font-bold text-white mb-1">{stats.bestSetup.quality}</div>
                <div className="text-xs text-gray-500">{stats.bestSetup.winRate.toFixed(1)}% WR</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Worst Setup Quality</div>
                <div className="text-2xl font-bold text-white mb-1">{stats.worstSetup.quality}</div>
                <div className="text-xs text-gray-500">{stats.worstSetup.winRate.toFixed(1)}% WR</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Best Strategy</div>
                <div className="text-2xl font-bold text-white mb-1">{stats.bestStrategy.name}</div>
                <div className="text-xs text-gray-500">${stats.bestStrategy.totalPL.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Current Streak</div>
                <div className="text-2xl font-bold text-white mb-1">{stats.currentStreak}</div>
                <div className="text-xs text-gray-500">days traded</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Trades</div>
                <div className="text-2xl font-bold text-white">{trades.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Max Losses in Row</div>
                <div className="text-2xl font-bold text-red-400">{stats.maxConsecutiveLosses}</div>
              </div>
            </div>
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
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
          <span className="text-sm text-gray-500">Last 10 trades</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P/L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(trade.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                    {trade.ticker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {trade.strategy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {trade.shares}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    <span className={trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}>
                      {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
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

        <div className="p-4 border-t border-gray-800">
          <button className="w-full py-2 text-[#a4fc3c] hover:text-white text-sm font-medium transition-colors">
            View All Trades →
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard