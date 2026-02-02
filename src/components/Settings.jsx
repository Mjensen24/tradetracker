import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import ErrorMessage from './ui/ErrorMessage'
import LoadingSpinner from './ui/LoadingSpinner'
import AccountActionsMenu from './ui/AccountActionsMenu'
import EditAccountModal from './accounts/EditAccountModal'
import DeleteAccountModal from './accounts/DeleteAccountModal'
import ResetBalanceModal from './accounts/ResetBalanceModal'

function Settings({ 
  account, 
  allAccounts,
  onUpdateAccount, 
  onCreateAccount,
  onSwitchAccount,
  onRenameAccount,
  onDeleteAccount,
  onResetAccountBalance,
  onRefetchTrades,
  loading: accountLoading 
}) {
  const { signOut, user } = useAuth()
  // Account management state
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // Track which action is loading
  
  // Create account form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  
  // Modal state management
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalAccount, setEditModalAccount] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteModalAccount, setDeleteModalAccount] = useState(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetModalAccount, setResetModalAccount] = useState(null)

  // Clear success message after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Handle balance input validation
  const handleBalanceInput = (value, setter) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value)
    }
  }

  // Create new account
  const handleCreateAccount = async (e) => {
    e.preventDefault()
    
    if (!newAccountName.trim()) {
      setError('Account name is required')
      return
    }
    
    if (!newAccountBalance || parseFloat(newAccountBalance) < 0) {
      setError('Starting balance must be a positive number')
      return
    }

    setActionLoading('create')
    setError(null)

    try {
      const result = await onCreateAccount(newAccountName.trim(), parseFloat(newAccountBalance))
      
      if (result.success) {
        setSuccess('Account created successfully!')
        setNewAccountName('')
        setNewAccountBalance('')
        setShowCreateForm(false)
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Switch active account
  const handleSwitchAccount = async (accountId) => {
    setActionLoading(`switch-${accountId}`)
    setError(null)

    try {
      const result = await onSwitchAccount(accountId)
      
      if (result.success) {
        setSuccess('Switched account successfully!')
        // Refresh trades for the new account
        if (onRefetchTrades) {
          await onRefetchTrades()
        }
      } else {
        setError(result.error || 'Failed to switch account')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Open edit modal
  const handleEditAccount = (acc) => {
    setEditModalAccount(acc)
    setEditModalOpen(true)
    setError(null)
  }

  // Open delete modal
  const handleDeleteAccountClick = (acc) => {
    setDeleteModalAccount(acc)
    setDeleteModalOpen(true)
    setError(null)
  }

  // Open reset balance modal
  const handleResetBalanceClick = (acc) => {
    setResetModalAccount(acc)
    setResetModalOpen(true)
    setError(null)
  }

  // Delete account handler (called from modal)
  const handleDeleteAccount = async (accountId) => {
    try {
      const result = await onDeleteAccount(accountId)
      return result
    } catch (err) {
      return { success: false, error: err.message || 'An error occurred' }
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

      {/* Global Error/Success Messages */}
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
            <p className="text-green-400 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Account Management Section */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 mb-4 md:mb-6">
        <div className="p-4 md:p-6 border-b border-gray-800">
          <h3 className="text-lg md:text-xl font-semibold text-white">Account Management</h3>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Manage your trading accounts</p>
        </div>
        
        <div className="p-4 md:p-6">
          {/* Account List */}
          <div className="space-y-3">
            {(allAccounts || []).map((acc) => {
              const isActive = acc.id === account?.id

              return (
                <div 
                  key={acc.id}
                  className={`bg-[#0a0a0a] rounded-lg border transition-all ${
                    isActive 
                      ? 'border-2 border-[#a4fc3c] bg-[#1a1a1a]/30' 
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Account Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-[#a4fc3c]/20' : 'bg-[#1a1a1a]'
                        }`}>
                          <svg className={`w-6 h-6 ${isActive ? 'text-[#a4fc3c]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base md:text-lg font-semibold text-white truncate">
                              {acc.name || 'Unnamed Account'}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-[#a4fc3c]/20 text-[#a4fc3c] text-xs font-medium rounded flex-shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Starting: <span className="text-gray-300 font-medium">{formatCurrency(acc.starting_balance || 0)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => handleSwitchAccount(acc.id)}
                            disabled={actionLoading === `switch-${acc.id}`}
                            className="px-4 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                          >
                            {actionLoading === `switch-${acc.id}` ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span>Switching...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span>Switch To</span>
                              </>
                            )}
                          </button>
                        )}
                        <AccountActionsMenu
                          account={acc}
                          isActive={isActive}
                          allAccounts={allAccounts}
                          onEdit={handleEditAccount}
                          onResetBalance={handleResetBalanceClick}
                          onDelete={handleDeleteAccountClick}
                          disabled={actionLoading !== null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Create Account Form */}
          {showCreateForm ? (
            <div className="mt-4 bg-[#0a0a0a] rounded-lg border border-gray-800 p-4">
              <h4 className="text-sm font-semibold text-white mb-4">Create New Account</h4>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="e.g., Paper Trading, Options Account"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] transition-colors text-sm"
                    disabled={actionLoading === 'create'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Starting Balance
                  </label>
                  <input
                    type="text"
                    value={newAccountBalance}
                    onChange={(e) => handleBalanceInput(e.target.value, setNewAccountBalance)}
                    placeholder="5000.00"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] transition-colors text-sm"
                    disabled={actionLoading === 'create'}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewAccountName('')
                      setNewAccountBalance('')
                    }}
                    disabled={actionLoading === 'create'}
                    className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create'}
                    className="px-4 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'create' ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={actionLoading !== null}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-[#a4fc3c] hover:text-[#a4fc3c] transition-colors text-sm font-medium disabled:opacity-50 disabled:hover:border-gray-700 disabled:hover:text-gray-400"
            >
              + Add New Account
            </button>
          )}
        </div>
      </div>

      {/* Account Modals */}
      <EditAccountModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditModalAccount(null)
        }}
        account={editModalAccount}
        isActive={editModalAccount?.id === account?.id}
        onRenameAccount={onRenameAccount}
        onUpdateAccount={onUpdateAccount}
        onSuccess={(message) => {
          setSuccess(message)
          if (onRefetchTrades) {
            onRefetchTrades()
          }
        }}
      />

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteModalAccount(null)
        }}
        account={deleteModalAccount}
        onDeleteAccount={handleDeleteAccount}
        onSuccess={(message) => {
          setSuccess(message)
          if (onRefetchTrades) {
            onRefetchTrades()
          }
        }}
      />

      <ResetBalanceModal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false)
          setResetModalAccount(null)
        }}
        account={resetModalAccount}
        onResetAccountBalance={onResetAccountBalance}
        onRefetchTrades={onRefetchTrades}
        onSuccess={(message) => {
          setSuccess(message)
        }}
      />

      {/* Display Preferences (Placeholder for future) */}
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

      {/* Account Section */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 mt-4 md:mt-6">
        <div className="p-4 md:p-6 border-b border-gray-800">
          <h3 className="text-lg md:text-xl font-semibold text-white">Account</h3>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Manage your account settings</p>
        </div>
        
        <div className="p-4 md:p-6">
          {user && (
            <div className="mb-4 pb-4 border-b border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Signed in as</div>
              <div className="text-white font-medium">{user.email}</div>
            </div>
          )}
          <button
            onClick={async () => {
              const result = await signOut()
              if (result.success) {
                // The auth hook will handle redirecting to login
                window.location.reload()
              }
            }}
            className="w-full px-4 py-2 border border-red-900 text-red-400 rounded-lg hover:bg-red-900/20 transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
