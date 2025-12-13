import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'

function Calendar({ trades }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null) // For modal

  // Navigate months
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  // Get days for calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Process trades by date
  const getTradesByDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return trades.filter(trade => trade.date === dateStr)
  }

  const getDayStats = (date) => {
    const dayTrades = getTradesByDate(date)
    const profitLoss = dayTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)
    return {
      trades: dayTrades.length,
      profitLoss,
      hasData: dayTrades.length > 0
    }
  }

  // Calculate weekly totals
  const getWeekStats = (weekDays) => {
    let totalPL = 0
    let totalTrades = 0
    
    weekDays.forEach(day => {
      if (isSameMonth(day, currentMonth)) {
        const stats = getDayStats(day)
        totalPL += stats.profitLoss
        totalTrades += stats.trades
      }
    })
    
    return { profitLoss: totalPL, trades: totalTrades }
  }

  // Calculate monthly total
  const getMonthlyTotal = () => {
    const monthTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.date)
      return isSameMonth(tradeDate, currentMonth)
    })
    return monthTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)
  }

  // Handle day click
  const handleDayClick = (day) => {
    const stats = getDayStats(day)
    if (stats.hasData) {
      setSelectedDay(day)
    }
  }

  // Close modal
  const closeModal = () => setSelectedDay(null)

  // Split days into weeks
  const weeks = []
  for (let i = 0; i < daysInCalendar.length; i += 7) {
    weeks.push(daysInCalendar.slice(i, i + 7))
  }

  const monthlyTotal = getMonthlyTotal()

  // Get trades for selected day
  const selectedDayTrades = selectedDay ? getTradesByDate(selectedDay) : []
  const selectedDayTotal = selectedDayTrades.reduce((sum, t) => sum + t.profit_loss, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Trading Calendar</h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Monthly P/L: 
            <span className={`ml-2 text-2xl font-bold ${monthlyTotal >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
              {monthlyTotal >= 0 ? '+' : ''}${monthlyTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 mb-6 border border-gray-800">
        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-white">
              {format(currentMonth, 'MMMM, yyyy')}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
        {/* Day Headers */}
        <div className="grid grid-cols-8 bg-[#0a0a0a] border-b border-gray-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Total'].map((day) => (
            <div key={day} className="p-4 text-center font-semibold text-gray-400 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Weeks */}
        {weeks.map((week, weekIdx) => {
          const weekStats = getWeekStats(week)
          return (
            <div key={weekIdx} className="grid grid-cols-8 border-b border-gray-800 last:border-b-0">
              {/* Days of the week */}
              {week.map((day, dayIdx) => {
                const stats = getDayStats(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[120px] p-4 border-r border-gray-800 ${
                      !isCurrentMonth ? 'bg-[#0a0a0a] opacity-50' : ''
                    } ${isToday ? 'ring-2 ring-[#a4fc3c] ring-inset' : ''} ${
                      stats.hasData ? 'cursor-pointer hover:bg-[#2a2a2a] transition-colors' : ''
                    }`}
                  >
                    {/* Date number */}
                    <div className={`text-sm mb-2 ${
                      isToday ? 'text-[#a4fc3c] font-bold' : 
                      isCurrentMonth ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {format(day, 'd')}
                      {isToday && (
                        <span className="ml-1 text-xs bg-[#a4fc3c] text-black px-1 rounded">TODAY</span>
                      )}
                    </div>
                    
                    {/* Stats */}
                    {stats.hasData && (
                      <div className="space-y-1">
                        <div className={`font-bold text-lg ${
                          stats.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                        }`}>
                          {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.trades} trade{stats.trades !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    {!stats.hasData && isCurrentMonth && (
                      <div className="text-gray-600 text-sm">
                        $0<br />
                        <span className="text-xs">0 trades</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Week Total Column */}
              <div className="min-h-[120px] p-4 bg-[#0a0a0a] border-l-2 border-gray-700">
                <div className="text-sm text-gray-400 mb-2 font-semibold">
                  Week {weekIdx + 1}
                </div>
                {weekStats.trades > 0 && (
                  <div className="space-y-1">
                    <div className={`font-bold text-lg ${
                      weekStats.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                    }`}>
                      {weekStats.profitLoss >= 0 ? '+' : ''}${weekStats.profitLoss.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {weekStats.trades} trade{weekStats.trades !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                {weekStats.trades === 0 && (
                  <div className="text-gray-600 text-sm">
                    $0<br />
                    <span className="text-xs">0 trades</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#a4fc3c] rounded"></div>
          <span>Profitable Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span>Loss Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 ring-2 ring-[#a4fc3c] rounded"></div>
          <span>Today</span>
        </div>
        <div className="text-gray-500">
          💡 Click any day with trades to view details
        </div>
      </div>

      {/* Modal for Day Details */}
      {selectedDay && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-[#1a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0a0a0a] p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className={`text-lg font-semibold mt-1 ${
                  selectedDayTotal >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  Day Total: {selectedDayTotal >= 0 ? '+' : ''}${selectedDayTotal.toFixed(2)}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Trade List */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                {selectedDayTrades.map((trade) => (
                  <div 
                    key={trade.id}
                    className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Trade Header */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Ticker</div>
                        <div className="text-xl font-bold text-white">{trade.ticker}</div>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                          trade.long_short === 'L' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.long_short === 'L' ? 'LONG' : 'SHORT'}
                        </span>
                      </div>

                      {/* Entry/Exit */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Entry → Exit</div>
                        <div className="text-white">
                          ${trade.entry_price.toFixed(2)} → ${trade.exit_price.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {trade.shares} shares
                        </div>
                      </div>

                      {/* P/L */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Profit/Loss</div>
                        <div className={`text-2xl font-bold ${
                          trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                        }`}>
                          {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                        </div>
                      </div>

                      {/* Setup Quality */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Setup Quality</div>
                        <span className={`inline-block px-3 py-1 rounded font-semibold ${
                          trade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                          trade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          Grade {trade.setup_quality}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {trade.setup_type}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Stop Loss:</span>
                        <span className="text-white ml-2">${trade.stop_loss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fiber:</span>
                        <span className="text-white ml-2">{trade.fiber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ranges:</span>
                        <span className="text-white ml-2">{trade.ranges}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pullback:</span>
                        <span className="text-white ml-2">{trade.pullback_type}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {trade.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="text-xs text-gray-500 mb-1">Notes</div>
                        <div className="text-gray-300 text-sm">{trade.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0a0a0a] p-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar