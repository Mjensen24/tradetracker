import { useEffect } from 'react'
import LoadingSpinner from './ui/LoadingSpinner'
import { formatCurrency, formatDateShort } from '../utils/formatters'

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, trade, loading }) => {
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

  if (!isOpen || !trade) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full border border-gray-800">
        {/* Header */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Delete Trade</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              Are you sure you want to delete this trade? This action cannot be undone.
            </p>
            
            <div className="bg-[#0a0a0a] p-3 sm:p-4 rounded-lg border border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                <div>
                  <span className="text-xl sm:text-2xl font-bold text-white">{trade.ticker}</span>
                  <span className="text-gray-500 ml-2 text-sm sm:text-base">
                    {formatDateShort(trade.trade_date)}
                  </span>
                </div>
                <div className={`text-lg sm:text-xl font-bold ${
                  trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {formatCurrency(trade.profit_loss, true)}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                {trade.shares} shares @ {formatCurrency(trade.entry_price)} → {formatCurrency(trade.exit_price)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-800 text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete Trade'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal