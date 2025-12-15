import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { format, startOfWeek, startOfMonth, startOfYear, parseISO, subDays } from 'date-fns'
import { formatDateChart, formatCurrency, formatPercent } from '../utils/formatters'

// Custom tooltip for charts - defined outside component to avoid recreation on each render
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className={`text-sm ${
            entry.value >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
          }`}>
            {entry.name}: {formatCurrency(entry.value, true)}
          </p>
        ))}
        {payload[0].payload.trades && (
          <p className="text-xs text-gray-400 mt-1">
            {payload[0].payload.trades} trades
          </p>
        )}
      </div>
    )
  }
  return null
}

const BalanceTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-1">{payload[0].payload.date}</p>
        <p className="text-[#a4fc3c] text-sm">
          Balance: {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.trade && (
          <p className="text-gray-400 text-xs mt-1">{payload[0].payload.trade}</p>
        )}
      </div>
    )
  }
  return null
}

const StrategyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{data.name || 'Unknown Strategy'}</p>
        <p className={`text-sm mb-1 ${data.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
          Total P/L: {formatCurrency(data.totalPL, true)}
        </p>
        <p className="text-gray-300 text-sm mb-1">
          Win Rate: {formatPercent(data.winRate, 1)}
        </p>
        <p className="text-gray-400 text-xs">
          {data.tradeCount} trades ({data.wins}W / {data.losses}L)
        </p>
      </div>
    )
  }
  return null
}

const WinRateTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{data.period}</p>
        <p className="text-[#a4fc3c] text-sm mb-1">
          Win Rate: {formatPercent(data.winRate, 1)}
        </p>
        {data.rollingWinRate !== undefined && (
          <p className="text-gray-300 text-sm mb-1">
            Rolling Avg: {formatPercent(data.rollingWinRate, 1)}
          </p>
        )}
        <p className="text-gray-400 text-xs mt-1">
          {data.wins}W / {data.losses}L · {data.totalTrades} trades
        </p>
        {data.rollingTrades !== undefined && data.rollingTrades !== data.totalTrades && (
          <p className="text-gray-500 text-xs mt-1">
            Rolling window: {data.rollingTrades} trades
          </p>
        )}
      </div>
    )
  }
  return null
}

function Charts({ trades }) {
  // State for time frame selector
  const [timeFrame, setTimeFrame] = useState('daily')
  // State for strategy chart type (bar or pie)
  const [strategyChartType, setStrategyChartType] = useState('pie')
  // State for win rate chart time frame
  const [winRateTimeFrame, setWinRateTimeFrame] = useState('daily')
  // State for rolling average type
  const [rollingAverageType, setRollingAverageType] = useState('10-trade')

  // Process data for weekly chart
  const getWeeklyData = () => {
    const weekMap = {}

    trades.forEach(trade => {
      const date = parseISO(trade.trade_date)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday start
      const weekKey = format(weekStart, 'MMM d')

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          week: weekKey,
          profitLoss: 0,
          trades: 0,
          wins: 0,
          losses: 0
        }
      }

      weekMap[weekKey].profitLoss += trade.profit_loss
      weekMap[weekKey].trades += 1
      if (trade.profit_loss > 0) weekMap[weekKey].wins += 1
      else if (trade.profit_loss < 0) weekMap[weekKey].losses += 1
    })

    return Object.values(weekMap)
  }

  // Process data for monthly chart
  const getMonthlyData = () => {
    const monthMap = {}

    trades.forEach(trade => {
      const date = parseISO(trade.trade_date)
      const monthStart = startOfMonth(date)
      const monthKey = format(monthStart, 'MMM yyyy')

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          profitLoss: 0,
          trades: 0,
          wins: 0,
          losses: 0
        }
      }

      monthMap[monthKey].profitLoss += trade.profit_loss
      monthMap[monthKey].trades += 1
      if (trade.profit_loss > 0) monthMap[monthKey].wins += 1
      else if (trade.profit_loss < 0) monthMap[monthKey].losses += 1
    })

    return Object.values(monthMap).sort((a, b) => {
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateA - dateB
    })
  }

  // Process data for yearly chart
  const getYearlyData = () => {
    const yearMap = {}

    trades.forEach(trade => {
      const date = parseISO(trade.trade_date)
      const yearStart = startOfYear(date)
      const yearKey = format(yearStart, 'yyyy')

      if (!yearMap[yearKey]) {
        yearMap[yearKey] = {
          year: yearKey,
          profitLoss: 0,
          trades: 0,
          wins: 0,
          losses: 0
        }
      }

      yearMap[yearKey].profitLoss += trade.profit_loss
      yearMap[yearKey].trades += 1
      if (trade.profit_loss > 0) yearMap[yearKey].wins += 1
      else if (trade.profit_loss < 0) yearMap[yearKey].losses += 1
    })

    return Object.values(yearMap).sort((a, b) => parseInt(a.year) - parseInt(b.year))
  }

  // Process data for daily chart
  const getDailyData = () => {
    const dailyMap = {}

    trades.forEach(trade => {
      const dateKey = trade.trade_date

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: formatDateChart(trade.trade_date),
          fullDate: trade.trade_date,
          profitLoss: 0,
          trades: 0
        }
      }

      dailyMap[dateKey].profitLoss += trade.profit_loss
      dailyMap[dateKey].trades += 1
    })

    return Object.values(dailyMap).sort((a, b) =>
      new Date(a.fullDate) - new Date(b.fullDate)
    )
  }

  // Process data for cumulative balance chart
  const getCumulativeData = () => {
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date) - new Date(b.trade_date)
    )

    const startingBalance = 5000
    let runningBalance = startingBalance

    const data = [{
      date: 'Start',
      balance: startingBalance
    }]

    sortedTrades.forEach((trade) => {
      runningBalance += trade.profit_loss
      data.push({
        date: formatDateChart(trade.trade_date),
        balance: runningBalance,
        trade: `${trade.ticker} ${formatCurrency(trade.profit_loss, true)}`
      })
    })

    return data
  }

  // Process data for strategy performance chart
  const getStrategyData = () => {
    const strategyMap = {}

    trades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy'
      
      if (!strategyMap[strategy]) {
        strategyMap[strategy] = {
          name: strategy,
          totalPL: 0,
          tradeCount: 0,
          wins: 0,
          losses: 0
        }
      }

      strategyMap[strategy].totalPL += trade.profit_loss
      strategyMap[strategy].tradeCount += 1
      if (trade.profit_loss > 0) {
        strategyMap[strategy].wins += 1
      } else if (trade.profit_loss < 0) {
        strategyMap[strategy].losses += 1
      }
    })

    // Calculate win rates and sort by total P/L
    const strategyData = Object.values(strategyMap).map(strategy => ({
      ...strategy,
      winRate: strategy.tradeCount > 0 
        ? (strategy.wins / strategy.tradeCount) * 100 
        : 0
    })).sort((a, b) => b.totalPL - a.totalPL)

    return strategyData
  }

  // Process data for win rate over time chart
  const getWinRateData = () => {
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date) - new Date(b.trade_date)
    )

    let periodMap = {}

    sortedTrades.forEach(trade => {
      const date = parseISO(trade.trade_date)
      let periodKey
      let fullDate

      switch (winRateTimeFrame) {
        case 'weekly': {
          const weekStart = startOfWeek(date, { weekStartsOn: 1 })
          periodKey = format(weekStart, 'MMM d')
          fullDate = weekStart
          break
        }
        case 'monthly': {
          const monthStart = startOfMonth(date)
          periodKey = format(monthStart, 'MMM yyyy')
          fullDate = monthStart
          break
        }
        default: { // daily
          periodKey = format(date, 'MMM d')
          fullDate = date
          break
        }
      }

      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: periodKey,
          fullDate: fullDate,
          trades: [],
          wins: 0,
          losses: 0,
          totalTrades: 0
        }
      }

      periodMap[periodKey].trades.push(trade)
      periodMap[periodKey].totalTrades += 1
      if (trade.profit_loss > 0) {
        periodMap[periodKey].wins += 1
      } else if (trade.profit_loss < 0) {
        periodMap[periodKey].losses += 1
      }
    })

    // Convert to array and calculate win rates
    let winRateData = Object.values(periodMap).map(period => ({
      ...period,
      winRate: period.totalTrades > 0 
        ? (period.wins / period.totalTrades) * 100 
        : 0
    })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))

    // Calculate rolling average
    if (rollingAverageType === '10-trade') {
      // Create a flat list of all trades in chronological order with period index
      const allTradesFlat = []
      winRateData.forEach((period, periodIndex) => {
        period.trades.forEach(trade => {
          allTradesFlat.push({
            ...trade,
            periodIndex: periodIndex
          })
        })
      })

      // Calculate rolling average for each period based on last 10 trades up to that point
      winRateData = winRateData.map((period, index) => {
        // Find all trades up to and including this period
        const tradesUpToPeriod = allTradesFlat.filter(t => 
          t.periodIndex <= index
        )

        // Get the last 10 trades (or all if less than 10)
        const last10Trades = tradesUpToPeriod.slice(-10)
        
        const winCount = last10Trades.filter(t => t.profit_loss > 0).length
        const tradeCount = last10Trades.length

        return {
          ...period,
          rollingWinRate: tradeCount > 0 ? (winCount / tradeCount) * 100 : 0,
          rollingTrades: tradeCount
        }
      })
    } else {
      // Rolling average based on last 30 days
      winRateData = winRateData.map((period, index) => {
        const periodDate = new Date(period.fullDate)
        const thirtyDaysAgo = subDays(periodDate, 30)
        
        let tradeCount = 0
        let winCount = 0

        // Look back through previous periods and current period
        for (let i = 0; i <= index; i++) {
          winRateData[i].trades.forEach(trade => {
            const tradeDate = parseISO(trade.trade_date)
            if (tradeDate >= thirtyDaysAgo && tradeDate <= periodDate) {
              tradeCount++
              if (trade.profit_loss > 0) winCount++
            }
          })
        }

        return {
          ...period,
          rollingWinRate: tradeCount > 0 ? (winCount / tradeCount) * 100 : 0,
          rollingTrades: tradeCount
        }
      })
    }

    return winRateData
  }

  // Calculate improvement metrics
  const getWinRateImprovement = () => {
    const winRateData = getWinRateData()
    if (winRateData.length < 2) return null

    const firstHalf = winRateData.slice(0, Math.floor(winRateData.length / 2))
    const secondHalf = winRateData.slice(Math.floor(winRateData.length / 2))

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, p) => sum + p.winRate, 0) / firstHalf.length
      : 0

    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, p) => sum + p.winRate, 0) / secondHalf.length
      : 0

    const improvement = secondHalfAvg - firstHalfAvg
    const improvementPercent = firstHalfAvg > 0 ? (improvement / firstHalfAvg) * 100 : 0

    return {
      firstHalfAvg: formatPercent(firstHalfAvg, 1),
      secondHalfAvg: formatPercent(secondHalfAvg, 1),
      improvement: formatPercent(improvement, 1),
      improvementPercent: formatPercent(improvementPercent, 1),
      isImproving: improvement > 0
    }
  }

  const weeklyData = getWeeklyData()
  const monthlyData = getMonthlyData()
  const yearlyData = getYearlyData()
  const dailyData = getDailyData()
  const cumulativeData = getCumulativeData()
  const strategyData = getStrategyData()
  const winRateData = getWinRateData()
  const winRateImprovement = getWinRateImprovement()

  // Color palette for strategies
  const STRATEGY_COLORS = ['#a4fc3c', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

  // Get data based on selected time frame
  const getTimeFrameData = () => {
    switch (timeFrame) {
      case 'weekly':
        return weeklyData
      case 'monthly':
        return monthlyData
      case 'yearly':
        return yearlyData
      default:
        return dailyData
    }
  }

  // Get data key for chart based on time frame
  const getDataKey = () => {
    switch (timeFrame) {
      case 'weekly':
        return 'week'
      case 'monthly':
        return 'month'
      case 'yearly':
        return 'year'
      default:
        return 'date'
    }
  }

  // Get time frame label
  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'yearly':
        return 'Yearly'
      default:
        return 'Daily'
    }
  }

  const timeFrameData = getTimeFrameData()
  const dataKey = getDataKey()

  // Calculate summary stats
  const totalPL = trades.reduce((sum, t) => sum + t.profit_loss, 0)
  const bestDay = dailyData.reduce((max, day) => 
    day.profitLoss > max.profitLoss ? day : max, dailyData[0] || { profitLoss: 0 }
  )
  const worstDay = dailyData.reduce((min, day) => 
    day.profitLoss < min.profitLoss ? day : min, dailyData[0] || { profitLoss: 0 }
  )
  const bestMonth = monthlyData.reduce((max, month) => 
    month.profitLoss > max.profitLoss ? month : max, monthlyData[0] || { profitLoss: 0 }
  )

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Trading Performance Analytics</h2>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 border border-gray-800">
          <div className="text-xs md:text-sm text-gray-400 mb-2">Total P/L</div>
          <div className={`text-2xl md:text-3xl font-bold ${totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
            {formatCurrency(totalPL, true)}
          </div>
          <div className="text-xs md:text-sm text-gray-500 mt-2">{trades.length} total trades</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 border border-gray-800">
          <div className="text-xs md:text-sm text-gray-400 mb-2">Best Day</div>
          <div className="text-2xl md:text-3xl font-bold text-[#a4fc3c]">
            {bestDay?.profitLoss ? formatCurrency(bestDay.profitLoss, true) : formatCurrency(0)}
          </div>
          <div className="text-xs md:text-sm text-gray-500 mt-2">{bestDay?.date || 'N/A'}</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 border border-gray-800">
          <div className="text-xs md:text-sm text-gray-400 mb-2">Worst Day</div>
          <div className="text-2xl md:text-3xl font-bold text-red-400">
            {worstDay?.profitLoss ? formatCurrency(worstDay.profitLoss) : formatCurrency(0)}
          </div>
          <div className="text-xs md:text-sm text-gray-500 mt-2">{worstDay?.date || 'N/A'}</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 border border-gray-800">
          <div className="text-xs md:text-sm text-gray-400 mb-2">Best Month</div>
          <div className="text-2xl md:text-3xl font-bold text-[#a4fc3c]">
            {bestMonth?.profitLoss ? formatCurrency(bestMonth.profitLoss, true) : formatCurrency(0)}
          </div>
          <div className="text-xs md:text-sm text-gray-500 mt-2">{bestMonth?.month || 'N/A'}</div>
        </div>
      </div>

      {/* Account Balance Chart */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Account Balance Over Time</h3>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<BalanceTooltip />} />
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

      {/* Profit/Loss Chart with Time Frame Selector */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white">{getTimeFrameLabel()} Profit/Loss</h3>
          
          {/* Time Frame Selector */}
          <div className="flex flex-wrap gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800 w-full sm:w-auto">
            <button
              onClick={() => setTimeFrame('daily')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                timeFrame === 'daily'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeFrame('weekly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                timeFrame === 'weekly'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeFrame('monthly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                timeFrame === 'monthly'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeFrame('yearly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                timeFrame === 'yearly'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
          <BarChart data={timeFrameData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey={dataKey} 
              stroke="#666"
              style={{ fontSize: '12px' }}
              angle={timeFrame === 'daily' ? -45 : 0}
              textAnchor={timeFrame === 'daily' ? 'end' : 'middle'}
              height={timeFrame === 'daily' ? 80 : 60}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profitLoss" name="P/L" radius={[8, 8, 0, 0]}>
              {timeFrameData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.profitLoss >= 0 ? '#a4fc3c' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Breakdown section - adapts based on time frame */}
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-800">
          {timeFrame === 'daily' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {timeFrameData.slice(-8).map((day, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">{day.date}</div>
                  <div className={`font-bold text-lg ${day.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {formatCurrency(day.profitLoss, true)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{day.trades} trades</div>
                </div>
              ))}
            </div>
          )}
          
          {timeFrame === 'weekly' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {timeFrameData.map((week, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">{week.week}</div>
                  <div className={`font-bold text-lg ${week.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {formatCurrency(week.profitLoss, true)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {week.wins}W / {week.losses}L
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {timeFrame === 'monthly' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timeFrameData.map((month, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400 mb-2">{month.month}</div>
                  <div className={`text-2xl font-bold ${month.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {formatCurrency(month.profitLoss, true)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {month.wins}W / {month.losses}L · {month.trades} trades
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatPercent((month.wins / month.trades) * 100, 1)} win rate
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {timeFrame === 'yearly' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timeFrameData.map((year, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400 mb-2">{year.year}</div>
                  <div className={`text-2xl font-bold ${year.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {formatCurrency(year.profitLoss, true)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {year.wins}W / {year.losses}L · {year.trades} trades
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatPercent((year.wins / year.trades) * 100, 1)} win rate
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Win Rate Over Time Chart */}
      {winRateData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Win Rate Over Time</h3>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Time Frame Selector */}
              <div className="flex flex-wrap gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
                <button
                  onClick={() => setWinRateTimeFrame('daily')}
                  className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    winRateTimeFrame === 'daily'
                      ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setWinRateTimeFrame('weekly')}
                  className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    winRateTimeFrame === 'weekly'
                      ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setWinRateTimeFrame('monthly')}
                  className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    winRateTimeFrame === 'monthly'
                      ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Rolling Average Selector */}
              <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
                <button
                  onClick={() => setRollingAverageType('10-trade')}
                  className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    rollingAverageType === '10-trade'
                      ? 'bg-[#3b82f6] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  10-Trade
                </button>
                <button
                  onClick={() => setRollingAverageType('30-day')}
                  className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    rollingAverageType === '30-day'
                      ? 'bg-[#3b82f6] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  30-Day
                </button>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <LineChart data={winRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="period" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                angle={winRateTimeFrame === 'daily' ? -45 : 0}
                textAnchor={winRateTimeFrame === 'daily' ? 'end' : 'middle'}
                height={winRateTimeFrame === 'daily' ? 80 : 60}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<WinRateTooltip />} />
              <Line 
                type="monotone" 
                dataKey="winRate" 
                stroke="#a4fc3c" 
                strokeWidth={2}
                dot={{ fill: '#a4fc3c', r: 4 }}
                activeDot={{ r: 6 }}
                name="Win Rate"
              />
              {winRateData[0]?.rollingWinRate !== undefined && (
                <Line 
                  type="monotone" 
                  dataKey="rollingWinRate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Rolling Avg (${rollingAverageType === '10-trade' ? '10-trade' : '30-day'})`}
                />
              )}
              <Legend />
            </LineChart>
          </ResponsiveContainer>

          {/* Improvement Metrics */}
          {winRateImprovement && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-800">
              <h4 className="text-base md:text-lg font-semibold text-white mb-4">Improvement Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">First Half Avg</div>
                  <div className="text-2xl font-bold text-white">
                    {winRateImprovement.firstHalfAvg}%
                  </div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Second Half Avg</div>
                  <div className="text-2xl font-bold text-white">
                    {winRateImprovement.secondHalfAvg}%
                  </div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Change</div>
                  <div className={`text-2xl font-bold ${
                    winRateImprovement.isImproving ? 'text-[#a4fc3c]' : 'text-red-400'
                  }`}>
                    {winRateImprovement.improvement >= 0 ? '+' : ''}{winRateImprovement.improvement}%
                  </div>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">% Change</div>
                  <div className={`text-2xl font-bold ${
                    winRateImprovement.isImproving ? 'text-[#a4fc3c]' : 'text-red-400'
                  }`}>
                    {winRateImprovement.improvementPercent >= 0 ? '+' : ''}{winRateImprovement.improvementPercent}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Periods Breakdown */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h4 className="text-lg font-semibold text-white mb-4">Recent Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {winRateData.slice(-8).map((period, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">{period.period}</div>
                  <div className="text-xl font-bold text-[#a4fc3c] mb-1">
                    {formatPercent(period.winRate, 1)}
                  </div>
                  {period.rollingWinRate !== undefined && (
                    <div className="text-xs text-blue-400 mb-1">
                      Rolling: {formatPercent(period.rollingWinRate, 1)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {period.wins}W / {period.losses}L
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strategy Performance Chart */}
      {strategyData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Strategy Performance</h3>

            {/* Chart Type Selector */}
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setStrategyChartType('bar')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  strategyChartType === 'bar'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setStrategyChartType('pie')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  strategyChartType === 'pie'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Pie Chart
              </button>
            </div>
          </div>

          {strategyChartType === 'bar' ? (
            <>
              <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<StrategyTooltip />} />
                  <Bar dataKey="totalPL" name="Total P/L" radius={[8, 8, 0, 0]}>
                    {strategyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.totalPL >= 0 ? '#a4fc3c' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Strategy Breakdown Table - Below bar chart */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-800">
                <h4 className="text-base md:text-lg font-semibold text-white mb-4">Strategy Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {strategyData.map((strategy, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-lg font-bold text-white">{strategy.name}</h5>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Total P/L</div>
                          <div className={`text-2xl font-bold ${
                            strategy.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                          }`}>
                            {formatCurrency(strategy.totalPL, true)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                            <div className="text-lg font-semibold text-white">
                              {formatPercent(strategy.winRate, 1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Trades</div>
                            <div className="text-lg font-semibold text-white">
                              {strategy.tradeCount}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
                          {strategy.wins}W / {strategy.losses}L
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Pie Chart - Left Side */}
              <div className="flex-shrink-0 lg:w-2/5 mb-6 lg:mb-0">
                <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
                  <PieChart>
                    <Pie
                      data={strategyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${formatPercent(percent * 100, 0)}`}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="totalPL"
                    >
                      {strategyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<StrategyTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Strategy Breakdown - Right Side */}
              <div className="flex-1 lg:w-3/5">
                <h4 className="text-base md:text-lg font-semibold text-white mb-4">Strategy Breakdown</h4>
                <div className={`grid gap-3 ${
                  strategyData.length === 1 ? 'grid-cols-1' :
                  strategyData.length === 2 ? 'grid-cols-2' :
                  strategyData.length <= 4 ? 'grid-cols-2' :
                  'grid-cols-2 lg:grid-cols-3'
                }`}>
                  {strategyData.map((strategy, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-base font-bold text-white">{strategy.name}</h5>
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Total P/L</div>
                          <div className={`text-xl font-bold ${
                            strategy.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                          }`}>
                            {formatCurrency(strategy.totalPL, true)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-800">
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">Win Rate</div>
                            <div className="text-sm font-semibold text-white">
                              {formatPercent(strategy.winRate, 1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">Trades</div>
                            <div className="text-sm font-semibold text-white">
                              {strategy.tradeCount}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 pt-1.5 border-t border-gray-800">
                          {strategy.wins}W / {strategy.losses}L
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Charts