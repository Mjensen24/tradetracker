import { useState, useMemo, useEffect } from 'react'
import { formatDateShort, formatDateLong, formatCurrency, formatCents, formatPercent, formatNumber } from '../utils/formatters'
import EditTradeModal from './EditTradeModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import ErrorMessage from './ui/ErrorMessage'
import EmptyState from './ui/EmptyState'
import QualityBadge from './ui/QualityBadge'

function AllTrades({ trades, onUpdate, onDelete }) {
  // Filter states
  const [filters, setFilters] = useState({
    ticker: '',
    startDate: '',
    endDate: '',
    setupQuality: '',
    setupType: '',
    winLoss: '',
    pageSize: 20
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [editTrade, setEditTrade] = useState(null)
  const [tradeToDelete, setTradeToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter trades based on all selected filters
  const filteredTrades = useMemo(() => {
    const filtered = trades.filter(trade => {
      if (filters.ticker && !trade.ticker.toLowerCase().includes(filters.ticker.toLowerCase())) {
        return false
      }
      if (filters.startDate && trade.trade_date < filters.startDate) {
        return false
      }
      if (filters.endDate && trade.trade_date > filters.endDate) {
        return false
      }
      if (filters.setupQuality && trade.setup_quality !== filters.setupQuality) {
        return false
      }
      if (filters.setupType && trade.setup_type !== filters.setupType) {
        return false
      }
      if (filters.winLoss && trade.win_loss !== filters.winLoss) {
        return false
      }
      return true
    })
    
    // Sort by trade_date (most recent first), then by id (newer trades first) for same-day trades
    return filtered.sort((a, b) => {
      const dateCompare = new Date(b.trade_date) - new Date(a.trade_date)
      if (dateCompare !== 0) return dateCompare
      // If dates are equal, sort by id (descending - newer trades first)
      return b.id.localeCompare(a.id)
    })
  }, [trades, filters])

  // Reset to page 1 when filters change (except pageSize)
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.ticker, filters.startDate, filters.endDate, filters.setupQuality, filters.setupType, filters.winLoss])

  // Calculate pagination
  const pageSize = Number(filters.pageSize) || 20
  const totalPages = Math.ceil(filteredTrades.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex)

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const totalPL = filteredTrades.reduce((sum, t) => sum + t.profit_loss, 0)
    const wins = filteredTrades.filter(t => t.profit_loss > 0).length
    const losses = filteredTrades.filter(t => t.profit_loss < 0).length
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0

    return { totalPL, wins, losses, winRate, count: filteredTrades.length }
  }, [filteredTrades])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const resetFilters = () => {
    setFilters({
      ticker: '',
      startDate: '',
      endDate: '',
      setupQuality: '',
      setupType: '',
      winLoss: '',
      pageSize: 20
    })
    setCurrentPage(1)
  }

  const handlePageSizeChange = (e) => {
    const newPageSize = Number(e.target.value) || 20
    setFilters(prev => ({ ...prev, pageSize: newPageSize }))
    setCurrentPage(1)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Check if any filters are active
  const hasActiveFilters = filters.ticker !== '' || filters.startDate !== '' ||
    filters.endDate !== '' || filters.setupQuality !== '' || 
    filters.setupType !== '' || filters.winLoss !== ''

  // Open trade modal
  const openTradeModal = (trade) => {
    setSelectedTrade(trade)
  }

  // Close trade modal
  const closeTradeModal = () => {
    setSelectedTrade(null)
  }

  // Handle ESC key to close detail modal
  useEffect(() => {
    if (!selectedTrade) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeTradeModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedTrade])

  // Handle edit trade
  const handleEditTrade = (trade) => {
    setEditTrade(trade)
    setSelectedTrade(null) // Close detail modal if open
  }

  // Handle delete trade
  const handleDeleteTrade = (trade) => {
    setTradeToDelete(trade)
    setSelectedTrade(null) // Close detail modal if open
  }

  // Handle update trade
  const handleUpdateTrade = async (tradeId, updatedData) => {
    const result = await onUpdate(tradeId, updatedData)
    if (result.success) {
      setEditTrade(null)
    }
    return result
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!tradeToDelete) return
    
    setDeleteLoading(true)
    setError(null)
    try {
      const result = await onDelete(tradeToDelete.id)
      if (result.success) {
        setTradeToDelete(null)
      } else {
        setError(`Error deleting trade: ${result.error}`)
      }
    } catch (err) {
      setError(`Error deleting trade: ${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Complete Trade Log</h2>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Filters Section - Always Visible */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-800">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ticker Search */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Ticker</label>
            <input
              type="text"
              name="ticker"
              value={filters.ticker}
              onChange={handleFilterChange}
              placeholder="AAPL"
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
            />
          </div>

          {/* Setup Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Setup Quality</label>
            <select
              name="setupQuality"
              value={filters.setupQuality}
              onChange={handleFilterChange}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
            >
              <option value="">All Grades</option>
              <option value="A">A - Excellent</option>
              <option value="B">B - Good</option>
              <option value="C">C - Poor</option>
            </select>
          </div>

          {/* Setup Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Setup Type</label>
            <select
              name="setupType"
              value={filters.setupType}
              onChange={handleFilterChange}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
            >
              <option value="">All Setups</option>
              <option value="1 Minute Setup">1 Minute Setup</option>
              <option value="5 Minute Setup">5 Minute Setup</option>
              <option value="10 Second Setup">10 Second Setup</option>
              <option value="Halt">Halt</option>
            </select>
          </div>

          {/* Win/Loss Result */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Result</label>
            <select
              name="winLoss"
              value={filters.winLoss}
              onChange={handleFilterChange}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
            >
              <option value="">All Results</option>
              <option value="W">Winners</option>
              <option value="L">Losers</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="mt-4 md:mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row flex-wrap gap-3 md:gap-6 items-start sm:items-center">
          <div className="text-xs md:text-sm">
            <span className="text-gray-400">Total P/L:</span>
            <span className={`font-semibold ml-2 ${
              filteredStats.totalPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
            }`}>
              {formatCurrency(filteredStats.totalPL, true)}
            </span>
          </div>
          <div className="text-xs md:text-sm">
            <span className="text-gray-400">Win Rate:</span>
            <span className="text-white font-semibold ml-2">
              {formatPercent(filteredStats.winRate, 1)}
            </span>
          </div>
          <div className="text-xs md:text-sm">
            <span className="text-gray-400">W/L:</span>
            <span className="text-white font-semibold ml-2">
              {filteredStats.wins}W / {filteredStats.losses}L
            </span>
          </div>
          <div className="text-xs md:text-sm sm:ml-auto">
            <span className="text-gray-400">Showing:</span>
            <span className="text-white font-semibold ml-2">
              {filteredStats.count > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredStats.count)} of ${filteredStats.count}` : '0'} trades
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full sm:w-auto sm:ml-auto px-4 md:px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors text-sm md:text-base"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* No Results Message */}
      {filteredTrades.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="No Trades Found"
          message="No trades match the selected filters."
          action={
            hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
              >
                Clear Filters
              </button>
            ) : null
          }
        />
      )}

      {/* Trade Table/Cards */}
      {filteredTrades.length > 0 && (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedTrades.map((trade) => {
              const centsPL = trade.exit_price - trade.entry_price
              return (
                <div
                  key={trade.id}
                  onClick={() => openTradeModal(trade)}
                  className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{trade.ticker}</h3>
                        <QualityBadge quality={trade.setup_quality} size="sm" />
                      </div>
                      <div className="text-xs text-gray-400">{formatDateShort(trade.trade_date)}</div>
                    </div>
                    <div className={`text-lg font-bold ${
                      trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                    }`}>
                      {formatCurrency(trade.profit_loss, true)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Entry</div>
                      <div className="text-white">{formatCurrency(trade.entry_price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Exit</div>
                      <div className="text-white">{formatCurrency(trade.exit_price)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Shares</div>
                      <div className="text-white">{formatNumber(trade.shares)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Cents P/L</div>
                      <div className={`font-semibold ${
                        centsPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                      }`}>
                        {formatCents(centsPL, true)}
                      </div>
                    </div>
                  </div>

                  {trade.setup_type && (
                    <div className="text-xs text-gray-400 mb-2">Setup: {trade.setup_type}</div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditTrade(trade)
                      }}
                      className="text-[#a4fc3c] hover:text-white transition-colors p-2"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrade(trade)
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors p-2"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0a] border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Ticker</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Entry</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Exit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Shares</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Cents P/L</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">$ P/L</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Quality</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Setup</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Notes</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedTrades.map((trade, idx) => {
                    const centsPL = trade.exit_price - trade.entry_price
                    return (
                      <tr
                        key={trade.id}
                        onClick={() => openTradeModal(trade)}
                        className={`${idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'} hover:bg-[#2a2a2a] cursor-pointer transition-colors`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDateShort(trade.trade_date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{trade.ticker}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatCurrency(trade.entry_price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatCurrency(trade.exit_price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatNumber(trade.shares)}</td>
                        <td className={`px-4 py-3 text-sm font-semibold ${
                          centsPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                        }`}>
                          {formatCents(centsPL, true)}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold ${
                          trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                        }`}>
                          {formatCurrency(trade.profit_loss, true)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <QualityBadge quality={trade.setup_quality} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{trade.setup_type}</td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate text-gray-300">{trade.notes}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTrade(trade)
                              }}
                              className="text-[#a4fc3c] hover:text-white transition-colors flex items-center justify-center"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTrade(trade)
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredTrades.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Items per page:</label>
                <select
                  name="pageSize"
                  value={filters.pageSize}
                  onChange={handlePageSizeChange}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Page <span className="text-white font-semibold">{currentPage}</span> of <span className="text-white font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        currentPage === 1
                          ? 'bg-[#0a0a0a] text-gray-600 cursor-not-allowed border border-gray-800'
                          : 'bg-[#0a0a0a] text-white hover:bg-[#2a2a2a] border border-gray-700'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                        currentPage === totalPages
                          ? 'bg-[#0a0a0a] text-gray-600 cursor-not-allowed border border-gray-800'
                          : 'bg-[#a4fc3c] text-black hover:bg-[#8fdd2f] border border-[#a4fc3c]'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={closeTradeModal}
        >
          <div 
            className="bg-[#1a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0a0a0a] p-4 md:p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2">
                  <h3 className="text-2xl md:text-3xl font-bold text-white">{selectedTrade.ticker}</h3>
                  <QualityBadge quality={selectedTrade.setup_quality} size="md" showLabel={true} />
                </div>
                <div className="text-xs md:text-sm text-gray-400">
                  {formatDateLong(selectedTrade.trade_date)}
                </div>
              </div>
              <button
                onClick={closeTradeModal}
                className="text-gray-400 hover:text-white text-2xl md:text-3xl leading-none transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
              {/* Key Metrics - Prominent Display */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                {/* Entry Price - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-3 md:p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Entry Price</div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{formatCurrency(selectedTrade.entry_price)}</div>
                </div>

                {/* Exit Price - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-3 md:p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Exit Price</div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{formatCurrency(selectedTrade.exit_price)}</div>
                </div>

                {/* Shares - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-3 md:p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Shares</div>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{formatNumber(selectedTrade.shares)}</div>
                </div>

                {/* Cents P/L - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-3 md:p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Cents P/L</div>
                  <div className={`text-2xl md:text-3xl lg:text-4xl font-bold ${
                    (selectedTrade.exit_price - selectedTrade.entry_price) >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                  }`}>
                    {formatCents(selectedTrade.exit_price - selectedTrade.entry_price, true)}
                  </div>
                </div>
              </div>

              {/* Profit/Loss Section */}
              <div className="mb-4 md:mb-6 p-4 md:p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
                <div className="text-xs md:text-sm text-gray-400 mb-2">Total Profit/Loss</div>
                <div className={`text-3xl md:text-4xl lg:text-5xl font-bold ${
                  selectedTrade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {formatCurrency(selectedTrade.profit_loss, true)}
                </div>
              </div>

              {/* Additional Trade Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Strategy</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.strategy || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Setup Type</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.setup_type || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Pullback Type</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.pullback_type || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Sector</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.sector || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Float</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.float || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">News</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.news ? 'Yes' : 'No'}</div>
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
            <div className="bg-[#0a0a0a] p-4 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditTrade(selectedTrade)
                  }}
                  className="px-4 py-2 bg-[#0a0a0a] border border-gray-800 text-[#a4fc3c] rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors text-sm md:text-base"
                >
                  Edit Trade
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTrade(selectedTrade)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm md:text-base"
                >
                  Delete Trade
                </button>
              </div>
              <button
                onClick={closeTradeModal}
                className="px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors text-sm md:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      <EditTradeModal
        isOpen={!!editTrade}
        onClose={() => setEditTrade(null)}
        trade={editTrade}
        onUpdate={handleUpdateTrade}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!tradeToDelete}
        onClose={() => setTradeToDelete(null)}
        onConfirm={handleConfirmDelete}
        trade={tradeToDelete}
        loading={deleteLoading}
      />
    </div>
  )
}

export default AllTrades