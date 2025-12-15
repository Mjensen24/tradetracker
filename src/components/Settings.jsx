import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatters'
import ErrorMessage from './ui/ErrorMessage'
import LoadingSpinner from './ui/LoadingSpinner'

function Settings({ account, onUpdateAccount, loading: accountLoading }) {
  const [startingBalance, setStartingBalance] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Initialize form when account loads
  useEffect(() => {
    if (account?.starting_balance !== undefined) {
      setStartingBalance(account.starting_balance.toString())
    }
  }, [account])

  const handleStartingBalanceChange = (e) => {
    const value = e.target.value
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStartingBalance(value)
      setError(null)
      setSuccess(false)
    }
  }

  const handleSaveStartingBalance = async (e) => {
    e.preventDefault()
    
    if (!startingBalance || startingBalance.trim() === '') {
      setError('Starting balance is required')
      return
    }

    const balance = parseFloat(startingBalance)
    if (isNaN(balance) || balance < 0) {
      setError('Starting balance must be a positive number')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await onUpdateAccount({ starting_balance: balance })
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update starting balance')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (accountLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Settings</h2>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Settings</h2>

      {/* Starting Balance Configuration */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 mb-4 md:mb-6">
        <div className="p-4 md:p-6 border-b border-gray-800">
          <h3 className="text-lg md:text-xl font-semibold text-white">Account Configuration</h3>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>
        
        <div className="p-4 md:p-6">
          <form onSubmit={handleSaveStartingBalance}>
            <div className="mb-4 md:mb-6">
              <label htmlFor="startingBalance" className="block text-xs md:text-sm font-medium text-gray-400 mb-2">
                Starting Balance
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    id="startingBalance"
                    value={startingBalance}
                    onChange={handleStartingBalanceChange}
                    placeholder="5000.00"
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] transition-colors"
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This is your initial account balance. All calculations and charts will use this value as the starting point.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving || !startingBalance || startingBalance === account?.starting_balance?.toString()}
                  className="w-full sm:w-auto bg-[#a4fc3c] text-black px-4 md:px-6 py-3 rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#a4fc3c] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-400 text-sm font-medium">Starting balance updated successfully!</p>
              </div>
            </div>
          )}

          {account?.starting_balance !== undefined && (
            <div className="bg-[#0a0a0a] rounded-lg p-3 md:p-4 border border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Current Starting Balance</div>
              <div className="text-xl md:text-2xl font-bold text-[#a4fc3c]">
                {formatCurrency(account.starting_balance)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
        <div className="p-4 md:p-6 border-b border-gray-800">
          <h3 className="text-lg md:text-xl font-semibold text-white">Display Preferences</h3>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Customize how information is displayed</p>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
              <div className="text-sm font-medium text-gray-300 mb-2">Date Format</div>
              <div className="text-xs text-gray-400">
                Short format: MMM d, yyyy (e.g., Jan 15, 2024)
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Long format: EEEE, MMMM d, yyyy (e.g., Monday, January 15, 2024)
              </div>
            </div>

            <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
              <div className="text-sm font-medium text-gray-300 mb-2">Currency Format</div>
              <div className="text-xs text-gray-400">
                Format: $X,XXX.XX (e.g., {formatCurrency(1234.56)})
              </div>
            </div>

            <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
              <div className="text-sm font-medium text-gray-300 mb-2">Number Format</div>
              <div className="text-xs text-gray-400">
                Large numbers use locale formatting (e.g., 1,234 shares)
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 italic">
            Display preferences are currently using default formats. Customization options will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings