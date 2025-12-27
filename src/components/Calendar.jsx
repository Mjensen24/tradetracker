import { useState, useEffect, useMemo, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, addYears, subYears, parseISO, isSameMonth, isSameDay, startOfWeek, endOfWeek, startOfYear, endOfYear, eachMonthOfInterval, isSameYear } from 'date-fns'
import { formatCurrency, formatDateLong, formatDateShort, formatPercent } from '../utils/formatters'
import QualityBadge from './ui/QualityBadge'
import EditTradeModal from './EditTradeModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { calculateCalendarInsights, compareMonths } from '../utils/tradeCalculations'
import { useDayNotes } from '../hooks/useDayNotes'

function Calendar({ trades, onUpdate, onDelete }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null) // For modal
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'year'
  const [sortBy, setSortBy] = useState('default') // 'default', 'pl', 'ticker', 'time'
  const [groupBy, setGroupBy] = useState('none') // 'none', 'strategy', 'sector'
  const [editTrade, setEditTrade] = useState(null)
  const [tradeToDelete, setTradeToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesText, setNotesText] = useState('')

  // Day notes hook
  const { currentNote, loading: notesLoading, error: notesError, saving: notesSaving, fetchDayNote, saveDayNote } = useDayNotes()
  const prevMonthButtonRef = useRef(null)
  const nextMonthButtonRef = useRef(null)
  const todayButtonRef = useRef(null)

  // Navigate months
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())
  
  // Navigate years
  const goToPreviousYear = () => setCurrentMonth(subYears(currentMonth, 1))
  const goToNextYear = () => setCurrentMonth(addYears(currentMonth, 1))

  // Memoized: Get days for calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Memoized: Process trades by date
  const tradesByDateMap = useMemo(() => {
    const map = {}
    trades.forEach(trade => {
      if (!map[trade.trade_date]) {
        map[trade.trade_date] = []
      }
      map[trade.trade_date].push(trade)
    })
    return map
  }, [trades])

  // Get trades by date
  const getTradesByDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return tradesByDateMap[dateStr] || []
  }

  // Memoized: Day stats for all days in calendar
  const dayStatsMap = useMemo(() => {
    const map = {}
    calendarDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayTrades = tradesByDateMap[dateStr] || []
      const profitLoss = dayTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)
      map[dateStr] = {
        trades: dayTrades.length,
        profitLoss,
        hasData: dayTrades.length > 0
      }
    })
    return map
  }, [calendarDays, tradesByDateMap])

  // Memoized: Get day stats
  const getDayStats = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return dayStatsMap[dateStr] || { trades: 0, profitLoss: 0, hasData: false }
  }

  // Memoized: Split days into weeks
  const weeks = useMemo(() => {
    const result = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  // Memoized: Calculate weekly totals
  const weekStatsMap = useMemo(() => {
    const map = {}
    weeks.forEach((week, weekIdx) => {
      let totalPL = 0
      let totalTrades = 0
      
      week.forEach(day => {
        if (isSameMonth(day, currentMonth)) {
          const stats = getDayStats(day)
          totalPL += stats.profitLoss
          totalTrades += stats.trades
        }
      })
      
      map[weekIdx] = { profitLoss: totalPL, trades: totalTrades }
    })
    return map
  }, [weeks, currentMonth, getDayStats])

  const getWeekStats = (weekIdx) => {
    return weekStatsMap[weekIdx] || { profitLoss: 0, trades: 0 }
  }

  // Memoized: Calculate monthly total
  const monthlyTotal = useMemo(() => {
    const monthTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date)
      return isSameMonth(tradeDate, currentMonth)
    })
    return monthTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)
  }, [trades, currentMonth])

  // Memoized: Calculate yearly total
  const yearlyTotal = useMemo(() => {
    const yearStart = startOfYear(currentMonth)
    const yearEnd = endOfYear(currentMonth)
    const yearTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date)
      return tradeDate >= yearStart && tradeDate <= yearEnd
    })
    return yearTrades.reduce((sum, trade) => sum + trade.profit_loss, 0)
  }, [trades, currentMonth])

  // Memoized: Calendar insights (monthly)
  const insights = useMemo(() => {
    return calculateCalendarInsights(trades, currentMonth)
  }, [trades, currentMonth])

  // Memoized: Yearly insights
  const yearlyInsights = useMemo(() => {
    const yearStart = startOfYear(currentMonth)
    const yearEnd = endOfYear(currentMonth)
    
    // Filter trades for current year
    const yearTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date)
      return tradeDate >= yearStart && tradeDate <= yearEnd
    })

    if (yearTrades.length === 0) {
      return {
        currentStreak: { type: null, days: 0 },
        bestDay: null,
        worstDay: null,
        mostActiveDay: null
      }
    }

    // Group trades by date
    const tradesByDate = {}
    yearTrades.forEach(trade => {
      if (!tradesByDate[trade.trade_date]) {
        tradesByDate[trade.trade_date] = []
      }
      tradesByDate[trade.trade_date].push(trade)
    })

    // Calculate current streak (winning or losing days)
    const sortedDates = Object.keys(tradesByDate).sort((a, b) => new Date(b) - new Date(a))
    let currentStreak = { type: null, days: 0 }
    
    if (sortedDates.length > 0) {
      let streakType = null
      let streakDays = 0
      
      for (const date of sortedDates) {
        const dayPL = tradesByDate[date].reduce((sum, t) => sum + t.profit_loss, 0)
        const dayType = dayPL > 0 ? 'win' : dayPL < 0 ? 'loss' : null
        
        if (dayType && (streakType === null || streakType === dayType)) {
          streakType = dayType
          streakDays++
        } else if (dayType && streakType !== dayType) {
          break
        }
      }
      
      currentStreak = { type: streakType, days: streakDays }
    }

    // Find best and worst days
    let bestDay = null
    let worstDay = null
    let mostActiveDay = null
    let maxPL = -Infinity
    let minPL = Infinity
    let maxTrades = 0

    Object.entries(tradesByDate).forEach(([date, dayTrades]) => {
      const dayPL = dayTrades.reduce((sum, t) => sum + t.profit_loss, 0)
      
      if (dayPL > maxPL) {
        maxPL = dayPL
        bestDay = { date, pl: dayPL, trades: dayTrades.length }
      }
      
      if (dayPL < minPL) {
        minPL = dayPL
        worstDay = { date, pl: dayPL, trades: dayTrades.length }
      }
      
      if (dayTrades.length > maxTrades) {
        maxTrades = dayTrades.length
        mostActiveDay = { date, pl: dayPL, trades: dayTrades.length }
      }
    })

    return {
      currentStreak,
      bestDay,
      worstDay,
      mostActiveDay
    }
  }, [trades, currentMonth])

  // Memoized: Month comparison
  const monthComparison = useMemo(() => {
    const previousMonth = subMonths(currentMonth, 1)
    return compareMonths(trades, currentMonth, previousMonth)
  }, [trades, currentMonth])

  // Handle day click
  const handleDayClick = (day) => {
    const stats = getDayStats(day)
    if (stats.hasData) {
      setSelectedDay(day)
      setEditingNotes(false)
      setNotesText('')
    } else {
      // For days without trades, we'll still open the modal if user wants to add notes
      // But we need to check if there's already a note first
      // We'll open the modal and let the useEffect fetch the note
      setSelectedDay(day)
      setEditingNotes(false)
      setNotesText('')
    }
  }

  // Close modal
  const closeModal = () => {
    setSelectedDay(null)
    setEditingNotes(false)
    setNotesText('')
  }

  // Handle notes editing
  const handleStartEditNotes = () => {
    setEditingNotes(true)
    setNotesText(currentNote?.notes || '')
  }

  const handleCancelEditNotes = () => {
    setEditingNotes(false)
    setNotesText(currentNote?.notes || '')
  }

  const handleSaveNotes = async () => {
    if (!selectedDay) return
    
    const result = await saveDayNote(selectedDay, notesText)
    if (result.success) {
      setEditingNotes(false)
      // Note will be updated via the hook's state
    }
  }

  // Fetch note when selected day changes
  useEffect(() => {
    if (selectedDay) {
      fetchDayNote(selectedDay).then(note => {
        if (note) {
          setNotesText(note.notes || '')
        } else {
          setNotesText('')
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return
      }

      // Arrow keys for month navigation
      if (e.key === 'ArrowLeft' && !selectedDay) {
        e.preventDefault()
        goToPreviousMonth()
        prevMonthButtonRef.current?.focus()
      } else if (e.key === 'ArrowRight' && !selectedDay) {
        e.preventDefault()
        goToNextMonth()
        nextMonthButtonRef.current?.focus()
      }

      // Escape to close modal
      if (e.key === 'Escape' && selectedDay) {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedDay, currentMonth])

  // Handle ESC key to close modal (existing)
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

  // Get trades for selected day
  const selectedDayTrades = useMemo(() => {
    if (!selectedDay) return []
    const dateStr = format(selectedDay, 'yyyy-MM-dd')
    return tradesByDateMap[dateStr] || []
  }, [selectedDay, tradesByDateMap])

  // Memoized: Sorted and grouped trades for modal
  const displayTrades = useMemo(() => {
    let sorted = [...selectedDayTrades]

    // Sort trades
    if (sortBy === 'pl') {
      sorted.sort((a, b) => b.profit_loss - a.profit_loss)
    } else if (sortBy === 'ticker') {
      sorted.sort((a, b) => a.ticker.localeCompare(b.ticker))
    } else if (sortBy === 'time') {
      // Assuming trades might have a time field, otherwise use entry order
      sorted = selectedDayTrades // Keep original order
    }

    // Group trades
    if (groupBy === 'strategy') {
      const grouped = {}
      sorted.forEach(trade => {
        const key = trade.strategy || 'Unknown'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(trade)
      })
      return grouped
    } else if (groupBy === 'sector') {
      const grouped = {}
      sorted.forEach(trade => {
        const key = trade.sector || 'Unknown'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(trade)
      })
      return grouped
    }

    return { 'All Trades': sorted }
  }, [selectedDayTrades, sortBy, groupBy])

  const selectedDayTotal = useMemo(() => {
    return selectedDayTrades.reduce((sum, t) => sum + t.profit_loss, 0)
  }, [selectedDayTrades])

  // Calculate day summary stats
  const daySummaryStats = useMemo(() => {
    if (selectedDayTrades.length === 0) return null
    
    const wins = selectedDayTrades.filter(t => t.profit_loss > 0).length
    const losses = selectedDayTrades.filter(t => t.profit_loss < 0).length
    const winRate = (wins / selectedDayTrades.length) * 100
    const avgPL = selectedDayTotal / selectedDayTrades.length

    return { wins, losses, winRate, avgPL, total: selectedDayTrades.length }
  }, [selectedDayTrades, selectedDayTotal])

  // Handle edit trade
  const handleEditTrade = (trade) => {
    setEditTrade(trade)
  }

  // Handle delete trade
  const handleDeleteTrade = (trade) => {
    setTradeToDelete(trade)
  }

  // Handle update trade
  const handleUpdateTrade = async (tradeId, updatedData) => {
    if (!onUpdate) return
    const result = await onUpdate(tradeId, updatedData)
    if (result.success) {
      setEditTrade(null)
    }
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!onDelete || !tradeToDelete) return
    
    setDeleteLoading(true)
    const result = await onDelete(tradeToDelete.id)
    setDeleteLoading(false)
    
    if (result.success) {
      setTradeToDelete(null)
    }
  }

  // Export day's trades to CSV
  const exportDayTrades = () => {
    if (selectedDayTrades.length === 0) return

    const headers = ['Date', 'Ticker', 'Entry', 'Exit', 'Shares', 'P/L', 'Strategy', 'Sector', 'Setup Quality']
    const rows = selectedDayTrades.map(trade => [
      trade.trade_date,
      trade.ticker,
      trade.entry_price,
      trade.exit_price,
      trade.shares,
      trade.profit_loss,
      trade.strategy || '',
      trade.sector || '',
      trade.setup_quality || ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trades-${format(selectedDay, 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Copy day's trades to clipboard
  const copyDayTrades = () => {
    if (selectedDayTrades.length === 0) return

    const text = selectedDayTrades.map(trade => 
      `${trade.ticker}: ${formatCurrency(trade.profit_loss, true)} (${trade.shares} @ ${formatCurrency(trade.entry_price)} → ${formatCurrency(trade.exit_price)})`
    ).join('\n')

    navigator.clipboard.writeText(text)
  }

  // Render month view
  const renderMonthView = () => (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800 overflow-x-auto">
      {/* Day Headers */}
      <div className="grid grid-cols-7 lg:grid-cols-8 bg-[#0a0a0a] border-b border-gray-800 min-w-[700px]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 md:p-4 text-center font-semibold text-gray-400 text-xs sm:text-sm" role="columnheader">
            {day}
          </div>
        ))}
        <div className="hidden lg:block p-2 md:p-4 text-center font-semibold text-gray-400 text-xs sm:text-sm" role="columnheader">
          Total
        </div>
      </div>

      {/* Calendar Weeks */}
      {weeks.map((week, weekIdx) => {
        const weekStats = getWeekStats(weekIdx)
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleDayClick(day)
                    }
                  }}
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`${format(day, 'MMMM d, yyyy')}${stats.hasData ? `, ${stats.trades} trades, ${formatCurrency(stats.profitLoss, true)}` : ', click to view or add notes'}`}
                  className={`min-h-[100px] sm:min-h-[120px] p-2 md:p-4 border-r border-gray-800 ${
                    !isCurrentMonth ? 'bg-[#0a0a0a] opacity-50' : ''
                  } ${isToday ? 'ring-2 ring-[#a4fc3c] ring-inset' : ''} ${
                    'cursor-pointer hover:bg-[#2a2a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]'
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
  )

  // Render mini calendar for a month (used in year view)
  const renderMiniMonth = (month) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    
    // Get trades for this month
    const monthTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date)
      return isSameMonth(tradeDate, month)
    })
    
    // Create trades by date map for this month
    const monthTradesByDate = {}
    monthTrades.forEach(trade => {
      if (!monthTradesByDate[trade.trade_date]) {
        monthTradesByDate[trade.trade_date] = []
      }
      monthTradesByDate[trade.trade_date].push(trade)
    })
    
    const monthPL = monthTrades.reduce((sum, t) => sum + t.profit_loss, 0)
    const isCurrentMonth = isSameMonth(month, currentMonth)
    
    // Split days into weeks
    const weeks = []
    for (let i = 0; i < daysInMonth.length; i += 7) {
      weeks.push(daysInMonth.slice(i, i + 7))
    }

    return (
      <div
        key={format(month, 'yyyy-MM')}
        className={`bg-[#1a1a1a] rounded-xl border overflow-hidden transition-all ${
          isCurrentMonth ? 'border-[#a4fc3c] ring-2 ring-[#a4fc3c]' : 'border-gray-800 hover:border-gray-700'
        }`}
      >
        {/* Month Header */}
        <button
          onClick={() => {
            setCurrentMonth(month)
            setViewMode('month')
          }}
          className={`w-full p-3 text-left transition-colors ${
            isCurrentMonth 
              ? 'bg-[#a4fc3c] text-black' 
              : 'bg-[#0a0a0a] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{format(month, 'MMMM yyyy')}</div>
            <div className={`text-sm font-bold ${isCurrentMonth ? 'text-black' : monthPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
              {formatCurrency(monthPL, true)}
            </div>
          </div>
        </button>

        {/* Mini Calendar Grid */}
        <div className="p-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <div key={idx} className="text-center text-[10px] text-gray-500 font-semibold py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, dayIdx) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayTrades = monthTradesByDate[dateStr] || []
              const dayPL = dayTrades.reduce((sum, t) => sum + t.profit_loss, 0)
              const isCurrentMonthDay = isSameMonth(day, month)
              const isToday = isSameDay(day, new Date())
              
              return (
                <button
                  key={dayIdx}
                  onClick={() => {
                    setSelectedDay(day)
                  }}
                  className={`aspect-square text-[10px] p-1 rounded transition-colors ${
                    !isCurrentMonthDay 
                      ? 'text-gray-700 opacity-30' 
                      : isToday
                      ? 'ring-1 ring-[#a4fc3c] bg-[#a4fc3c]/10'
                      : dayTrades.length > 0
                      ? 'hover:bg-[#2a2a2a] cursor-pointer'
                      : 'text-gray-600'
                  } ${dayPL > 0 ? 'bg-[#a4fc3c]/20 text-[#a4fc3c] font-semibold' : dayPL < 0 ? 'bg-red-400/20 text-red-400 font-semibold' : ''}`}
                  title={dayTrades.length > 0 ? `${format(day, 'MMM d')}: ${formatCurrency(dayPL, true)}` : format(day, 'MMM d')}
                >
                  <div className="flex items-center justify-center h-full">
                    <span className={isToday ? 'font-bold' : ''}>{format(day, 'd')}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Render year view
  const renderYearView = () => {
    const yearStart = startOfYear(currentMonth)
    const yearEnd = endOfYear(currentMonth)
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => renderMiniMonth(month))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Trading Calendar</h2>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-400">
            {viewMode === 'year' ? 'Yearly' : 'Monthly'} P/L: 
            <span className={`ml-2 text-xl sm:text-2xl font-bold ${(viewMode === 'year' ? yearlyTotal : monthlyTotal) >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
              {formatCurrency(viewMode === 'year' ? yearlyTotal : monthlyTotal, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      {viewMode === 'month' && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              ref={prevMonthButtonRef}
              onClick={goToPreviousMonth}
              className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              aria-label="Previous month"
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <h3 className="text-lg md:text-xl font-semibold text-white">
                {format(currentMonth, 'MMMM, yyyy')}
              </h3>
              <button
                ref={todayButtonRef}
                onClick={goToToday}
                className="px-3 py-1 text-xs sm:text-sm bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
                aria-label="Go to today"
              >
                Today
              </button>
            </div>
            
            <button
              ref={nextMonthButtonRef}
              onClick={goToNextMonth}
              className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              aria-label="Next month"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Year Navigation */}
      {viewMode === 'year' && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              onClick={goToPreviousYear}
              className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              aria-label="Previous year"
            >
              ← Previous Year
            </button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <h3 className="text-lg md:text-xl font-semibold text-white">
                {format(currentMonth, 'yyyy')}
              </h3>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs sm:text-sm bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
                aria-label="Go to today"
              >
                Today
              </button>
            </div>
            
            <button
              onClick={goToNextYear}
              className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              aria-label="Next year"
            >
              Next Year →
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'year' && renderYearView()}

      {/* Stats/View Toggle Section - Sub-headers below calendar */}
      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Stats on the left */}
        <div className="space-y-3 flex-1">
          {/* Legend at the top */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs sm:text-sm text-gray-400 pb-3 mb-3 border-b border-gray-800">
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
              <span>Click any day with trades to view details. Use arrow keys to navigate {viewMode === 'year' ? 'years' : 'months'}.</span>
            </div>
          </div>

          {/* Month View Stats */}
          {viewMode === 'month' && (
            <>
              {/* Current Streak */}
            {insights.currentStreak.days > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">Current Streak:</span>
                <span className={`font-semibold ${insights.currentStreak.type === 'win' ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {insights.currentStreak.days} day {insights.currentStreak.type === 'win' ? 'winning' : 'losing'} streak
                </span>
              </div>
            )}

            {/* Best Day */}
            {insights.bestDay && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">Best Day:</span>
                <span className="font-semibold text-[#a4fc3c]">
                  {formatCurrency(insights.bestDay.pl, true)}
                </span>
                <span className="text-gray-500">
                  ({formatDateShort(insights.bestDay.date)})
                </span>
              </div>
            )}

            {/* Worst Day */}
            {insights.worstDay && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">Worst Day:</span>
                <span className="font-semibold text-red-400">
                  {formatCurrency(insights.worstDay.pl, true)}
                </span>
                <span className="text-gray-500">
                  ({formatDateShort(insights.worstDay.date)})
                </span>
              </div>
            )}

            {/* Most Active Day */}
            {insights.mostActiveDay && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">Most Active:</span>
                <span className="font-semibold text-white">
                  {insights.mostActiveDay.trades} trades
                </span>
                <span className="text-gray-500">
                  ({formatDateShort(insights.mostActiveDay.date)})
                </span>
              </div>
            )}

            {/* Month Comparison */}
            {monthComparison.previous.trades > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium">vs Previous Month:</span>
                <span className={`font-semibold ${monthComparison.current.pl >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {formatCurrency(monthComparison.current.pl, true)}
                </span>
                <span className="text-gray-500">→</span>
                <span className={`font-semibold ${monthComparison.previous.pl >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  {formatCurrency(monthComparison.previous.pl, true)}
                </span>
                <span className={`font-semibold ${monthComparison.difference >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                  ({formatCurrency(monthComparison.difference, true)}, {formatPercent(monthComparison.percentChange, 1)})
                </span>
              </div>
            )}
            </>
          )}

          {/* Year View Stats */}
          {viewMode === 'year' && (
            <>
              {/* Current Streak */}
              {yearlyInsights.currentStreak.days > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 font-medium">Current Streak:</span>
                  <span className={`font-semibold ${yearlyInsights.currentStreak.type === 'win' ? 'text-[#a4fc3c]' : 'text-red-400'}`}>
                    {yearlyInsights.currentStreak.days} day {yearlyInsights.currentStreak.type === 'win' ? 'winning' : 'losing'} streak
                  </span>
                </div>
              )}

              {/* Best Day */}
              {yearlyInsights.bestDay && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 font-medium">Best Day:</span>
                  <span className="font-semibold text-[#a4fc3c]">
                    {formatCurrency(yearlyInsights.bestDay.pl, true)}
                  </span>
                  <span className="text-gray-500">
                    ({formatDateShort(yearlyInsights.bestDay.date)})
                  </span>
                </div>
              )}

              {/* Worst Day */}
              {yearlyInsights.worstDay && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 font-medium">Worst Day:</span>
                  <span className="font-semibold text-red-400">
                    {formatCurrency(yearlyInsights.worstDay.pl, true)}
                  </span>
                  <span className="text-gray-500">
                    ({formatDateShort(yearlyInsights.worstDay.date)})
                  </span>
                </div>
              )}

              {/* Most Active Day */}
              {yearlyInsights.mostActiveDay && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 font-medium">Most Active:</span>
                  <span className="font-semibold text-white">
                    {yearlyInsights.mostActiveDay.trades} trades
                  </span>
                  <span className="text-gray-500">
                    ({formatDateShort(yearlyInsights.mostActiveDay.date)})
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Mode Toggle on the right */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400">View:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                viewMode === 'month'
                  ? 'bg-[#a4fc3c] text-black'
                  : 'bg-[#0a0a0a] text-white hover:bg-[#2a2a2a] border border-gray-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                viewMode === 'year'
                  ? 'bg-[#a4fc3c] text-black'
                  : 'bg-[#0a0a0a] text-white hover:bg-[#2a2a2a] border border-gray-800'
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Day Details */}
      {selectedDay && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-[#1a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[80vh] overflow-hidden border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0a0a0a] p-4 sm:p-6 border-b border-gray-800 flex justify-between items-start sm:items-center">
              <div>
                <h3 id="modal-title" className="text-lg sm:text-xl font-semibold text-white">
                  {formatDateLong(selectedDay)}
                </h3>
                {selectedDayTrades.length > 0 && (
                  <>
                    <div className={`text-base sm:text-lg font-semibold mt-1 ${
                      selectedDayTotal >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                    }`}>
                      Day Total: {formatCurrency(selectedDayTotal, true)}
                    </div>
                    {daySummaryStats && (
                      <div className="text-xs text-gray-400 mt-2">
                        {daySummaryStats.wins}W / {daySummaryStats.losses}L · {formatPercent(daySummaryStats.winRate, 1)} Win Rate · Avg: {formatCurrency(daySummaryStats.avgPL, true)}
                      </div>
                    )}
                  </>
                )}
                {selectedDayTrades.length === 0 && (
                  <div className="text-sm text-gray-400 mt-1">
                    No trades for this day
                  </div>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] rounded"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Controls */}
            <div className="bg-[#0a0a0a] p-3 border-b border-gray-800 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c]"
                >
                  <option value="default">Default</option>
                  <option value="pl">P/L</option>
                  <option value="ticker">Ticker</option>
                  <option value="time">Time</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Group:</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c]"
                >
                  <option value="none">None</option>
                  <option value="strategy">Strategy</option>
                  <option value="sector">Sector</option>
                </select>
              </div>
              {selectedDayTrades.length > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={copyDayTrades}
                    className="px-3 py-1 text-xs bg-[#0a0a0a] border border-gray-700 rounded text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c]"
                  >
                    Copy
                  </button>
                  <button
                    onClick={exportDayTrades}
                    className="px-3 py-1 text-xs bg-[#0a0a0a] border border-gray-700 rounded text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c]"
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>

            {/* Modal Content - Trade List */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(80vh-200px)]">
              {/* Day Notes Section */}
              <div className="mb-6 pb-6 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-400">Trading Session Notes</h4>
                  {!editingNotes && (
                    <button
                      onClick={handleStartEditNotes}
                      className="px-3 py-1 text-xs bg-[#0a0a0a] border border-gray-700 rounded text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c]"
                    >
                      {currentNote ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  )}
                </div>
                
                {notesLoading && !currentNote && (
                  <div className="text-sm text-gray-500">Loading notes...</div>
                )}
                
                {notesError && (
                  <div className="text-sm text-red-400 mb-2">Error: {notesError}</div>
                )}

                {editingNotes ? (
                  <div className="space-y-3">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add your notes about this trading session..."
                      className="w-full min-h-[120px] p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-transparent resize-y"
                      disabled={notesSaving}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={notesSaving}
                        className="px-4 py-2 text-sm bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {notesSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEditNotes}
                        disabled={notesSaving}
                        className="px-4 py-2 text-sm bg-[#0a0a0a] border border-gray-700 rounded-lg text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">
                    {currentNote?.notes ? (
                      currentNote.notes
                    ) : (
                      <span className="text-gray-500 italic">No notes for this day. Click "Add Notes" to add some.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Trades Section - Only show if there are trades */}
              {selectedDayTrades.length > 0 && (
                <div className="space-y-4">
                  {Object.entries(displayTrades).map(([groupName, groupTrades]) => (
                  <div key={groupName}>
                    {groupBy !== 'none' && (
                      <div className="text-sm font-semibold text-gray-400 mb-2">{groupName}</div>
                    )}
                    {groupTrades.map((trade) => (
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

                        {/* Quick Actions */}
                        {(onUpdate || onDelete) && (
                          <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
                            {onUpdate && (
                              <button
                                onClick={() => handleEditTrade(trade)}
                                className="px-3 py-1 text-xs bg-[#0a0a0a] border border-gray-700 rounded text-white hover:bg-[#2a2a2a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c]"
                              >
                                Edit
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => handleDeleteTrade(trade)}
                                className="px-3 py-1 text-xs bg-red-600/20 border border-red-600 rounded text-red-400 hover:bg-red-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                </div>
              )}

              {/* Show message if no trades */}
              {selectedDayTrades.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No trades for this day.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0a0a0a] p-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={closeModal}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      {editTrade && (
        <EditTradeModal
          isOpen={!!editTrade}
          onClose={() => setEditTrade(null)}
          trade={editTrade}
          onUpdate={handleUpdateTrade}
        />
      )}

      {/* Delete Confirm Modal */}
      {tradeToDelete && (
        <DeleteConfirmModal
          isOpen={!!tradeToDelete}
          onClose={() => setTradeToDelete(null)}
          onConfirm={handleConfirmDelete}
          trade={tradeToDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

export default Calendar
