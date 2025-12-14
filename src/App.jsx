import { useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Charts from './components/Charts'
import Calendar from './components/Calendar'
import AllTrades from './components/AllTrades'
import Settings from './components/Settings'
import PositionCalculator from './components/PositionCalculator'
import TradeFormModal from './components/TradeFormModal'
import { useTrades, useAccount } from './hooks/useTrades'
import { STARTING_BALANCE } from './constants/tradeOptions'
import { calculateStats } from './utils/tradeCalculations'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  
  // Fetch data from Supabase
  const { 
    trades: supabaseTrades, 
    loading: tradesLoading, 
    error: tradesError, 
    refetch: refetchTrades,
    updateTrade,
    deleteTrade 
  } = useTrades()
  const { account, loading: accountLoading, error: accountError } = useAccount()

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

  // Render the appropriate view based on currentView
  const renderView = () => {
    // Show loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a4fc3c] mb-4"></div>
            <p className="text-gray-400">Loading your trading data...</p>
          </div>
        </div>
      )
    }

    // Show error state
    if (error) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
            <h3 className="text-red-400 font-semibold mb-2">Error Loading Data</h3>
            <p className="text-gray-300 text-sm mb-4">{error}</p>
            <p className="text-gray-400 text-xs">
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
        return <Settings />
      default:
        return <Dashboard trades={trades} stats={stats} />
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content Area */}
      <div className="ml-64 flex-1">
        {/* Top Header */}
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Trade Tracker</h1>
          <button 
            onClick={() => setIsTradeModalOpen(true)}
            className="bg-[#a4fc3c] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors"
          >
            + Add Trade
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