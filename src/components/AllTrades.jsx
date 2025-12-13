import { useState, useMemo } from 'react'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

function AllTrades({ trades }) {
  // Filter states
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [tickerSearch, setTickerSearch] = useState('')
  const [longShortFilter, setLongShortFilter] = useState('all')
  const [qualityFilter, setQualityFilter] = useState('all')
  const [setupTypeFilter, setSetupTypeFilter] = useState('all')
  const [fiberFilter, setFiberFilter] = useState('all')
  
  // Modal state
  const [selectedTrade, setSelectedTrade] = useState(null)

  // Get unique values for dropdown options
  const uniqueSetupTypes = useMemo(() => {
    return ['all', ...new Set(trades.map(t => t.setup_type))].sort()
  }, [trades])

  // Filter trades based on all selected filters
  const filteredTrades = useMemo(() => {
    let filtered = trades

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate, endDate

      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now)
          endDate = endOfDay(now)
          break
        
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 })
          endDate = endOfWeek(now, { weekStartsOn: 1 })
          break
        
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = startOfDay(parseISO(customStartDate))
            endDate = endOfDay(parseISO(customEndDate))
          }
          break
      }

      if (startDate && endDate) {
        filtered = filtered.filter(trade => {
          const tradeDate = parseISO(trade.date)
          return isWithinInterval(tradeDate, { start: startDate, end: endDate })
        })
      }
    }

    // Ticker search filter
    if (tickerSearch.trim() !== '') {
      filtered = filtered.filter(t => 
        t.ticker.toLowerCase().includes(tickerSearch.toLowerCase())
      )
    }

    // Long/Short filter
    if (longShortFilter !== 'all') {
      filtered = filtered.filter(t => t.long_short === longShortFilter)
    }

    // Quality filter
    if (qualityFilter !== 'all') {
      filtered = filtered.filter(t => t.setup_quality === qualityFilter)
    }

    // Setup Type filter
    if (setupTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.setup_type === setupTypeFilter)
    }

    // Fiber filter
    if (fiberFilter !== 'all') {
      filtered = filtered.filter(t => t.fiber === fiberFilter)
    }

    return filtered
  }, [trades, dateFilter, customStartDate, customEndDate, tickerSearch, longShortFilter, qualityFilter, setupTypeFilter, fiberFilter])

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const totalPL = filteredTrades.reduce((sum, t) => sum + t.profit_loss, 0)
    const wins = filteredTrades.filter(t => t.profit_loss > 0).length
    const losses = filteredTrades.filter(t => t.profit_loss < 0).length
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0

    return { totalPL, wins, losses, winRate, count: filteredTrades.length }
  }, [filteredTrades])

  // Reset all filters
  const resetFilters = () => {
    setDateFilter('all')
    setCustomStartDate('')
    setCustomEndDate('')
    setTickerSearch('')
    setLongShortFilter('all')
    setQualityFilter('all')
    setSetupTypeFilter('all')
    setFiberFilter('all')
  }

  // Check if any filters are active
  const hasActiveFilters = dateFilter !== 'all' || tickerSearch !== '' || 
    longShortFilter !== 'all' || qualityFilter !== 'all' || 
    setupTypeFilter !== 'all' || fiberFilter !== 'all'

  // Open trade modal
  const openTradeModal = (trade) => {
    setSelectedTrade(trade)
  }

  // Close trade modal
  const closeTradeModal = () => {
    setSelectedTrade(null)
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Complete Trade Log</h2>

      {/* Filters Section */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 mb-6 border border-gray-800">
        <div className="flex flex-col gap-4">
          {/* Filter Header */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-400">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-[#a4fc3c] text-sm hover:text-white transition-colors"
              >
                ✕ Clear All Filters
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Date Range */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a4fc3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Ticker Search */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Search Ticker</label>
              <input
                type="text"
                placeholder="Enter ticker..."
                value={tickerSearch}
                onChange={(e) => setTickerSearch(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors placeholder-gray-600"
              />
            </div>

            {/* Long/Short */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Position</label>
              <select
                value={longShortFilter}
                onChange={(e) => setLongShortFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a4fc3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Positions</option>
                <option value="L">Long Only</option>
                <option value="S">Short Only</option>
              </select>
            </div>

            {/* Setup Quality */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quality</label>
              <select
                value={qualityFilter}
                onChange={(e) => setQualityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a4fc3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Grades</option>
                <option value="A">A Grade</option>
                <option value="B">B Grade</option>
                <option value="C">C Grade</option>
              </select>
            </div>

            {/* Setup Type */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Setup Type</label>
              <select
                value={setupTypeFilter}
                onChange={(e) => setSetupTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a4fc3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {uniqueSetupTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Setups' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Fiber */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fiber</label>
              <select
                value={fiberFilter}
                onChange={(e) => setFiberFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a4fc3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Fiber</option>
                <option value="Yes">Yes</option>
                <option value="Weak">Weak</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilter === 'custom' && (
            <div className="flex gap-4 items-center pt-2 border-t border-gray-800">
              <span className="text-sm text-gray-400">Custom Range:</span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#a4fc3c] hover:border-gray-600 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Filter Stats Summary */}
          <div className="flex gap-6 items-center pt-4 border-t border-gray-800 flex-wrap">
            <div className="text-sm">
              <span className="text-gray-400">Showing:</span>
              <span className="text-white font-semibold ml-2">{filteredStats.count} trades</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Total P/L:</span>
              <span className={`font-semibold ml-2 ${
                filteredStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
              }`}>
                {filteredStats.totalPL >= 0 ? '+' : ''}${filteredStats.totalPL.toFixed(2)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-white font-semibold ml-2">
                {filteredStats.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">W/L:</span>
              <span className="text-white font-semibold ml-2">
                {filteredStats.wins}W / {filteredStats.losses}L
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* No Results Message */}
      {filteredTrades.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-12 text-center border border-gray-800">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-white mb-2">No Trades Found</h3>
          <p className="text-gray-400">
            No trades match the selected filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Trade Table */}
      {filteredTrades.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Ticker</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">L/S</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Entry</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Exit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Shares</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">P/L</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Quality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Setup</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTrades.map((trade, idx) => (
                  <tr 
                    key={trade.id} 
                    onClick={() => openTradeModal(trade)}
                    className={`${idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'} hover:bg-[#2a2a2a] cursor-pointer transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {format(parseISO(trade.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{trade.ticker}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.long_short === 'L' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.long_short}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">${trade.entry_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">${trade.exit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{trade.shares}</td>
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
                    <td className="px-4 py-3 text-sm text-gray-300">{trade.setup_type}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate text-gray-400">{trade.notes}</td>
                    <td className="px-4 py-3 text-sm">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          // Edit functionality will go here
                        }}
                        className="text-[#a4fc3c] hover:text-white mr-2 transition-colors" 
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          // Delete functionality will go here
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors" 
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeTradeModal}
        >
          <div 
            className="bg-[#1a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0a0a0a] p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-3xl font-bold text-white">{selectedTrade.ticker}</h3>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    selectedTrade.long_short === 'L' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedTrade.long_short === 'L' ? 'LONG' : 'SHORT'}
                  </span>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    selectedTrade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                    selectedTrade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Grade {selectedTrade.setup_quality}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {format(parseISO(selectedTrade.date), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
              <button
                onClick={closeTradeModal}
                className="text-gray-400 hover:text-white text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* P/L Section */}
              <div className="mb-6 p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Profit/Loss</div>
                <div className={`text-5xl font-bold ${
                  selectedTrade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {selectedTrade.profit_loss >= 0 ? '+' : ''}${selectedTrade.profit_loss.toFixed(2)}
                </div>
              </div>

              {/* Trade Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Entry Price</div>
                  <div className="text-2xl font-bold text-white">${selectedTrade.entry_price.toFixed(2)}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Exit Price</div>
                  <div className="text-2xl font-bold text-white">${selectedTrade.exit_price.toFixed(2)}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Shares</div>
                  <div className="text-2xl font-bold text-white">{selectedTrade.shares}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Stop Loss</div>
                  <div className="text-2xl font-bold text-white">${selectedTrade.stop_loss.toFixed(2)}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Setup Type</div>
                  <div className="text-2xl font-bold text-white">{selectedTrade.setup_type}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Pullback Type</div>
                  <div className="text-2xl font-bold text-white">{selectedTrade.pullback_type}</div>
                </div>
              </div>

              {/* Setup Quality Indicators */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 text-center">
                  <div className="text-xs text-gray-500 mb-2">Fiber</div>
                  <div className={`text-lg font-semibold ${
                    selectedTrade.fiber === 'Yes' ? 'text-[#a4fc3c]' : 
                    selectedTrade.fiber === 'Weak' ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {selectedTrade.fiber}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 text-center">
                  <div className="text-xs text-gray-500 mb-2">Ranges</div>
                  <div className={`text-lg font-semibold ${
                    selectedTrade.ranges === 'Clean' ? 'text-[#a4fc3c]' : 
                    selectedTrade.ranges === 'Choppy' ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {selectedTrade.ranges}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800 text-center">
                  <div className="text-xs text-gray-500 mb-2">Setup Quality</div>
                  <div className={`text-lg font-semibold ${
                    selectedTrade.setup_quality === 'A' ? 'text-[#a4fc3c]' :
                    selectedTrade.setup_quality === 'B' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    Grade {selectedTrade.setup_quality}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedTrade.notes && (
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Trade Notes</div>
                  <div className="text-gray-300 leading-relaxed">{selectedTrade.notes}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0a0a0a] p-4 border-t border-gray-800 flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Edit functionality will go here
                  }}
                  className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-[#a4fc3c] rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                >
                  ✏️ Edit Trade
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Delete functionality will go here
                  }}
                  className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-red-400 rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                >
                  🗑️ Delete Trade
                </button>
              </div>
              <button
                onClick={closeTradeModal}
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

export default AllTrades