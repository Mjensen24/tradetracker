import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, startOfWeek, startOfMonth, startOfYear, parseISO } from 'date-fns'

function Charts({ trades }) {
  // State for collapsible sections
  const [yearlyOpen, setYearlyOpen] = useState(false)
  const [monthlyOpen, setMonthlyOpen] = useState(false)
  const [weeklyOpen, setWeeklyOpen] = useState(false)

  // Process data for weekly chart
  const getWeeklyData = () => {
    const weekMap = {}
    
    trades.forEach(trade => {
      const date = parseISO(trade.date)
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
      const date = parseISO(trade.date)
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
      const date = parseISO(trade.date)
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
      const dateKey = trade.date
      
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: format(parseISO(trade.date), 'MMM d'),
          fullDate: trade.date,
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
      new Date(a.date) - new Date(b.date)
    )
    
    const startingBalance = 5000
    let runningBalance = startingBalance
    
    const data = [{
      date: 'Start',
      balance: startingBalance
    }]
    
    sortedTrades.forEach((trade, idx) => {
      runningBalance += trade.profit_loss
      data.push({
        date: format(parseISO(trade.date), 'MMM d'),
        balance: runningBalance,
        trade: `${trade.ticker} ${trade.profit_loss >= 0 ? '+' : ''}$${trade.profit_loss.toFixed(2)}`
      })
    })
    
    return data
  }

  const weeklyData = getWeeklyData()
  const monthlyData = getMonthlyData()
  const yearlyData = getYearlyData()
  const dailyData = getDailyData()
  const cumulativeData = getCumulativeData()

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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`text-sm ${
              entry.value >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
            }`}>
              {entry.name}: {entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}
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
        <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{payload[0].payload.date}</p>
          <p className="text-[#a4fc3c] text-sm">
            Balance: ${payload[0].value.toFixed(2)}
          </p>
          {payload[0].payload.trade && (
            <p className="text-gray-400 text-xs mt-1">{payload[0].payload.trade}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Trading Performance Analytics</h2>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Total P/L</div>
          <div className={`text-3xl font-bold ${totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-2">{trades.length} total trades</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Best Day</div>
          <div className="text-3xl font-bold text-[#a4fc3c]">
            +${bestDay?.profitLoss?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-2">{bestDay?.date || 'N/A'}</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Worst Day</div>
          <div className="text-3xl font-bold text-red-400">
            ${worstDay?.profitLoss?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-2">{worstDay?.date || 'N/A'}</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Best Month</div>
          <div className="text-3xl font-bold text-[#a4fc3c]">
            +${bestMonth?.profitLoss?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-2">{bestMonth?.month || 'N/A'}</div>
        </div>
      </div>

      {/* Account Balance Chart */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 mb-8 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">Account Balance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
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

      {/* Daily P/L Chart */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 mb-8 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">Daily Profit/Loss</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
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
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profitLoss" name="P/L" radius={[8, 8, 0, 0]}>
              {dailyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.profitLoss >= 0 ? '#a4fc3c' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Daily breakdown */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dailyData.slice(-8).map((day, idx) => (
              <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">{day.date}</div>
                <div className={`font-bold text-lg ${day.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {day.profitLoss >= 0 ? '+' : ''}${day.profitLoss.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{day.trades} trades</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly P/L Chart - Collapsible */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 mb-8">
        <button
          onClick={() => setWeeklyOpen(!weeklyOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors rounded-t-xl"
        >
          <h3 className="text-xl font-bold text-white">Weekly Profit/Loss</h3>
          <span className={`text-gray-400 transition-transform ${weeklyOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {weeklyOpen && (
          <div className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="week" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profitLoss" name="P/L" radius={[8, 8, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profitLoss >= 0 ? '#a4fc3c' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Weekly stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
              {weeklyData.map((week, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">{week.week}</div>
                  <div className={`font-bold ${week.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {week.profitLoss >= 0 ? '+' : ''}${week.profitLoss.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {week.wins}W / {week.losses}L
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly P/L Chart - Collapsible */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 mb-8">
        <button
          onClick={() => setMonthlyOpen(!monthlyOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors rounded-t-xl"
        >
          <h3 className="text-xl font-bold text-white">Monthly Profit/Loss</h3>
          <span className={`text-gray-400 transition-transform ${monthlyOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {monthlyOpen && (
          <div className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="month" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profitLoss" name="P/L" radius={[8, 8, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profitLoss >= 0 ? '#a4fc3c' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Monthly stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
              {monthlyData.map((month, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400 mb-2">{month.month}</div>
                  <div className={`text-2xl font-bold ${month.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {month.profitLoss >= 0 ? '+' : ''}${month.profitLoss.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {month.wins}W / {month.losses}L · {month.trades} trades
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {((month.wins / month.trades) * 100).toFixed(1)}% win rate
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Yearly P/L Chart - Collapsible */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800">
        <button
          onClick={() => setYearlyOpen(!yearlyOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors rounded-t-xl"
        >
          <h3 className="text-xl font-bold text-white">Yearly Profit/Loss</h3>
          <span className={`text-gray-400 transition-transform ${yearlyOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {yearlyOpen && (
          <div className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="year" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profitLoss" name="P/L" radius={[8, 8, 0, 0]}>
                  {yearlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profitLoss >= 0 ? '#a4fc3c' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Yearly stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
              {yearlyData.map((year, idx) => (
                <div key={idx} className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400 mb-2">{year.year}</div>
                  <div className={`text-2xl font-bold ${year.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {year.profitLoss >= 0 ? '+' : ''}${year.profitLoss.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {year.wins}W / {year.losses}L · {year.trades} trades
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {((year.wins / year.trades) * 100).toFixed(1)}% win rate
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Charts