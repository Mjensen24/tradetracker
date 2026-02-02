import { useState, useEffect } from 'react'
import ErrorMessage from '../ui/ErrorMessage'
import LoadingSpinner from '../ui/LoadingSpinner'

const ResetBalanceModal = ({ 
  isOpen, 
  onClose, 
  account, 
  onResetAccountBalance,
  onRefetchTrades,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setWithdrawalAmount('')
    }
  }, [isOpen])

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

  // Handle balance input validation
  const handleBalanceInput = (value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawalAmount(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
        throw new Error('Withdrawal amount must be a positive number')
      }

      const result = await onResetAccountBalance(account.id, parseFloat(withdrawalAmount))
      
      if (result.success) {
        // Refresh trades if this is the active account
        if (onRefetchTrades) {
          await onRefetchTrades()
        }
        if (onSuccess) {
          onSuccess('Balance reset successfully!')
        }
        onClose()
      } else {
        throw new Error(result.error || 'Failed to reset balance')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !account) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full border border-gray-800">
        {/* Header */}
        <div className="border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Reset Balance</h2>
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
            <div className="mb-4">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              Withdraw money from <span className="text-white font-semibold">{account.name || 'Unnamed Account'}</span>.
              This will update the account balance while preserving all trade history.
            </p>
            
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 sm:p-4 mb-4">
              <div className="text-xs text-gray-400 mb-1">Current Starting Balance</div>
              <div className="text-lg font-semibold text-white">
                {account.starting_balance ? `$${parseFloat(account.starting_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Withdrawal Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={withdrawalAmount}
                onChange={(e) => handleBalanceInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] transition-colors"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the amount you want to withdraw from this account.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetBalanceModal
