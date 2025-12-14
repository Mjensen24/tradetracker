const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, trade, loading }) => {
  if (!isOpen || !trade) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-md w-full border border-gray-800">
        {/* Header */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Delete Trade</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete this trade? This action cannot be undone.
            </p>
            
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-2xl font-bold text-white">{trade.ticker}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(trade.trade_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className={`text-xl font-bold ${
                  trade.profit_loss >= 0 ? 'text-[#a4fc3c]' : 'text-red-400'
                }`}>
                  {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {trade.shares} shares @ ${trade.entry_price.toFixed(2)} → ${trade.exit_price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete Trade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal