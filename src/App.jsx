import { useState, useMemo, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Charts from './components/Charts'
import Calendar from './components/Calendar'
import AllTrades from './components/AllTrades'
import Settings from './components/Settings'
import PositionCalculator from './components/PositionCalculator'
import TradeFormModal from './components/TradeFormModal'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ErrorMessage from './components/ui/ErrorMessage'
import { useTrades, useAccount } from './hooks/useTrades'
import { STARTING_BALANCE } from './constants/tradeOptions'
import { calculateStats } from './utils/tradeCalculations'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Fetch data from Supabase
  const { 
    trades: supabaseTrades, 
    loading: tradesLoading, 
    error: tradesError, 
    refetch: refetchTrades,
    updateTrade,
    deleteTrade 
  } = useTrades()
  const { account, loading: accountLoading, error: accountError, updateAccount } = useAccount()

  const loading = tradesLoading || accountLoading
  const error = tradesError || accountError

  // Use account's starting balance or fallback to constant
  const startingBalance = account?.starting_balance || STARTING_BALANCE

  // Trades already have calculated fields from the hook (profit_loss, cents_diff, win_loss)
  const trades = supabaseTrades

  // Calculate stats using Supabase data
  const stats = useMemo(() => {
    if (trades.length === 0) return null
    return calculateStats(trades, startingBalance)
  }, [trades, startingBalance])

  // Handle trade added
  const handleTradeAdded = () => {
    refetchTrades() // Refresh trades from database
  }

  // Handle view change and close sidebar on mobile
  const handleViewChange = (view) => {
    setCurrentView(view)
    setIsSidebarOpen(false) // Close sidebar on mobile when navigating
  }

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSidebarOpen])

  // Render the appropriate view based on currentView
  const renderView = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Loading your trading data..." />
          </div>
        </div>
      )
    }

    // Show error state
    if (error) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="max-w-md">
            <ErrorMessage 
              message={error}
              className="mb-4"
            />
            <p className="text-gray-400 text-xs text-center">
              Check your .env file and make sure Supabase credentials are correct.
            </p>
          </div>
        </div>
      )
    }

    // Render views with data
    switch (currentView) {
      case 'dashboard':
        return <Dashboard trades={trades} stats={stats} />
      case 'charts':
        return <Charts trades={trades} /> 
      case 'calendar':
        return <Calendar trades={trades}/>
      case 'trades':
        return <AllTrades trades={trades} onUpdate={updateTrade} onDelete={deleteTrade} />
      case 'calculator':
        return <PositionCalculator currentBalance={stats?.currentBalance || startingBalance} />
      case 'settings':
        return <Settings account={account} onUpdateAccount={updateAccount} loading={accountLoading} />
      default:
        return <Dashboard trades={trades} stats={stats} />
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="ml-0 lg:ml-64 flex-1 w-full">
        {/* Top Header */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 md:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button - visible on mobile/tablet */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-white">Trade Tracker</h1>
          </div>
          <button 
            onClick={() => setIsTradeModalOpen(true)}
            className="bg-[#a4fc3c] text-black px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors text-sm md:text-base"
          >
            <span className="hidden sm:inline">+ Add Trade</span>
            <span className="sm:hidden">+ Add</span>
          </button>
        </div>

        {/* View Content */}
        {renderView()}
      </div>

      {/* Trade Form Modal */}
      <TradeFormModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onTradeAdded={handleTradeAdded}
        accountId={account?.id}
      />
    </div>
  )
}

export default App