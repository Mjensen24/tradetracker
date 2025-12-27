import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import ErrorMessage from './ui/ErrorMessage'
import LoadingSpinner from './ui/LoadingSpinner'

function Settings({ 
  account, 
  allAccounts,
  onUpdateAccount, 
  onCreateAccount,
  onSwitchAccount,
  onRenameAccount,
  onDeleteAccount,
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
  
  // Edit account state
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

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

  // Start editing an account
  const startEditing = (acc) => {
    setEditingAccountId(acc.id)
    setEditName(acc.name || '')
    setEditBalance(acc.starting_balance?.toString() || '')
    setError(null)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingAccountId(null)
    setEditName('')
    setEditBalance('')
  }

  // Save account edits
  const handleSaveEdit = async (accountId) => {
    if (!editName.trim()) {
      setError('Account name is required')
      return
    }
    
    if (!editBalance || parseFloat(editBalance) < 0) {
      setError('Starting balance must be a positive number')
      return
    }

    setActionLoading(`edit-${accountId}`)
    setError(null)

    try {
      // Update name
      const nameResult = await onRenameAccount(accountId, editName.trim())
      if (!nameResult.success) {
        setError(nameResult.error || 'Failed to update account name')
        setActionLoading(null)
        return
      }

      // Update balance if it's the active account
      if (account?.id === accountId) {
        const balanceResult = await onUpdateAccount({ starting_balance: parseFloat(editBalance) })
        if (!balanceResult.success) {
          setError(balanceResult.error || 'Failed to update starting balance')
          setActionLoading(null)
          return
        }
      }

      setSuccess('Account updated successfully!')
      cancelEditing()
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Delete account
  const handleDeleteAccount = async (accountId) => {
    setActionLoading(`delete-${accountId}`)
    setError(null)

    try {
      const result = await onDeleteAccount(accountId)
      
      if (result.success) {
        setSuccess('Account deleted successfully!')
        setDeleteConfirmId(null)
      } else {
        setError(result.error || 'Failed to delete account')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
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
              const isEditing = editingAccountId === acc.id
              const isDeleting = deleteConfirmId === acc.id

              return (
                <div 
                  key={acc.id}
                  className={`bg-[#0a0a0a] rounded-lg border ${
                    isActive ? 'border-[#a4fc3c]' : 'border-gray-800'
                  } overflow-hidden`}
                >
                  {/* Delete Confirmation */}
                  {isDeleting ? (
                    <div className="p-4">
                      <p className="text-sm text-gray-300 mb-4">
                        Are you sure you want to delete <span className="text-white font-semibold">{acc.name || 'Unnamed Account'}</span>? 
                        This will also delete all trades associated with this account. This action cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={actionLoading === `delete-${acc.id}`}
                          className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors text-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          disabled={actionLoading === `delete-${acc.id}`}
                          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === `delete-${acc.id}` ? (
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
                  ) : isEditing ? (
                    /* Edit Form */
                    <div className="p-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Account Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Account name"
                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] transition-colors text-sm"
                            disabled={actionLoading === `edit-${acc.id}`}
                          />
                        </div>
                        {isActive && (
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">
                              Starting Balance
                            </label>
                            <input
                              type="text"
                              value={editBalance}
                              onChange={(e) => handleBalanceInput(e.target.value, setEditBalance)}
                              placeholder="5000.00"
                              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] transition-colors text-sm"
                              disabled={actionLoading === `edit-${acc.id}`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Starting balance can only be edited for the active account.
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={cancelEditing}
                            disabled={actionLoading === `edit-${acc.id}`}
                            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-colors text-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(acc.id)}
                            disabled={actionLoading === `edit-${acc.id}`}
                            className="px-4 py-2 bg-[#a4fc3c] text-black font-semibold rounded-lg hover:bg-[#8fdd2f] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            {actionLoading === `edit-${acc.id}` ? (
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
                    </div>
                  ) : (
                    /* Normal View */
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">
                                {acc.name || 'Unnamed Account'}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 bg-[#a4fc3c]/20 text-[#a4fc3c] text-xs font-medium rounded">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              Starting: {formatCurrency(acc.starting_balance || 0)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchAccount(acc.id)}
                              disabled={actionLoading === `switch-${acc.id}`}
                              className="px-3 py-1.5 bg-[#a4fc3c] text-black font-medium rounded-lg hover:bg-[#8fdd2f] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                            >
                              {actionLoading === `switch-${acc.id}` ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  <span>Switching...</span>
                                </>
                              ) : (
                                'Switch To'
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => startEditing(acc)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#1a1a1a] hover:text-white transition-colors text-sm disabled:opacity-50"
                          >
                            Edit
                          </button>
                          {!isActive && allAccounts && allAccounts.length > 1 && (
                            <button
                              onClick={() => setDeleteConfirmId(acc.id)}
                              disabled={actionLoading !== null}
                              className="px-3 py-1.5 border border-red-900 text-red-400 rounded-lg hover:bg-red-900/20 transition-colors text-sm disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
