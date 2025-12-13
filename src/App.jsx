import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Charts from './components/Charts'
import Calendar from './components/Calendar'
import AllTrades from './components/AllTrades'
import Settings from './components/Settings'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [trades, setTrades] = useState([
    {
      id: 1,
      date: '2025-12-02',
      ticker: 'ALTY',
      long_short: 'L',
      entry_price: 14.80,
      exit_price: 15.49,
      shares: 500,
      profit_loss: 345.00,
      stop_loss: 14.50,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '2-Step',
      setup_type: '1 Minu',
      notes: 'Perfect fiber setup, held through consolidation'
    },
    {
      id: 2,
      date: '2025-12-02',
      ticker: 'TSLA',
      long_short: 'L',
      entry_price: 248.50,
      exit_price: 249.80,
      shares: 200,
      profit_loss: 260.00,
      stop_loss: 247.80,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '1-Step',
      setup_type: 'ORB',
      notes: 'Opening range breakout with volume'
    },
    {
      id: 3,
      date: '2025-12-03',
      ticker: 'NVDA',
      long_short: 'S',
      entry_price: 142.30,
      exit_price: 141.15,
      shares: 300,
      profit_loss: 345.00,
      stop_loss: 143.00,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '2-Step',
      setup_type: 'Reversal',
      notes: 'Failed breakout, strong reversal signal'
    },
    {
      id: 4,
      date: '2025-12-03',
      ticker: 'AMD',
      long_short: 'L',
      entry_price: 158.20,
      exit_price: 157.90,
      shares: 400,
      profit_loss: -120.00,
      stop_loss: 157.90,
      setup_quality: 'B',
      fiber: 'No',
      ranges: 'Choppy',
      pullback_type: 'Failed',
      setup_type: '1 Minu',
      notes: 'Stopped out - no fiber, should not have taken'
    },
    {
      id: 5,
      date: '2025-12-04',
      ticker: 'SPY',
      long_short: 'L',
      entry_price: 601.50,
      exit_price: 602.85,
      shares: 100,
      profit_loss: 135.00,
      stop_loss: 601.00,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '1-Step',
      setup_type: 'Trend',
      notes: 'Strong trend day, held for expansion'
    },
    {
      id: 6,
      date: '2025-12-05',
      ticker: 'AAPL',
      long_short: 'L',
      entry_price: 196.45,
      exit_price: 195.80,
      shares: 350,
      profit_loss: -227.50,
      stop_loss: 195.80,
      setup_quality: 'C',
      fiber: 'No',
      ranges: 'Messy',
      pullback_type: 'Failed',
      setup_type: 'Breakout',
      notes: 'Chased - violated rules, took it anyway'
    },
    {
      id: 7,
      date: '2025-12-05',
      ticker: 'GOOGL',
      long_short: 'S',
      entry_price: 176.20,
      exit_price: 175.35,
      shares: 250,
      profit_loss: 212.50,
      stop_loss: 176.80,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '2-Step',
      setup_type: 'Reversal',
      notes: 'Distribution pattern, good risk/reward'
    },
    {
      id: 8,
      date: '2025-12-06',
      ticker: 'META',
      long_short: 'L',
      entry_price: 638.10,
      exit_price: 640.50,
      shares: 80,
      profit_loss: 192.00,
      stop_loss: 637.00,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '1-Step',
      setup_type: '1 Minu',
      notes: 'Quick scalp, took profit at resistance'
    },
    {
      id: 9,
      date: '2025-12-09',
      ticker: 'MSFT',
      long_short: 'L',
      entry_price: 445.80,
      exit_price: 445.20,
      shares: 200,
      profit_loss: -120.00,
      stop_loss: 445.20,
      setup_quality: 'B',
      fiber: 'Weak',
      ranges: 'Choppy',
      pullback_type: '1-Step',
      setup_type: 'Breakout',
      notes: 'Weak fiber, should have waited for better setup'
    },
    {
      id: 10,
      date: '2025-12-09',
      ticker: 'QQQ',
      long_short: 'L',
      entry_price: 528.45,
      exit_price: 530.20,
      shares: 150,
      profit_loss: 262.50,
      stop_loss: 527.80,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '2-Step',
      setup_type: 'Trend',
      notes: 'Strong market day, followed trend'
    },
    {
      id: 11,
      date: '2025-12-10',
      ticker: 'COIN',
      long_short: 'L',
      entry_price: 292.50,
      exit_price: 294.80,
      shares: 150,
      profit_loss: 345.00,
      stop_loss: 291.50,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '2-Step',
      setup_type: 'Breakout',
      notes: 'Crypto sector strength, clean break of resistance'
    },
    {
      id: 12,
      date: '2025-12-11',
      ticker: 'HOOD',
      long_short: 'S',
      entry_price: 38.90,
      exit_price: 38.25,
      shares: 600,
      profit_loss: 390.00,
      stop_loss: 39.30,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '1-Step',
      setup_type: 'Reversal',
      notes: 'Parabolic move exhaustion, sold into strength'
    },
    {
      id: 13,
      date: '2025-12-11',
      ticker: 'PLTR',
      long_short: 'L',
      entry_price: 75.20,
      exit_price: 74.80,
      shares: 300,
      profit_loss: -120.00,
      stop_loss: 74.80,
      setup_quality: 'B',
      fiber: 'Weak',
      ranges: 'Choppy',
      pullback_type: 'Failed',
      setup_type: '1 Minu',
      notes: 'Entry too early, no confirmation'
    },
    {
      id: 14,
      date: '2025-12-12',
      ticker: 'IWM',
      long_short: 'L',
      entry_price: 234.10,
      exit_price: 235.45,
      shares: 200,
      profit_loss: 270.00,
      stop_loss: 233.50,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '2-Step',
      setup_type: 'ORB',
      notes: 'Small caps showing strength, good follow-through'
    },
    {
      id: 15,
      date: '2025-12-13',
      ticker: 'DIA',
      long_short: 'L',
      entry_price: 448.20,
      exit_price: 449.35,
      shares: 125,
      profit_loss: 143.75,
      stop_loss: 447.50,
      setup_quality: 'A',
      fiber: 'Yes',
      ranges: 'Clean',
      pullback_type: '1-Step',
      setup_type: 'Trend',
      notes: 'Dow leading, clean pullback to support'
    }
  ])

  const stats = {
    startingBal: 5000.00,
    currentBal: 5000 + trades.reduce((sum, t) => sum + t.profit_loss, 0),
    profitLoss: trades.reduce((sum, t) => sum + t.profit_loss, 0),
    wins: trades.filter(t => t.profit_loss > 0).length,
    losses: trades.filter(t => t.profit_loss < 0).length,
    winRate: (trades.filter(t => t.profit_loss > 0).length / trades.length) * 100,
  }

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