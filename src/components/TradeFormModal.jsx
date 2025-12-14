import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TradeFormModal = ({ isOpen, onClose, onTradeAdded, accountId }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    trade_date: new Date().toISOString().split('T')[0], // Today's date
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
    net_pl: '', // Strategy
    notes: '',
    loser_winner_reason: ''
  })

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

      // Prepare data for insertion
      const tradeData = {
        account_id: accountId,
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
        net_pl: formData.net_pl || null,
        notes: formData.notes || null,
        loser_winner_reason: formData.loser_winner_reason || null
      }

      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('trades')
        .insert([tradeData])
        .select()

      if (insertError) throw insertError

      // Reset form
      setFormData({
        trade_date: new Date().toISOString().split('T')[0],
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
        net_pl: '',
        notes: '',
        loser_winner_reason: ''
      })

      // Notify parent component
      onTradeAdded()
      onClose()

    } catch (err) {
      console.error('Error adding trade:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Add New Trade</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Trade Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
                />
              </div>
            </div>
          </div>

          {/* Trade Setup */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  name="net_pl"
                  value={formData.net_pl}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
                >
                  <option value="">Select Setup</option>
                  <option value="1 Minute Setup">1 Minute Setup</option>
                  <option value="10 Second Setup">10 Second Setup</option>
                  <option value="Halt">Halt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
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
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a4fc3c]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Trade...' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TradeFormModal