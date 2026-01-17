import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ErrorMessage from './ui/ErrorMessage'
import LoadingSpinner from './ui/LoadingSpinner'

const TradeFormModal = ({ isOpen, onClose, onTradeAdded, accountId }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMultipleMode, setIsMultipleMode] = useState(false)

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
    strategy: '',
    notes: '',
    loser_winner_reason: ''
  })

  // Multiple trades state
  const [multipleTrades, setMultipleTrades] = useState([
    { entry_price: '', exit_price: '', shares: '' }
  ])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Reset form when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setIsMultipleMode(false)
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
        strategy: '',
        notes: '',
        loser_winner_reason: ''
      })
      setMultipleTrades([{ entry_price: '', exit_price: '', shares: '' }])
    }
  }, [isOpen])

  // Handle multiple trade row changes
  const handleMultipleTradeChange = (index, field, value) => {
    setMultipleTrades(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Add a new trade row
  const addTradeRow = () => {
    setMultipleTrades(prev => [...prev, { entry_price: '', exit_price: '', shares: '' }])
  }

  // Remove a trade row
  const removeTradeRow = (index) => {
    if (multipleTrades.length > 1) {
      setMultipleTrades(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error('User not authenticated. Please log in to add a trade.');
      }

      // Get account_id - use provided accountId or fetch the default account
      let finalAccountId = accountId;
      
      if (!finalAccountId) {
        // Fetch the default account if accountId is not provided
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('is_default', true)
          .eq('user_id', session.user.id)
          .single();
        
        if (accountError || !accountData) {
          throw new Error('No account found. Please create an account in Settings first.');
        }
        
        finalAccountId = accountData.id;
      }

      if (isMultipleMode) {
        // Multiple trades mode
        // Validate shared fields
        if (!formData.ticker || !formData.trade_date) {
          throw new Error('Please fill in all required shared fields (Ticker, Date)')
        }

        // Validate and filter valid trade rows
        const validTrades = multipleTrades.filter(
          trade => trade.entry_price && trade.exit_price && trade.shares
        )

        if (validTrades.length === 0) {
          throw new Error('Please add at least one trade with Entry Price, Exit Price, and Shares')
        }

        // Prepare batch insert data
        const tradesData = validTrades.map(trade => ({
          account_id: finalAccountId,
          trade_date: formData.trade_date,
          ticker: formData.ticker.toUpperCase(),
          entry_price: parseFloat(trade.entry_price),
          exit_price: parseFloat(trade.exit_price),
          shares: parseInt(trade.shares),
          news: formData.news,
          float: formData.float || null,
          sector: formData.sector || null,
          setup_quality: null,
          pullback_type: null,
          setup_type: null,
          strategy: null,
          notes: null,
          loser_winner_reason: null
        }))

        // Insert into Supabase
        let { data, error: insertError } = await supabase
          .from('trades')
          .insert(tradesData)
          .select()

        // If that fails with user_id error, try with user_id explicitly
        if (insertError && (insertError.message?.includes('user_id') || insertError.code === 'PGRST204')) {
          const tradesDataWithUserId = tradesData.map(trade => ({
            ...trade,
            user_id: session.user.id
          }))
          const retryResult = await supabase
            .from('trades')
            .insert(tradesDataWithUserId)
            .select();
          
          if (retryResult.error) throw retryResult.error;
          data = retryResult.data;
        } else if (insertError) {
          throw insertError;
        }

      } else {
        // Single trade mode
        // Validate required fields
        if (!formData.ticker || !formData.entry_price || !formData.exit_price || !formData.shares) {
          throw new Error('Please fill in all required fields (Ticker, Entry Price, Exit Price, Shares)')
        }

        // Prepare data for insertion
        const tradeData = {
          account_id: finalAccountId,
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

        // Insert into Supabase
        let { data, error: insertError } = await supabase
          .from('trades')
          .insert([tradeData])
          .select()

        // If that fails with user_id error, try with user_id explicitly
        if (insertError && (insertError.message?.includes('user_id') || insertError.code === 'PGRST204')) {
          const tradeDataWithUserId = {
            ...tradeData,
            user_id: session.user.id
          };
          const retryResult = await supabase
            .from('trades')
            .insert([tradeDataWithUserId])
            .select();
          
          if (retryResult.error) throw retryResult.error;
          data = retryResult.data;
        } else if (insertError) {
          throw insertError;
        }
      }

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
        strategy: '',
        notes: '',
        loser_winner_reason: ''
      })
      setMultipleTrades([{ entry_price: '', exit_price: '', shares: '' }])

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Add New Trade</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!isMultipleMode ? 'text-white' : 'text-gray-400'}`}>
              Single Trade
            </span>
            <button
              type="button"
              onClick={() => setIsMultipleMode(!isMultipleMode)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                isMultipleMode ? 'bg-[#a4fc3c]' : 'bg-gray-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Toggle multiple trades mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMultipleMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isMultipleMode ? 'text-white' : 'text-gray-400'}`}>
              Multiple Trades
            </span>
          </div>
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
              {isMultipleMode ? 'Shared Information' : 'Basic Information'}
            </h3>
            {isMultipleMode && (
              <p className="text-sm text-gray-400 mb-4">
                These fields will be applied to all trades below.
              </p>
            )}
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

              {!isMultipleMode && (
                <>
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
                </>
              )}

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

          {/* Multiple Trades Section */}
          {isMultipleMode && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white border-b border-gray-800 pb-2 flex-1">
                  Individual Trades
                </h3>
                <button
                  type="button"
                  onClick={addTradeRow}
                  className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add Trade</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {multipleTrades.map((trade, index) => (
                  <div key={index} className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-300">Trade {index + 1}</h4>
                      {multipleTrades.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTradeRow(index)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Entry Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={trade.entry_price}
                          onChange={(e) => handleMultipleTradeChange(index, 'entry_price', e.target.value)}
                          step="0.01"
                          min="0.01"
                          placeholder="14.50"
                          className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Exit Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={trade.exit_price}
                          onChange={(e) => handleMultipleTradeChange(index, 'exit_price', e.target.value)}
                          step="0.01"
                          min="0.01"
                          placeholder="15.20"
                          className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Shares <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={trade.shares}
                          onChange={(e) => handleMultipleTradeChange(index, 'shares', e.target.value)}
                          min="1"
                          placeholder="500"
                          className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trade Setup - Only show in single mode */}
          {!isMultipleMode && (
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
          )}

          {/* Notes - Only show in single mode */}
          {!isMultipleMode && (
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
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-800 text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>{isMultipleMode ? 'Adding Trades...' : 'Adding Trade...'}</span>
                </>
              ) : (
                isMultipleMode ? 'Add Trades' : 'Add Trade'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TradeFormModal