import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function AccountActionsMenu({ 
  account, 
  isActive, 
  allAccounts,
  onEdit, 
  onResetBalance, 
  onDelete,
  disabled 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: buttonRect.bottom + window.scrollY + 4, // 4px = mt-1 equivalent
        right: window.innerWidth - buttonRect.right + window.scrollX
      })
    }
  }, [isOpen])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleEdit = () => {
    setIsOpen(false)
    onEdit(account)
  }

  const handleResetBalance = () => {
    setIsOpen(false)
    onResetBalance(account)
  }

  const handleDelete = () => {
    setIsOpen(false)
    onDelete(account)
  }

  const canDelete = !isActive && allAccounts && allAccounts.length > 1

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Account actions"
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-xl z-[100] overflow-hidden"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={handleEdit}
              disabled={disabled}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            <button
              onClick={handleResetBalance}
              disabled={disabled}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Balance
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={disabled}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#1a1a1a] hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default AccountActionsMenu
