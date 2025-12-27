import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area, ScatterChart, Scatter, ReferenceLine } from 'recharts'
import { format, startOfWeek, startOfMonth, startOfYear, parseISO, subDays } from 'date-fns'
import { formatDateChart, formatCurrency, formatPercent } from '../utils/formatters'
import { calculateStats, calculateCalendarInsights } from '../utils/tradeCalculations'

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
  // State for win rate chart time frame
  const [winRateTimeFrame, setWinRateTimeFrame] = useState('daily')
  // State for rolling average type
  const [rollingAverageType, setRollingAverageType] = useState('10-trade')
  // State for setup quality time frame
  const [setupQualityTimeFrame, setSetupQualityTimeFrame] = useState('daily')
  // State for collapsed sections
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false)
  // State for account balance chart timeframe
  const [balanceTimeFrame, setBalanceTimeFrame] = useState('daily')
  // State for additional chart timeframes
  const [positionSizingTimeFrame, setPositionSizingTimeFrame] = useState('daily')
  const [pullbackSetupTimeFrame, setPullbackSetupTimeFrame] = useState('daily')
  const [newsTimeFrame, setNewsTimeFrame] = useState('daily')
  const [sectorTimeFrame, setSectorTimeFrame] = useState('daily')
  const [dayOfWeekTimeFrame, setDayOfWeekTimeFrame] = useState('daily')
  const [riskRewardTimeFrame, setRiskRewardTimeFrame] = useState('daily')
  const [expectancyTimeFrame, setExpectancyTimeFrame] = useState('daily')
  // State for selected strategy in pie chart
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState(0)
  // State for strategy chart type (bar or pie)
  const [strategyChartType, setStrategyChartType] = useState('bar')

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
          weekStart: weekStart, // Store actual date for sorting
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

    return Object.values(weekMap).sort((a, b) => a.weekStart - b.weekStart)
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

    // Group trades by timeframe
    const periodMap = {}

    sortedTrades.forEach((trade) => {
      const date = parseISO(trade.trade_date)
      let periodKey
      let fullDate

      switch (balanceTimeFrame) {
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
        case 'yearly': {
          const yearStart = startOfYear(date)
          periodKey = format(yearStart, 'yyyy')
          fullDate = yearStart
          break
        }
        default: { // daily
          periodKey = formatDateChart(trade.trade_date)
          fullDate = trade.trade_date
          break
        }
      }

      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          date: periodKey,
          fullDate: fullDate,
          profitLoss: 0,
          trades: []
        }
      }

      periodMap[periodKey].profitLoss += trade.profit_loss
      periodMap[periodKey].trades.push(trade)
    })

    // Convert to array and calculate running balance
    const data = [{
      date: 'Start',
      balance: startingBalance
    }]

    Object.values(periodMap)
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
      .forEach((period) => {
        runningBalance += period.profitLoss
        const tradeInfo = period.trades.length === 1
          ? `${period.trades[0].ticker} ${formatCurrency(period.profitLoss, true)}`
          : `${period.trades.length} trades: ${formatCurrency(period.profitLoss, true)}`

        data.push({
          date: period.date,
          balance: runningBalance,
          trade: tradeInfo
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

  // Process data for position sizing analysis
  const getPositionSizingData = () => {
    const positionData = trades.map(trade => ({
      positionSize: trade.entry_price * trade.shares,
      profitLoss: trade.profit_loss,
      ticker: trade.ticker,
      win: trade.profit_loss > 0
    }))

    // Create buckets
    const buckets = {
      small: { trades: [], label: '< $1,000' },
      medium: { trades: [], label: '$1,000 - $5,000' },
      large: { trades: [], label: '> $5,000' }
    }

    positionData.forEach(trade => {
      if (trade.positionSize < 1000) {
        buckets.small.trades.push(trade)
      } else if (trade.positionSize <= 5000) {
        buckets.medium.trades.push(trade)
      } else {
        buckets.large.trades.push(trade)
      }
    })

    const bucketStats = Object.entries(buckets).map(([, bucket]) => {
      const totalPL = bucket.trades.reduce((sum, t) => sum + t.profitLoss, 0)
      const wins = bucket.trades.filter(t => t.win).length
      const winRate = bucket.trades.length > 0 ? (wins / bucket.trades.length) * 100 : 0
      const avgPL = bucket.trades.length > 0 ? totalPL / bucket.trades.length : 0

      return {
        label: bucket.label,
        totalPL,
        winRate,
        avgPL,
        trades: bucket.trades.length,
        wins,
        losses: bucket.trades.length - wins
      }
    })

    return { scatterData: positionData, bucketStats }
  }

  // Process data for setup quality performance over time
  const getSetupQualityTimeData = () => {
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date) - new Date(b.trade_date)
    )

    const periodMap = {}

    sortedTrades.forEach(trade => {
      if (!trade.setup_quality) return

      const date = parseISO(trade.trade_date)
      let periodKey
      let fullDate

      switch (setupQualityTimeFrame) {
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
        default: {
          periodKey = format(date, 'MMM d')
          fullDate = date
          break
        }
      }

      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: periodKey,
          fullDate: fullDate,
          A: { pl: 0, trades: 0, wins: 0 },
          B: { pl: 0, trades: 0, wins: 0 },
          C: { pl: 0, trades: 0, wins: 0 }
        }
      }

      const quality = trade.setup_quality
      if (periodMap[periodKey][quality]) {
        periodMap[periodKey][quality].pl += trade.profit_loss
        periodMap[periodKey][quality].trades += 1
        if (trade.profit_loss > 0) periodMap[periodKey][quality].wins += 1
      }
    })

    return Object.values(periodMap)
      .map(period => ({
        ...period,
        A: {
          ...period.A,
          winRate: period.A.trades > 0 ? (period.A.wins / period.A.trades) * 100 : 0
        },
        B: {
          ...period.B,
          winRate: period.B.trades > 0 ? (period.B.wins / period.B.trades) * 100 : 0
        },
        C: {
          ...period.C,
          winRate: period.C.trades > 0 ? (period.C.wins / period.C.trades) * 100 : 0
        }
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
  }

  // Process data for pullback type and setup type analysis
  const getPullbackSetupData = () => {
    const pullbackMap = {}
    const setupMap = {}

    trades.forEach(trade => {
      // Pullback type
      const pullback = trade.pullback_type || 'None'
      if (!pullbackMap[pullback]) {
        pullbackMap[pullback] = { name: pullback, totalPL: 0, trades: 0, wins: 0, losses: 0 }
      }
      pullbackMap[pullback].totalPL += trade.profit_loss
      pullbackMap[pullback].trades += 1
      if (trade.profit_loss > 0) pullbackMap[pullback].wins += 1
      else if (trade.profit_loss < 0) pullbackMap[pullback].losses += 1

      // Setup type
      const setup = trade.setup_type || 'None'
      if (!setupMap[setup]) {
        setupMap[setup] = { name: setup, totalPL: 0, trades: 0, wins: 0, losses: 0 }
      }
      setupMap[setup].totalPL += trade.profit_loss
      setupMap[setup].trades += 1
      if (trade.profit_loss > 0) setupMap[setup].wins += 1
      else if (trade.profit_loss < 0) setupMap[setup].losses += 1
    })

    const pullbackData = Object.values(pullbackMap)
      .map(item => ({
        ...item,
        winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0
      }))
      .sort((a, b) => b.totalPL - a.totalPL)

    const setupData = Object.values(setupMap)
      .map(item => ({
        ...item,
        winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0
      }))
      .sort((a, b) => b.totalPL - a.totalPL)

    return { pullbackData, setupData }
  }

  // Process data for risk/reward ratio over time
  const getRiskRewardData = () => {
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date) - new Date(b.trade_date)
    )

    const periodMap = {}

    sortedTrades.forEach(trade => {
      const date = parseISO(trade.trade_date)
      let periodKey
      let fullDate

      switch (timeFrame) {
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
        default: {
          periodKey = format(date, 'MMM d')
          fullDate = date
          break
        }
      }

      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: periodKey,
          fullDate: fullDate,
          wins: [],
          losses: []
        }
      }

      if (trade.profit_loss > 0) {
        periodMap[periodKey].wins.push(trade.profit_loss)
      } else if (trade.profit_loss < 0) {
        periodMap[periodKey].losses.push(Math.abs(trade.profit_loss))
      }
    })

    return Object.values(periodMap)
      .map(period => {
        const avgWin = period.wins.length > 0 
          ? period.wins.reduce((sum, w) => sum + w, 0) / period.wins.length 
          : 0
        const avgLoss = period.losses.length > 0
          ? period.losses.reduce((sum, l) => sum + l, 0) / period.losses.length
          : 0
        const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0

        return {
          ...period,
          avgWin,
          avgLoss,
          riskReward
        }
      })
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
  }

  // Process data for expectancy trend
  const getExpectancyData = () => {
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.trade_date) - new Date(b.trade_date)
    )

    const periodMap = {}

    sortedTrades.forEach(trade => {
      const date = parseISO(trade.trade_date)
      let periodKey
      let fullDate

      switch (timeFrame) {
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
        default: {
          periodKey = format(date, 'MMM d')
          fullDate = date
          break
        }
      }

      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: periodKey,
          fullDate: fullDate,
          totalPL: 0,
          trades: 0
        }
      }

      periodMap[periodKey].totalPL += trade.profit_loss
      periodMap[periodKey].trades += 1
    })

    return Object.values(periodMap)
      .map(period => ({
        ...period,
        expectancy: period.trades > 0 ? period.totalPL / period.trades : 0
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
  }

  const weeklyData = getWeeklyData()
  const monthlyData = getMonthlyData()
  const yearlyData = getYearlyData()
  const dailyData = getDailyData()
  const cumulativeData = getCumulativeData()
  const strategyData = getStrategyData()
  const winRateData = getWinRateData()
  const winRateImprovement = getWinRateImprovement()
  
  // New data processing
  const positionSizingData = getPositionSizingData()
  const setupQualityTimeData = getSetupQualityTimeData()
  const pullbackSetupData = getPullbackSetupData()
  const riskRewardData = getRiskRewardData()
  const expectancyData = getExpectancyData()
  
  // Get stats for news/sector analysis
  const stats = calculateStats(trades, 5000)
  const currentMonth = new Date()
  const calendarInsights = calculateCalendarInsights(trades, currentMonth)

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
          <BarChart data={timeFrameData} barCategoryGap={timeFrameData.length <= 3 ? '40%' : '20%'}>
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
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="profitLoss" name="P/L" radius={[8, 8, 0, 0]} maxBarSize={80}>
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

      {/* Strategy Performance Chart */}
      {strategyData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg mb-6 md:mb-8 border border-gray-800 overflow-hidden flex flex-col lg:flex-row">
          {/* Left side - Header + Chart */}
          <div className="w-full lg:w-3/5 p-4 md:p-6 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg md:text-xl font-bold text-white">Strategy Performance</h3>
              <div className="flex gap-1 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
                <button
                  onClick={() => setStrategyChartType('bar')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    strategyChartType === 'bar'
                      ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Bar Chart"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setStrategyChartType('pie')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    strategyChartType === 'pie'
                      ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Pie Chart"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              {strategyChartType === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={strategyData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis 
                      type="number"
                      stroke="#666"
                      style={{ fontSize: '11px' }}
                      tickFormatter={(value) => formatCurrency(value, true)}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      width={90}
                      tick={{ fill: '#999' }}
                    />
                    <Tooltip content={<StrategyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar 
                      dataKey="totalPL" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data, index) => {
                        if (index !== undefined && index !== null) {
                          setSelectedStrategyIndex(index)
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {strategyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.totalPL >= 0 ? '#a4fc3c' : '#ef4444'}
                          opacity={selectedStrategyIndex === index ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={strategyData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      fill="#8884d8"
                      dataKey="totalPL"
                      onClick={(data, index) => {
                        if (index !== undefined && index !== null) {
                          setSelectedStrategyIndex(index)
                        }
                      }}
                    >
                      {strategyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]}
                          stroke={selectedStrategyIndex === index ? '#fff' : 'transparent'}
                          strokeWidth={selectedStrategyIndex === index ? 2 : 0}
                          style={{
                            cursor: 'pointer',
                            filter: selectedStrategyIndex === index ? 'brightness(1.1)' : 'brightness(0.8)',
                            transition: 'filter 0.2s'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<StrategyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend 
                      onClick={(e) => {
                        const index = strategyData.findIndex(s => s.name === e.value)
                        if (index !== -1) {
                          setSelectedStrategyIndex(index)
                        }
                      }}
                      wrapperStyle={{ cursor: 'pointer' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* Right side - Strategy Details Panel (full height) */}
          <div className="w-full lg:w-2/5 lg:border-l border-t lg:border-t-0 border-gray-800 bg-[#0a0a0a]">
            {strategyData[selectedStrategyIndex] && (() => {
              const strategy = strategyData[selectedStrategyIndex]
              const idx = selectedStrategyIndex
              const strategyTrades = trades.filter(t => t.strategy === strategy.name)
              const avgWin = strategy.wins > 0 
                ? strategyTrades.filter(t => t.profit_loss > 0)
                    .reduce((sum, t) => sum + t.profit_loss, 0) / strategy.wins 
                : 0
              const avgLoss = strategy.losses > 0
                ? Math.abs(strategyTrades.filter(t => t.profit_loss < 0)
                    .reduce((sum, t) => sum + t.profit_loss, 0) / strategy.losses)
                : 0
              const profitFactor = avgLoss > 0 ? (avgWin * strategy.wins) / (avgLoss * strategy.losses) : 0
              const largestWin = strategyTrades.length > 0 
                ? Math.max(...strategyTrades.map(t => t.profit_loss))
                : 0
              const largestLoss = strategyTrades.length > 0 
                ? Math.min(...strategyTrades.map(t => t.profit_loss))
                : 0
              const avgTrade = strategy.tradeCount > 0 ? strategy.totalPL / strategy.tradeCount : 0
              const plPercentOfTotal = totalPL !== 0 ? (strategy.totalPL / totalPL) * 100 : 0
              
              return (
                <div className="flex flex-col h-full">
                  {/* Header with strategy name */}
                  <div 
                    className="px-5 py-3 flex items-center gap-2 flex-shrink-0"
                    style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] + '20' }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }}
                    />
                    <h4 className="text-base font-bold text-white">{strategy.name}</h4>
                  </div>
                  
                  {/* Main P/L - Hero stat */}
                  <div className="px-5 py-3 border-b border-gray-800 flex-shrink-0">
                    <div className={`text-2xl font-bold ${
                      strategy.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                    }`}>
                      {formatCurrency(strategy.totalPL, true)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Total P/L · {plPercentOfTotal >= 0 ? '+' : ''}{plPercentOfTotal.toFixed(1)}% of portfolio</div>
                  </div>
                  
                  {/* Win Rate with visual bar */}
                  <div className="px-5 py-3 border-b border-gray-800 flex-shrink-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-400">Win Rate</span>
                      <span className="text-sm font-bold text-white">{formatPercent(strategy.winRate, 1)}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(strategy.winRate, 100)}%`,
                          backgroundColor: strategy.winRate >= 50 ? '#a4fc3c' : '#ef4444'
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs">
                      <span className="text-[#a4fc3c]">{strategy.wins}W</span>
                      <span className="text-red-400">{strategy.losses}L</span>
                    </div>
                  </div>
                  
                  {/* Stats Grid - fills remaining space */}
                  <div className="grid grid-cols-2 grid-rows-4 divide-x divide-gray-800 flex-1">
                    <div className="px-5 py-2.5 flex flex-col justify-center border-b border-gray-800">
                      <div className="text-lg font-bold text-white">{strategy.tradeCount}</div>
                      <div className="text-xs text-gray-500">Trades</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center border-b border-gray-800">
                      <div className={`text-lg font-bold ${profitFactor >= 1 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                        {profitFactor > 0 ? profitFactor.toFixed(2) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Profit Factor</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center border-b border-gray-800">
                      <div className={`text-lg font-bold ${avgTrade >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                        {formatCurrency(avgTrade, true)}
                      </div>
                      <div className="text-xs text-gray-500">Avg Trade</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center border-b border-gray-800">
                      <div className={`text-lg font-bold ${avgLoss > 0 && avgWin / avgLoss >= 1 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                        {avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Risk/Reward</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center border-b border-gray-800">
                      <div className="text-lg font-bold text-[#a4fc3c]">
                        {avgWin > 0 ? formatCurrency(avgWin) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Avg Win</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center border-b border-gray-800">
                      <div className="text-lg font-bold text-red-400">
                        {avgLoss > 0 ? formatCurrency(avgLoss) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Avg Loss</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center">
                      <div className="text-lg font-bold text-[#a4fc3c]">
                        {largestWin > 0 ? formatCurrency(largestWin, true) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Best Trade</div>
                    </div>
                    <div className="px-5 py-2.5 flex flex-col justify-center">
                      <div className="text-lg font-bold text-red-400">
                        {largestLoss < 0 ? formatCurrency(largestLoss) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">Worst Trade</div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Account Balance Chart */}
      {(() => {
        // Calculate Y-axis domain for better relative scaling
        const balances = cumulativeData.map(d => d.balance)
        const minBalance = Math.min(...balances)
        const maxBalance = Math.max(...balances)
        const range = maxBalance - minBalance
        const padding = range > 0 ? range * 0.1 : Math.max(minBalance * 0.05, 100)
        const yAxisDomain = [Math.max(0, minBalance - padding), maxBalance + padding]
        
        return (
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white">Account Balance Over Time</h3>
          <div className="flex flex-wrap gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800 w-full sm:w-auto">
            <button
              onClick={() => setBalanceTimeFrame('daily')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                balanceTimeFrame === 'daily'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setBalanceTimeFrame('weekly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                balanceTimeFrame === 'weekly'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setBalanceTimeFrame('monthly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                balanceTimeFrame === 'monthly'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBalanceTimeFrame('yearly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                balanceTimeFrame === 'yearly'
                  ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              style={{ fontSize: '12px' }}
              angle={balanceTimeFrame === 'daily' ? -45 : 0}
              textAnchor={balanceTimeFrame === 'daily' ? 'end' : 'middle'}
              height={balanceTimeFrame === 'daily' ? 80 : 60}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
              domain={yAxisDomain}
            />
            <Tooltip 
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                      <p className="text-white font-semibold mb-1">{data.date}</p>
                      <p className="text-[#a4fc3c] text-sm">Balance: {formatCurrency(data.balance)}</p>
                      {data.trade && (
                        <p className="text-gray-400 text-xs mt-1">{data.trade}</p>
                      )}
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
              name="Balance"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
        )
      })()}

      {/* Collapsible Section Toggle */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
          className="w-full bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 border border-gray-800 hover:bg-[#2a2a2a] transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-bold text-white">
              {showAdvancedCharts ? 'Hide' : 'Show'} Advanced Analytics
            </h3>
            <svg
              className={`w-6 h-6 text-gray-400 transition-transform ${showAdvancedCharts ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>

      {showAdvancedCharts && (
        <>
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
              <Tooltip content={<WinRateTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
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

      {/* Position Sizing Analysis */}
      {positionSizingData.scatterData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Position Sizing Analysis</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setPositionSizingTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  positionSizingTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPositionSizingTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  positionSizingTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPositionSizingTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  positionSizingTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <ScatterChart data={positionSizingData.scatterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                type="number" 
                dataKey="positionSize" 
                name="Position Size"
                stroke="#666"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <YAxis 
                type="number" 
                dataKey="profitLoss" 
                name="P/L"
                stroke="#666"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                        <p className="text-white font-semibold mb-1">{data.ticker}</p>
                        <p className="text-gray-300 text-sm">Position: {formatCurrency(data.positionSize)}</p>
                        <p className={`text-sm ${data.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          P/L: {formatCurrency(data.profitLoss, true)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter 
                dataKey="profitLoss" 
                fill="#a4fc3c"
              >
                {positionSizingData.scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.win ? '#a4fc3c' : '#ef4444'} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          
          {/* Position Size Buckets */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h4 className="text-base md:text-lg font-semibold text-white mb-4">Performance by Position Size</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {positionSizingData.bucketStats.map((bucket, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-sm font-semibold text-white mb-3">{bucket.label}</div>
                  <div className={`text-2xl font-bold mb-2 ${bucket.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {formatCurrency(bucket.totalPL, true)}
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Avg P/L: {formatCurrency(bucket.avgPL, true)}</div>
                  <div className="text-sm text-gray-400 mb-1">Win Rate: {formatPercent(bucket.winRate, 1)}</div>
                  <div className="text-xs text-gray-500 mt-2">{bucket.trades} trades ({bucket.wins}W / {bucket.losses}L)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Setup Quality Performance Over Time */}
      {setupQualityTimeData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Setup Quality Performance Over Time</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setSetupQualityTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  setupQualityTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSetupQualityTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  setupQualityTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSetupQualityTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  setupQualityTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <LineChart data={setupQualityTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="period" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                angle={setupQualityTimeFrame === 'daily' ? -45 : 0}
                textAnchor={setupQualityTimeFrame === 'daily' ? 'end' : 'middle'}
                height={setupQualityTimeFrame === 'daily' ? 80 : 60}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                        <p className="text-white font-semibold mb-2">{data.period}</p>
                        {data.A.trades > 0 && (
                          <p className="text-sm mb-1">
                            <span className="text-[#a4fc3c]">A:</span> {formatCurrency(data.A.pl, true)} ({data.A.trades} trades)
                          </p>
                        )}
                        {data.B.trades > 0 && (
                          <p className="text-sm mb-1">
                            <span className="text-[#3b82f6]">B:</span> {formatCurrency(data.B.pl, true)} ({data.B.trades} trades)
                          </p>
                        )}
                        {data.C.trades > 0 && (
                          <p className="text-sm">
                            <span className="text-[#f59e0b]">C:</span> {formatCurrency(data.C.pl, true)} ({data.C.trades} trades)
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="A.pl" 
                stroke="#a4fc3c" 
                strokeWidth={2}
                name="Quality A"
                dot={{ fill: '#a4fc3c', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="B.pl" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Quality B"
                dot={{ fill: '#3b82f6', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="C.pl" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Quality C"
                dot={{ fill: '#f59e0b', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pullback Type & Setup Type Analysis */}
      {(pullbackSetupData.pullbackData.length > 0 || pullbackSetupData.setupData.length > 0) && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Entry Pattern Analysis</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setPullbackSetupTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  pullbackSetupTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPullbackSetupTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  pullbackSetupTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPullbackSetupTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  pullbackSetupTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pullback Type */}
            {pullbackSetupData.pullbackData.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-white mb-4">Pullback Type Performance</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pullbackSetupData.pullbackData}>
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
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                              <p className="text-white font-semibold mb-2">{data.name}</p>
                              <p className={`text-sm mb-1 ${data.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                                Total P/L: {formatCurrency(data.totalPL, true)}
                              </p>
                              <p className="text-gray-300 text-sm mb-1">Win Rate: {formatPercent(data.winRate, 1)}</p>
                              <p className="text-gray-400 text-xs">{data.trades} trades ({data.wins}W / {data.losses}L)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="totalPL" name="Total P/L" radius={[8, 8, 0, 0]}>
                      {pullbackSetupData.pullbackData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.totalPL >= 0 ? '#a4fc3c' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Setup Type */}
            {pullbackSetupData.setupData.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-white mb-4">Setup Type Performance</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pullbackSetupData.setupData}>
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
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                              <p className="text-white font-semibold mb-2">{data.name}</p>
                              <p className={`text-sm mb-1 ${data.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                                Total P/L: {formatCurrency(data.totalPL, true)}
                              </p>
                              <p className="text-gray-300 text-sm mb-1">Win Rate: {formatPercent(data.winRate, 1)}</p>
                              <p className="text-gray-400 text-xs">{data.trades} trades ({data.wins}W / {data.losses}L)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="totalPL" name="Total P/L" radius={[8, 8, 0, 0]}>
                      {pullbackSetupData.setupData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.totalPL >= 0 ? '#a4fc3c' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* News vs No-News Performance */}
      {(stats.newsStats?.trades > 0 || stats.noNewsStats?.trades > 0) && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">News vs No-News Performance</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setNewsTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  newsTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setNewsTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  newsTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setNewsTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  newsTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'With News', totalPL: stats.newsStats.totalPL, winRate: stats.newsStats.winRate, trades: stats.newsStats.trades },
                { name: 'No News', totalPL: stats.noNewsStats.totalPL, winRate: stats.noNewsStats.winRate, trades: stats.noNewsStats.trades }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                          <p className="text-white font-semibold mb-2">{data.name}</p>
                          <p className={`text-sm mb-1 ${data.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                            Total P/L: {formatCurrency(data.totalPL, true)}
                          </p>
                          <p className="text-gray-300 text-sm mb-1">Win Rate: {formatPercent(data.winRate, 1)}</p>
                          <p className="text-gray-400 text-xs">{data.trades} trades</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="totalPL" name="Total P/L" radius={[8, 8, 0, 0]}>
                  <Cell fill="#a4fc3c" />
                  <Cell fill={stats.noNewsStats.totalPL >= 0 ? '#a4fc3c' : '#ef4444'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">With News</div>
                <div className={`text-2xl font-bold mb-2 ${stats.newsStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {formatCurrency(stats.newsStats.totalPL, true)}
                </div>
                <div className="text-sm text-gray-300">Win Rate: {formatPercent(stats.newsStats.winRate, 1)}</div>
                <div className="text-xs text-gray-500 mt-1">{stats.newsStats.trades} trades</div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">No News</div>
                <div className={`text-2xl font-bold mb-2 ${stats.noNewsStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {formatCurrency(stats.noNewsStats.totalPL, true)}
                </div>
                <div className="text-sm text-gray-300">Win Rate: {formatPercent(stats.noNewsStats.winRate, 1)}</div>
                <div className="text-xs text-gray-500 mt-1">{stats.noNewsStats.trades} trades</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sector Performance */}
      {stats.sectorStats && stats.sectorStats.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Sector Performance</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setSectorTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  sectorTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSectorTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  sectorTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSectorTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  sectorTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <BarChart 
              data={stats.sectorStats.sort((a, b) => b.totalPL - a.totalPL).slice(0, 10)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                type="number"
                stroke="#666"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                        <p className="text-white font-semibold mb-2">{data.name}</p>
                        <p className={`text-sm mb-1 ${data.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          Total P/L: {formatCurrency(data.totalPL, true)}
                        </p>
                        <p className="text-gray-300 text-sm mb-1">Win Rate: {formatPercent(data.winRate, 1)}</p>
                        <p className="text-gray-400 text-xs">{data.trades} trades</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="totalPL" name="Total P/L" radius={[0, 8, 8, 0]}>
                {stats.sectorStats.sort((a, b) => b.totalPL - a.totalPL).slice(0, 10).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.totalPL >= 0 ? '#a4fc3c' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day of Week Performance */}
      {calendarInsights.dayOfWeekStats && calendarInsights.dayOfWeekStats.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Day of Week Performance</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setDayOfWeekTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  dayOfWeekTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setDayOfWeekTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  dayOfWeekTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setDayOfWeekTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  dayOfWeekTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <BarChart data={calendarInsights.dayOfWeekStats.sort((a, b) => a.dayOfWeek - b.dayOfWeek)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="shortName" 
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                        <p className="text-white font-semibold mb-2">{data.dayName}</p>
                        <p className={`text-sm mb-1 ${data.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          Total P/L: {formatCurrency(data.totalPL, true)}
                        </p>
                        <p className="text-gray-300 text-sm mb-1">Avg P/L: {formatCurrency(data.avgPL, true)}</p>
                        <p className="text-gray-300 text-sm mb-1">Win Rate: {formatPercent(data.winRate, 1)}</p>
                        <p className="text-gray-400 text-xs">{data.trades} trades ({data.wins}W / {data.losses}L)</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="totalPL" name="Total P/L" radius={[8, 8, 0, 0]}>
                {calendarInsights.dayOfWeekStats.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.totalPL >= 0 ? '#a4fc3c' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk/Reward Ratio Over Time */}
      {riskRewardData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Risk/Reward Ratio Over Time</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setRiskRewardTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  riskRewardTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setRiskRewardTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  riskRewardTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setRiskRewardTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  riskRewardTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg px-3 py-2 border border-gray-800">
              <div className="text-xs text-gray-400">Target: 2:1</div>
              <div className="text-sm font-bold text-[#a4fc3c]">2.0:1</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <LineChart data={riskRewardData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="period" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                angle={timeFrame === 'daily' ? -45 : 0}
                textAnchor={timeFrame === 'daily' ? 'end' : 'middle'}
                height={timeFrame === 'daily' ? 80 : 60}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(1)}:1`}
              />
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                        <p className="text-white font-semibold mb-2">{data.period}</p>
                        <p className="text-sm text-gray-300 mb-1">Risk/Reward: {data.riskReward.toFixed(2)}:1</p>
                        <p className="text-sm text-[#a4fc3c]">Avg Win: {formatCurrency(data.avgWin)}</p>
                        <p className="text-sm text-red-400">Avg Loss: {formatCurrency(data.avgLoss)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="riskReward" 
                stroke="#a4fc3c" 
                strokeWidth={2}
                dot={{ fill: '#a4fc3c', r: 4 }}
                activeDot={{ r: 6 }}
                name="Risk/Reward"
              />
              <Line 
                type="monotone" 
                dataKey={() => 2} 
                stroke="#666" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Target (2:1)"
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expectancy Trend */}
      {expectancyData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white">Expectancy Trend</h3>
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-800">
              <button
                onClick={() => setExpectancyTimeFrame('daily')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  expectancyTimeFrame === 'daily'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setExpectancyTimeFrame('weekly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  expectancyTimeFrame === 'weekly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setExpectancyTimeFrame('monthly')}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  expectancyTimeFrame === 'monthly'
                    ? 'bg-[#a4fc3c] text-[#0a0a0a]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] md:h-[400px]">
            <LineChart data={expectancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="period" 
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
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 shadow-lg">
                        <p className="text-white font-semibold mb-2">{data.period}</p>
                        <p className={`text-sm mb-1 ${data.expectancy >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                          Expectancy: {formatCurrency(data.expectancy, true)}
                        </p>
                        <p className="text-gray-300 text-sm">Total P/L: {formatCurrency(data.totalPL, true)}</p>
                        <p className="text-gray-400 text-xs">{data.trades} trades</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="expectancy" 
                stroke="#a4fc3c" 
                strokeWidth={2}
                dot={{ fill: '#a4fc3c', r: 4 }}
                activeDot={{ r: 6 }}
                name="Expectancy"
              />
              <Line 
                type="monotone" 
                dataKey={() => 0} 
                stroke="#666" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default Charts