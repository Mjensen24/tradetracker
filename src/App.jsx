import { useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Charts from './components/Charts'
import Calendar from './components/Calendar'
import AllTrades from './components/AllTrades'
import Settings from './components/Settings'
import PositionCalculator from './components/PositionCalculator'
import { mockTrades } from './data/mockTrades'
import { STARTING_BALANCE } from './constants/tradeOptions'
import { calculateStats, calculateDerivedFields } from './utils/tradeCalculations'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  // Calculate derived fields (profit_loss, cents_diff, win_loss) for all trades
  const trades = useMemo(() => {
    return mockTrades.map(trade => calculateDerivedFields(trade))
  }, [])

  const stats = calculateStats(trades, STARTING_BALANCE)


  // Render the appropriate view based on currentView
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard trades={trades} stats={stats} />
      case 'charts':
        return <Charts trades={trades} /> 
      case 'calendar':
        return <Calendar trades={trades}/>
      case 'trades':
        return <AllTrades trades={trades} />
      case 'calculator':
        return <PositionCalculator currentBalance={stats.currentBalance} />
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
          <button className="bg-[#a4fc3c] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#8fdd2f] transition-colors">
            + Add Trade
          </button>
        </div>

        {/* View Content */}
        {renderView()}
      </div>
    </div>
  )
}

export default App