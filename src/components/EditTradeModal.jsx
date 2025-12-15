import { useState, useEffect } from 'react'
import ErrorMessage from './ui/ErrorMessage'
import LoadingSpinner from './ui/LoadingSpinner'

const EditTradeModal = ({ isOpen, onClose, trade, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    trade_date: '',
    ticker: '',
    entry_price: '',
    exit_price: '',
    shares: '',
    news: false,
    float: '',
    sector: '',
    setup_quality: '',
    pullback_type: '',
    setup_type: '',
    strategy: '',
    notes: '',
    loser_winner_reason: ''
  })

  // Populate form when trade changes
  useEffect(() => {
    if (trade) {
      setFormData({
        trade_date: trade.trade_date || '',
        ticker: trade.ticker || '',
        entry_price: trade.entry_price || '',
        exit_price: trade.exit_price || '',
        shares: trade.shares || '',
        news: trade.news || false,
        float: trade.float || '',
        sector: trade.sector || '',
        setup_quality: trade.setup_quality || '',
        pullback_type: trade.pullback_type || '',
        setup_type: trade.setup_type || '',
        strategy: trade.strategy || '',
        notes: trade.notes || '',
        loser_winner_reason: trade.loser_winner_reason || ''
      })
    }
  }, [trade])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.ticker || !formData.entry_price || !formData.exit_price || !formData.shares) {
        throw new Error('Please fill in all required fields (Ticker, Entry Price, Exit Price, Shares)')
      }

      // Prepare data for update
      const updatedData = {
        trade_date: formData.trade_date,
        ticker: formData.ticker.toUpperCase(),
        entry_price: parseFloat(formData.entry_price),
        exit_price: parseFloat(formData.exit_price),
        shares: parseInt(formData.shares),
        news: formData.news,
        float: formData.float || null,
        sector: formData.sector || null,
        setup_quality: formData.setup_quality || null,
        pullback_type: formData.pullback_type || null,
        setup_type: formData.setup_type || null,
        strategy: formData.strategy || null,
        notes: formData.notes || null,
        loser_winner_reason: formData.loser_winner_reason || null
      }

      // Call update function
      const result = await onUpdate(trade.id, updatedData)
      
      if (result.success) {
        onClose()
      } else {
        throw new Error(result.error)
      }

    } catch (err) {
      console.error('Error updating trade:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !trade) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Edit Trade</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {/* Basic Trade Information */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="trade_date"
                  value={formData.trade_date}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ticker <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ticker"
                  value={formData.ticker}
                  onChange={handleChange}
                  required
                  placeholder="AAPL"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white uppercase focus:outline-none focus:border-[#a4fc3c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Entry Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="entry_price"
                  value={formData.entry_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="14.50"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Exit Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="exit_price"
                  value={formData.exit_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="15.20"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Shares <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="shares"
                  value={formData.shares}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="500"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="news"
                    checked={formData.news}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#a4fc3c] bg-[#0a0a0a] border-gray-700 rounded focus:ring-[#a4fc3c] focus:ring-2"
                  />
                  <span className="ml-2 text-white">News Catalyst</span>
                </label>
              </div>
            </div>
          </div>

          {/* Stock Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
              Stock Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Float
                </label>
                <input
                  type="text"
                  name="float"
                  value={formData.float}
                  onChange={handleChange}
                  placeholder="7M"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sector
                </label>
                <input
                  type="text"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  placeholder="Finance"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>
            </div>
          </div>

          {/* Trade Setup */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
              Trade Setup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Setup Quality
                </label>
                <select
                  name="setup_quality"
                  value={formData.setup_quality}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                >
                  <option value="">Select Grade</option>
                  <option value="A">A - Excellent</option>
                  <option value="B">B - Good</option>
                  <option value="C">C - Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Strategy
                </label>
                <select
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                >
                  <option value="">Select Strategy</option>
                  <option value="Momentum">Momentum</option>
                  <option value="Dip">Dip Trade</option>
                  <option value="Scalp">Scalp</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Breakout">Breakout</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Pullback Type
                </label>
                <select
                  name="pullback_type"
                  value={formData.pullback_type}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                >
                  <option value="">Select Pullback</option>
                  <option value="1st Pull Back">1st Pull Back</option>
                  <option value="2nd Pull Back">2nd Pull Back</option>
                  <option value="3rd Pull Back +">3rd Pull Back +</option>
                  <option value="High Risk">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Setup Type
                </label>
                <select
                  name="setup_type"
                  value={formData.setup_type}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                >
                  <option value="">Select Setup</option>
                  <option value="1 Minute Setup">1 Minute Setup</option>
                  <option value="5 Minute Setup">5 Minute Setup</option>
                  <option value="10 Second Setup">10 Second Setup</option>
                  <option value="Halt">Halt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
              Trade Notes
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  General Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Entry reasons, market conditions, emotions..."
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Win/Loss Analysis
                </label>
                <textarea
                  name="loser_winner_reason"
                  value={formData.loser_winner_reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Why did this trade win or lose? What can you learn?"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 border border-gray-800 text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Updating...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTradeModal