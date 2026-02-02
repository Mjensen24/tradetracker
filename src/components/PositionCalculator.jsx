import { useState } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

function PositionCalculator({ currentBalance }) {
  const [entryPrice, setEntryPrice] = useState('');
  const [stopPercent, setStopPercent] = useState('2'); // Default 2% stop loss
  const [useLeverage, setUseLeverage] = useState(false);
  const [leverage, setLeverage] = useState(4); // Default to 4x when enabled

  const calculatePosition = () => {
    if (!entryPrice || entryPrice <= 0) return null;

    // Ensure currentBalance is a valid number
    const balance = Number(currentBalance) || 0;
    const price = parseFloat(entryPrice);
    const stopPct = parseFloat(stopPercent) / 100;

    // Calculate effective buying power (with leverage if enabled)
    const effectiveBuyingPower = useLeverage ? balance * leverage : balance;

    // Calculate maximum shares that fit within balance (position value <= balance)
    const maxSharesExact = effectiveBuyingPower / price;
    const maxSharesFloor = Math.floor(maxSharesExact);
    const exactPositionValue = maxSharesFloor * price;
    
    // Note: 250-share increment will be calculated from maxSharesFloor when needed
    
    // Check if exact max shares uses exactly 100% of balance (within 1 cent tolerance)
    const difference = effectiveBuyingPower - exactPositionValue;
    const uses100Percent = difference >= 0 && difference < 0.01;
    
    // Determine shares: use exact 100% if possible, otherwise use max 250-share increment
    let shares;
    if (uses100Percent) {
      // Can use exactly 100% of balance - use the exact amount (any number of shares)
      shares = maxSharesFloor;
    } else {
      // CANNOT use exactly 100% - MUST use 250-share increments
      // Round down maxSharesFloor to the nearest 250-share increment
      shares = Math.floor(maxSharesFloor / 250) * 250;
      
      // Verify this fits within balance (should always be true, but safety check)
      if (shares * price > effectiveBuyingPower) {
        // Reduce by 250 shares until it fits
        shares = Math.max(0, shares - 250);
      }
    }
    
    // Final verification: ensure position value doesn't exceed balance
    const finalPositionValue = shares * price;
    if (finalPositionValue > effectiveBuyingPower + 0.01) {
      // Reduce by 250 shares until it fits
      while (shares > 0 && shares * price > effectiveBuyingPower) {
        shares -= 250;
      }
    }

    // Calculate stop loss price (entry - X%)
    const stopLoss = price * (1 - stopPct);

    // Calculate profit target (entry + 2X%) for 1:2 ratio
    const profitTarget = price * (1 + (stopPct * 2));

    // Calculate dollar amounts
    const riskPerShare = price - stopLoss;
    const rewardPerShare = profitTarget - price;
    const totalRisk = riskPerShare * shares;
    const totalReward = rewardPerShare * shares;

    return {
      shares,
      stopLoss,
      profitTarget,
      totalRisk,
      totalReward,
      riskPerShare,
      rewardPerShare,
      effectiveBuyingPower
    };
  };

  const position = calculatePosition();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-white">Position Calculator</h1>

        {/* Account Balance Card */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-white">Account Balance</h2>
          <div className="space-y-2">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-[#a4fc3c]">
                {formatCurrency(Number(currentBalance) || 0)}
              </p>
              <p className="text-xs md:text-sm font-medium text-gray-400 mt-1">Actual Balance</p>
            </div>
            {useLeverage && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">
                  {formatCurrency((Number(currentBalance) || 0) * leverage)}
                </p>
                <p className="text-xs md:text-sm font-medium text-yellow-400/70 mt-1">
                  Leveraged Buying Power ({leverage}x)
                </p>
                <div className="mt-2 px-3 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-md">
                  <p className="text-xs text-yellow-400/90">
                    ⚠️ Leverage amplifies both gains and losses. Higher risk exposure.
                  </p>
                </div>
              </div>
            )}
            {!useLeverage && (
              <p className="text-xs md:text-sm font-medium text-gray-400 mt-1">Available Buying Power (100%)</p>
            )}
          </div>
        </div>

        {/* Entry Details Card */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Entry Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Entry Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Stop Loss Distance (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={stopPercent}
                onChange={(e) => setStopPercent(e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c]"
                placeholder="2.0"
              />
            </div>
          </div>

          {/* Leverage Controls */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Enable Leverage
                </label>
                <p className="text-xs text-gray-400">
                  Multiply your buying power to increase position size
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUseLeverage(!useLeverage)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:ring-offset-2 focus:ring-offset-[#1a1a1a] ${
                  useLeverage ? 'bg-[#a4fc3c]' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useLeverage ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {useLeverage && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Leverage Multiplier
                </label>
                <div className="flex gap-2">
                  {[4, 5, 6].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setLeverage(mult)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                        leverage === mult
                          ? 'bg-[#a4fc3c] text-black'
                          : 'bg-[#0a0a0a] border border-gray-700 text-white hover:border-[#a4fc3c]'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {position && (
          <>
            {/* Position Size Card */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-2 text-white">Position Size</h2>
              <p className="text-3xl md:text-4xl font-bold text-[#a4fc3c]">
                {formatNumber(position.shares)} shares
              </p>
              <p className="text-xs md:text-sm font-medium text-gray-400 mt-1">
                Total Value: {formatCurrency(position.shares * parseFloat(entryPrice))}
              </p>
            </div>

            {/* Risk/Reward Card */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-white">Risk/Reward Levels (1:2 Ratio)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Stop Loss */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 md:p-4 border-l-4 border-red-500">
                  <p className="text-xs md:text-sm font-medium text-gray-400 mb-2">Stop Loss</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-500 mb-3 md:mb-4">
                    {formatCurrency(position.stopLoss)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Risk per share:</span>
                      <span className="text-sm font-semibold text-red-500">
                        {formatCurrency(position.riskPerShare)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Risk:</span>
                      <span className="text-sm font-semibold text-red-500">
                        {formatCurrency(position.totalRisk)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-sm text-gray-400">Risk % of Account:</span>
                      <span className="text-sm font-semibold text-white">
                        {formatPercent((position.totalRisk / (Number(currentBalance) || 1)) * 100, 2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profit Target */}
                <div className="bg-[#0a0a0a] rounded-lg p-3 md:p-4 border-l-4 border-[#a4fc3c]">
                  <p className="text-xs md:text-sm font-medium text-gray-400 mb-2">Profit Target</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#a4fc3c] mb-3 md:mb-4">
                    {formatCurrency(position.profitTarget)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Reward per share:</span>
                      <span className="text-sm font-semibold text-[#a4fc3c]">
                        {formatCurrency(position.rewardPerShare)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Reward:</span>
                      <span className="text-sm font-semibold text-[#a4fc3c]">
                        {formatCurrency(position.totalReward)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-sm text-gray-400">Reward % of Account:</span>
                      <span className="text-sm font-semibold text-white">
                        {formatPercent((position.totalReward / currentBalance) * 100, 2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-[#0a0a0a] rounded-md border border-gray-800">
                <p className="text-xs md:text-sm text-gray-300">
                  <span className="font-semibold text-white">Risk/Reward Ratio:</span> 1:2 
                  <span className="text-gray-400"> (Risking {formatCurrency(position.totalRisk)} to make {formatCurrency(position.totalReward)})</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PositionCalculator;