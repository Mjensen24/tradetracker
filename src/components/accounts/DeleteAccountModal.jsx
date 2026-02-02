import { useState, useEffect } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import ErrorMessage from '../ui/ErrorMessage'

const DeleteAccountModal = ({ 
  isOpen, 
  onClose, 
  account, 
  onDeleteAccount,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  // Reset error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
    }
  }, [isOpen])

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await onDeleteAccount(account.id)
      
      if (result.success) {
        if (onSuccess) {
          onSuccess('Account deleted successfully!')
        }
        onClose()
      } else {
        setError(result.error || 'Failed to delete account')
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
          <h2 className="text-xl sm:text-2xl font-bold text-white">Delete Account</h2>
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
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              Are you sure you want to delete <span className="text-white font-semibold">{account.name || 'Unnamed Account'}</span>? 
              This will also delete all trades associated with this account. This action cannot be undone.
            </p>
            
            <div className="bg-red-900/10 border border-red-900/50 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs sm:text-sm text-red-300">
                  <p className="font-medium mb-1">Warning: This action is permanent</p>
                  <p className="text-red-400/80">
                    All trades, statistics, and data associated with this account will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete Account'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal
