function Sidebar({ currentView, onViewChange }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'charts', label: 'Charts', icon: '📈' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'trades', label: 'All Trades', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="w-64 bg-[#1a1a1a] text-white h-screen flex flex-col fixed left-0 top-0 border-r border-gray-800">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">🎯 TradeTracker</h1>
        <p className="text-xs text-gray-500 mt-1">Day Trading Journal</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full px-6 py-3 text-left flex items-center gap-3 transition-all ${
              currentView === item.id
                ? 'bg-[#2a2a2a] border-l-4 border-[#a4fc3c] font-semibold text-[#a4fc3c]'
                : 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 text-sm text-gray-500">
        <p>Version 1.0.0</p>
      </div>
    </div>
  )
}

export default Sidebar