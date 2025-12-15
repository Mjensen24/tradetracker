import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
import { formatCurrency, formatDateLong } from '../utils/formatters'
import QualityBadge from './ui/QualityBadge'

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
    return trades.filter(trade => trade.trade_date === dateStr)
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
      const tradeDate = parseISO(trade.trade_date)
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

  // Handle ESC key to close modal
  useEffect(() => {
    if (!selectedDay) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedDay])

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
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Trading Calendar</h2>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-400">
            Monthly P/L: 
            <span className={`ml-2 text-xl sm:text-2xl font-bold ${monthlyTotal >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
              {formatCurrency(monthlyTotal, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors text-sm md:text-base"
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="text-lg md:text-xl font-semibold text-white">
              {format(currentMonth, 'MMMM, yyyy')}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs sm:text-sm bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
            >
              Today
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors text-sm md:text-base"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800 overflow-x-auto">
        {/* Day Headers */}
        <div className="grid grid-cols-7 lg:grid-cols-8 bg-[#0a0a0a] border-b border-gray-800 min-w-[700px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 md:p-4 text-center font-semibold text-gray-400 text-xs sm:text-sm">
              {day}
            </div>
          ))}
          <div className="hidden lg:block p-2 md:p-4 text-center font-semibold text-gray-400 text-xs sm:text-sm">
            Total
          </div>
        </div>

        {/* Calendar Weeks */}
        {weeks.map((week, weekIdx) => {
          const weekStats = getWeekStats(week)
          return (
            <div key={weekIdx} className="grid grid-cols-7 lg:grid-cols-8 border-b border-gray-800 last:border-b-0 min-w-[700px]">
              {/* Days of the week */}
              {week.map((day, dayIdx) => {
                const stats = getDayStats(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[100px] sm:min-h-[120px] p-2 md:p-4 border-r border-gray-800 ${
                      !isCurrentMonth ? 'bg-[#0a0a0a] opacity-50' : ''
                    } ${isToday ? 'ring-2 ring-[#a4fc3c] ring-inset' : ''} ${
                      stats.hasData ? 'cursor-pointer hover:bg-[#2a2a2a] transition-colors' : ''
                    }`}
                  >
                    {/* Date number */}
                    <div className={`text-xs sm:text-sm mb-1 sm:mb-2 ${
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
                        <div className={`font-bold text-sm sm:text-lg ${
                          stats.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                        }`}>
                          {formatCurrency(stats.profitLoss, true)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats.trades} trade{stats.trades !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    {!stats.hasData && isCurrentMonth && (
                      <div className="text-gray-600 text-xs sm:text-sm">
                        $0<br />
                        <span className="text-xs">0 trades</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Week Total Column - Hidden on mobile */}
              <div className="hidden lg:block min-h-[100px] sm:min-h-[120px] p-2 md:p-4 bg-[#0a0a0a] border-l-2 border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400 mb-2 font-semibold">
                  Week {weekIdx + 1}
                </div>
                {weekStats.trades > 0 && (
                  <div className="space-y-1">
                    <div className={`font-bold text-sm sm:text-lg ${
                      weekStats.profitLoss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                    }`}>
                      {formatCurrency(weekStats.profitLoss, true)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {weekStats.trades} trade{weekStats.trades !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                {weekStats.trades === 0 && (
                  <div className="text-gray-600 text-xs sm:text-sm">
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
      <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-6 text-xs sm:text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#a4fc3c] rounded"></div>
          <span>Profitable Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded"></div>
          <span>Loss Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 ring-2 ring-[#a4fc3c] rounded"></div>
          <span>Today</span>
        </div>
        <div className="text-gray-500 flex items-center gap-2 w-full sm:w-auto">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Click any day with trades to view details</span>
        </div>
      </div>

      {/* Modal for Day Details */}
      {selectedDay && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-[#1a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[80vh] overflow-hidden border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0a0a0a] p-4 sm:p-6 border-b border-gray-800 flex justify-between items-start sm:items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {formatDateLong(selectedDay)}
                </h3>
                <div className={`text-base sm:text-lg font-semibold mt-1 ${
                  selectedDayTotal >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  Day Total: {formatCurrency(selectedDayTotal, true)}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Trade List */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                {selectedDayTrades.map((trade) => (
                  <div 
                    key={trade.id}
                    className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 sm:p-4 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {/* Trade Header */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Ticker</div>
                        <div className="text-lg sm:text-xl font-bold text-white">{trade.ticker}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {trade.sector}
                        </div>
                      </div>

                      {/* Entry/Exit */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Entry → Exit</div>
                        <div className="text-sm sm:text-base text-white">
                          {formatCurrency(trade.entry_price)} → {formatCurrency(trade.exit_price)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {trade.shares} shares
                        </div>
                      </div>

                      {/* P/L */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Profit/Loss</div>
                        <div className={`text-xl sm:text-2xl font-bold ${
                          trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                        }`}>
                          {formatCurrency(trade.profit_loss, true)}
                        </div>
                      </div>

                      {/* Setup Quality */}
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Setup Quality</div>
                        <div className="mb-1">
                          <QualityBadge quality={trade.setup_quality} size="md" showLabel={true} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {trade.setup_type}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500">Strategy:</span>
                        <span className="text-white ml-2">{trade.strategy}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pullback:</span>
                        <span className="text-white ml-2">{trade.pullback_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">News:</span>
                        <span className="text-white ml-2">{trade.news ? 'Yes' : 'No'}</span>
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
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors text-sm sm:text-base"
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