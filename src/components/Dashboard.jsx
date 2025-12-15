import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDateShort, formatDateChart, formatCurrency, formatPercent, formatNumber } from '../utils/formatters'
import QualityBadge from './ui/QualityBadge'

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
        displayDate: formatDateChart(dateKey),
        fullDate: formatDateShort(dateKey),
        dailyPL: dailyMap[dateKey].dailyPL
      })
    })
    
    return data
  }

  const balanceData = getBalanceGrowthData()

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h2>
        <div className="text-xs sm:text-sm text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Simplified Top Stats - 3 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Current Balance */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 border border-gray-800">
          <div className="text-xs md:text-sm font-medium text-gray-400 mb-2">CURRENT BALANCE</div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            {formatCurrency(stats.currentBalance)}
          </div>
          <div className={`text-xs md:text-sm ${growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
            {growthPercentage >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(growthPercentage), 2)} from start
          </div>
        </div>

        {/* ROI */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 border border-gray-800">
          <div className="text-xs md:text-sm font-medium text-gray-400 mb-2">ROI</div>
          <div className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
            growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {growthPercentage >= 0 ? '+' : ''}{formatPercent(growthPercentage, 2)}
          </div>
          <div className="text-xs md:text-sm text-gray-300">
            {formatCurrency(stats.netPL, true)} P/L
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 border border-gray-800 sm:col-span-2 lg:col-span-1">
          <div className="text-xs md:text-sm font-medium text-gray-400 mb-2">WIN RATE</div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            {formatPercent(stats.winRate, 1)}
          </div>
          <div className="text-xs md:text-sm text-gray-300">
            {stats.totalWins}W / {stats.totalLosses}L • {trades.length} trades
          </div>
        </div>
      </div>

      {/* Account Balance Growth Chart - Moved Up */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 mb-6 md:mb-8">
        <div className="p-4 md:p-6 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-1">Account Balance Growth</h3>
              <div className={`text-xs md:text-sm mt-1 ${growthPercentage >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                {formatCurrency(stats.netPL, true)} ({growthPercentage >= 0 ? '+' : ''}{formatPercent(growthPercentage, 2)}) All Time
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
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
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-semibold text-sm mb-1">
                            {data.fullDate || data.displayDate}
                          </p>
                          <p className="text-[#a4fc3c] font-bold text-lg">
                            {formatCurrency(data.balance)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }} 
                />
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

      {/* Stats Grid - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        
        {/* Performance Metrics */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-800">
            <h3 className="text-lg md:text-xl font-semibold text-white">Performance Metrics</h3>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            {/* Key Metrics - Large and Prominent */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 md:p-4 border border-gray-800">
                <div className="text-xs md:text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Gross Wins</div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#a4fc3c] mb-1">{formatCurrency(stats.grossWins)}</div>
                <div className="text-xs md:text-sm text-gray-300">{stats.totalWins} wins</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 md:p-4 border border-gray-800">
                <div className="text-xs md:text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Gross Losses</div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-red-400 mb-1">{formatCurrency(Math.abs(stats.grossLosses))}</div>
                <div className="text-xs md:text-sm text-gray-300">{stats.totalLosses} losses</div>
              </div>
            </div>

            {/* Secondary Metrics - Grouped by Type */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs md:text-sm font-medium text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg md:text-xl font-bold text-[#a4fc3c]">{formatCurrency(stats.avgWin)}</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs md:text-sm font-medium text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg md:text-xl font-bold text-red-400">{formatCurrency(Math.abs(stats.avgLoss))}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Largest Win</div>
                <div className="text-lg md:text-xl font-bold text-[#a4fc3c]">{formatCurrency(stats.largestWin)}</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Largest Loss</div>
                <div className="text-lg md:text-xl font-bold text-red-400">{formatCurrency(Math.abs(stats.largestLoss))}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">P&L Ratio</div>
                <div className="text-lg md:text-xl font-bold text-white">{stats.riskRewardRatio.toFixed(2)}:1</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Expectancy</div>
                <div className={`text-lg md:text-xl font-bold ${stats.expectancy >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {formatCurrency(stats.expectancy)}
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
                    {stats.totalWins > 0 ? formatPercent((stats.totalWins / trades.length) * 100, 1) : '0%'} of trades
                  </div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-400">Total Losses</div>
                    <div className="text-lg font-bold text-red-400">{stats.totalLosses}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.totalLosses > 0 ? formatPercent((stats.totalLosses / trades.length) * 100, 1) : '0%'} of trades
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
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-800">
            <h3 className="text-lg md:text-xl font-semibold text-white">Trading Analytics</h3>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-white">{formatPercent(stats.winRate, 1)}</div>
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
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {['A', 'B', 'C'].map(quality => {
                  const setup = stats.setupStats?.find(s => s.quality === quality);
                  if (!setup) return null;
                  return (
                    <div key={quality} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-lg font-bold text-white">{quality}</div>
                        <div className={`text-sm font-semibold ${setup.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          {formatCurrency(setup.totalPL, true)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatPercent(setup.winRate, 1)} WR • {setup.trades} trades
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
                          {formatCurrency(strategy.totalPL, true)}
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
                      {formatCurrency(stats.bestTicker.totalPL, true)}
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
                      {formatPercent(stats.bestSector.winRate, 1)} WR
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
                        {formatCurrency(stats.newsStats.totalPL, true)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatPercent(stats.newsStats.winRate, 1)} WR</div>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">No News</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">{stats.noNewsStats.trades} trades</div>
                      <div className={`text-sm font-semibold ${stats.noNewsStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                        {formatCurrency(stats.noNewsStats.totalPL, true)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatPercent(stats.noNewsStats.winRate, 1)} WR</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg md:text-xl font-semibold text-white">Recent Trades</h3>
          <span className="text-xs md:text-sm text-gray-500">Last 10 trades</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-gray-800">
              <tr>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-400">Date</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-400">Ticker</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-400 hidden sm:table-cell">Strategy</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-400">Shares</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-400">P/L</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-400">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentTrades.map((trade, idx) => (
                <tr 
                  key={trade.id} 
                  className={`${idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'} hover:bg-[#2a2a2a] transition-colors`}
                >
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-300">
                    {formatDateShort(trade.trade_date)}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-white">
                    {trade.ticker}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-300 hidden sm:table-cell">
                    {trade.strategy}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-300">
                    {formatNumber(trade.shares)}
                  </td>
                  <td className={`px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold ${
                    trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                  }`}>
                    {formatCurrency(trade.profit_loss, true)}
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                    <QualityBadge quality={trade.setup_quality} size="sm" />
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