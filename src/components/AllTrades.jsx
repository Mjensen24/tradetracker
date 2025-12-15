import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import EditTradeModal from './EditTradeModal'
import DeleteConfirmModal from './DeleteConfirmModal'

function AllTrades({ trades, onUpdate, onDelete }) {
  // Filter states
  const [filters, setFilters] = useState({
    ticker: '',
    startDate: '',
    endDate: '',
    setupQuality: '',
    setupType: '',
    winLoss: ''
  })

  // Modal states
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [editTrade, setEditTrade] = useState(null)
  const [tradeToDelete, setTradeToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Get unique values for dropdown options
  const uniqueSetupTypes = useMemo(() => {
    return [...new Set(trades.map(t => t.setup_type).filter(Boolean))].sort()
  }, [trades])

  // Filter trades based on all selected filters
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
      if (filters.setupType && trade.setup_type !== filters.setupType) {
        return false
      }
      if (filters.winLoss && trade.win_loss !== filters.winLoss) {
        return false
      }
      return true
    })
  }, [trades, filters])

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
      winLoss: ''
    })
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
    try {
      const result = await onDelete(tradeToDelete.id)
      if (result.success) {
        setTradeToDelete(null)
      } else {
        alert(`Error deleting trade: ${result.error}`)
      }
    } catch (error) {
      alert(`Error deleting trade: ${error.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">Complete Trade Log</h2>

      {/* Filters Section - Always Visible */}
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 mb-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ticker Search */}
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

          {/* Start Date */}
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

          {/* End Date */}
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

          {/* Setup Quality */}
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

          {/* Setup Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Setup Type</label>
            <select
              name="setupType"
              value={filters.setupType}
              onChange={handleFilterChange}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
            >
              <option value="">All Results</option>
              <option value="W">Winners</option>
              <option value="L">Losers</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap gap-6 items-center">
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
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto px-6 py-2 bg-[#a4fc3c] text-black rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
            >
              Clear Filters
            </button>
          )}
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
                {filteredTrades.map((trade, idx) => {
                  // Calculate cents P/L (price difference per share)
                  const centsPL = trade.exit_price - trade.entry_price

                  return (
                    <tr
                      key={trade.id}
                      onClick={() => openTradeModal(trade)}
                      className={`${idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0a0a0a]'} hover:bg-[#2a2a2a] cursor-pointer transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {format(parseISO(trade.trade_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{trade.ticker}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">${trade.entry_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">${trade.exit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{trade.shares}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${
                        centsPL >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                      }`}>
                        {centsPL >= 0 ? '+' : ''}{centsPL.toFixed(2)}¢
                      </td>
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
                            handleEditTrade(trade)
                          }}
                          className="text-[#a4fc3c] hover:text-white mr-3 transition-colors text-sm font-medium"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTrade(trade)
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
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
                    selectedTrade.setup_quality === 'A' ? 'bg-[#a4fc3c]/20 text-[#a4fc3c]' :
                    selectedTrade.setup_quality === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    Grade {selectedTrade.setup_quality}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {format(parseISO(selectedTrade.trade_date), 'EEEE, MMMM d, yyyy')}
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
              {/* Key Metrics - Prominent Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Entry Price - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Entry Price</div>
                  <div className="text-4xl font-bold text-white">${selectedTrade.entry_price.toFixed(2)}</div>
                </div>

                {/* Exit Price - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Exit Price</div>
                  <div className="text-4xl font-bold text-white">${selectedTrade.exit_price.toFixed(2)}</div>
                </div>

                {/* Shares - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Shares</div>
                  <div className="text-4xl font-bold text-white">{selectedTrade.shares.toLocaleString()}</div>
                </div>

                {/* Cents P/L - Prominent */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-xl border-2 border-gray-700 shadow-lg">
                  <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Cents P/L</div>
                  <div className={`text-4xl font-bold ${
                    (selectedTrade.exit_price - selectedTrade.entry_price) >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                  }`}>
                    {(selectedTrade.exit_price - selectedTrade.entry_price) >= 0 ? '+' : ''}
                    {(selectedTrade.exit_price - selectedTrade.entry_price).toFixed(2)}¢
                  </div>
                </div>
              </div>

              {/* Profit/Loss Section */}
              <div className="mb-6 p-6 bg-[#0a0a0a] rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Total Profit/Loss</div>
                <div className={`text-5xl font-bold ${
                  selectedTrade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {selectedTrade.profit_loss >= 0 ? '+' : ''}${selectedTrade.profit_loss.toFixed(2)}
                </div>
              </div>

              {/* Additional Trade Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-500 mb-1">Strategy</div>
                  <div className="text-lg font-semibold text-white">{selectedTrade.net_pl || 'N/A'}</div>
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
            <div className="bg-[#0a0a0a] p-4 border-t border-gray-800 flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditTrade(selectedTrade)
                  }}
                  className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-[#a4fc3c] rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                >
                  Edit Trade
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTrade(selectedTrade)
                  }}
                  className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 text-red-400 rounded-lg font-semibold hover:bg-[#2a2a2a] transition-colors"
                >
                  Delete Trade
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