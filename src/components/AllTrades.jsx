import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import EditTradeModal from './EditTradeModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const AllTrades = ({ trades, onUpdate, onDelete }) => {
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    ticker: '',
    startDate: '',
    endDate: '',
    setupQuality: '',
    strategy: '',
    winLoss: ''
  })

  const [showFilters, setShowFilters] = useState(false)

  // Filter trades based on current filters
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
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
      if (filters.strategy && trade.strategy !== filters.strategy) {
        return false
      }
      if (filters.winLoss && trade.win_loss !== filters.winLoss) {
        return false
      }
      return true
    })
  }, [trades, filters])

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
      strategy: '',
      winLoss: ''
    })
  }

  const openTradeModal = (trade) => {
    setSelectedTrade(trade)
    setIsDetailModalOpen(true)
  }

  const closeTradeModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTrade(null)
  }

  const openEditModal = (trade) => {
    setSelectedTrade(trade)
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedTrade(null)
  }

  const openDeleteModal = (trade) => {
    setSelectedTrade(trade)
    setIsDetailModalOpen(false)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedTrade(null)
  }

  const handleDelete = async () => {
    if (!selectedTrade) return

    setDeleteLoading(true)
    const result = await onDelete(selectedTrade.id)
    setDeleteLoading(false)

    if (result.success) {
      closeDeleteModal()
    } else {
      alert('Error deleting trade: ' + result.error)
    }
  }

  // Get unique values for filter dropdowns
  const uniqueStrategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">All Trades</h2>
          <p className="text-gray-400">
            Showing {filteredTrades.length} of {trades.length} trades
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-6 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
        >
          {showFilters ? '✕ Hide Filters' : '🔍 Show Filters'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Ticker</label>
              <input
                type="text"
                name="ticker"
                value={filters.ticker}
                onChange={handleFilterChange}
                placeholder="AAPL"
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Setup Quality</label>
              <select
                name="setupQuality"
                value={filters.setupQuality}
                onChange={handleFilterChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
              >
                <option value="">All Grades</option>
                <option value="A">A - Excellent</option>
                <option value="B">B - Good</option>
                <option value="C">C - Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Strategy</label>
              <select
                name="strategy"
                value={filters.strategy}
                onChange={handleFilterChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
              >
                <option value="">All Strategies</option>
                {uniqueStrategies.map(strategy => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Result</label>
              <select
                name="winLoss"
                value={filters.winLoss}
                onChange={handleFilterChange}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
              >
                <option value="">All Results</option>
                <option value="W">Winners</option>
                <option value="L">Losers</option>
              </select>
            </div>
          </div>
          <button
            onClick={resetFilters}
            className="mt-4 px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Trade Table */}
      {filteredTrades.length > 0 ? (
        <div className="bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Ticker</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Entry</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Exit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Shares</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">P/L</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Quality</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Setup</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTrades.map((trade, idx) => (
                  <tr
                    key={trade.id}
                    className={`${idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'} hover:bg-[#2a2a2a] transition-colors`}
                  >
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm text-gray-300 cursor-pointer"
                    >
                      {format(parseISO(trade.trade_date), 'MMM d, yyyy')}
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm font-semibold text-white cursor-pointer"
                    >
                      {trade.ticker}
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm text-gray-300 cursor-pointer"
                    >
                      ${trade.entry_price.toFixed(2)}
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm text-gray-300 cursor-pointer"
                    >
                      ${trade.exit_price.toFixed(2)}
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm text-gray-300 cursor-pointer"
                    >
                      {trade.shares}
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className={`px-4 py-3 text-sm font-semibold cursor-pointer ${
                        trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                      }`}
                    >
                      {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm cursor-pointer"
                    >
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        trade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                        trade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.setup_quality || 'N/A'}
                      </span>
                    </td>
                    <td 
                      onClick={() => openTradeModal(trade)}
                      className="px-4 py-3 text-sm text-gray-300 cursor-pointer"
                    >
                      {trade.strategy || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(trade)
                          }}
                          className="text-[#a4fc3c] hover:text-white transition-colors p-1"
                          title="Edit trade"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteModal(trade)
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Delete trade"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl p-12 text-center border border-gray-800">
          <p className="text-gray-400 text-lg">No trades found matching your filters</p>
        </div>
      )}

      {/* Trade Detail Modal */}
      {isDetailModalOpen && selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            {/* Modal Header */}
            <div className="bg-[#0a0a0a] p-6 border-b border-gray-800 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-3xl font-bold text-white">{selectedTrade.ticker}</h2>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded ${
                    selectedTrade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                    selectedTrade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Grade: {selectedTrade.setup_quality}
                  </span>
                </div>
                <p className="text-gray-400">
                  {format(parseISO(selectedTrade.trade_date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={closeTradeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* P/L Display */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-1">Profit/Loss</div>
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
                  <div className="text-xs text-gray-500 mb-1">Strategy</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.strategy || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Setup Type</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.setup_type || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Pullback Type</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.pullback_type || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Sector</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.sector || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Float</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.float || 'N/A'}</div>
                </div>

                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">News</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.news ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Notes Section */}
              {(selectedTrade.notes || selectedTrade.loser_winner_reason) && (
                <div className="space-y-4">
                  {selectedTrade.notes && (
                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                      <div className="text-xs text-gray-500 mb-2">Trade Notes</div>
                      <div className="text-gray-300 leading-relaxed">{selectedTrade.notes}</div>
                    </div>
                  )}
                  {selectedTrade.loser_winner_reason && (
                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                      <div className="text-xs text-gray-500 mb-2">Win/Loss Analysis</div>
                      <div className="text-gray-300 leading-relaxed">{selectedTrade.loser_winner_reason}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0a0a0a] p-4 border-t border-gray-800 flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(selectedTrade)
                  }}
                  className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-[#a4fc3c] rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                >
                  ✏️ Edit Trade
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteModal(selectedTrade)
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

      {/* Edit Modal */}
      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        trade={selectedTrade}
        onUpdate={onUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        trade={selectedTrade}
        loading={deleteLoading}
      />
    </div>
  )
}

export default AllTrades