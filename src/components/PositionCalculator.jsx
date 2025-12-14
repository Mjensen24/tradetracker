import { useState } from 'react';

function PositionCalculator({ currentBalance }) {
  const [entryPrice, setEntryPrice] = useState('');
  const [stopPercent, setStopPercent] = useState('2'); // Default 2% stop loss

  const calculatePosition = () => {
    if (!entryPrice || entryPrice <= 0) return null;

    const price = parseFloat(entryPrice);
    const stopPct = parseFloat(stopPercent) / 100;

    // Calculate shares with 100% buying power and round down to nearest 250
    const maxShares = Math.floor(currentBalance / price);
    const shares = Math.floor(maxShares / 250) * 250;

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
      rewardPerShare
    };
  };

  const position = calculatePosition();

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Position Calculator</h1>

        {/* Account Balance Card */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-400">Account Balance</h2>
          <p className="text-4xl font-bold text-[#a4fc3c]">
            ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Available Buying Power (100%)</p>
        </div>

        {/* Entry Details Card */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Entry Details</h2>
          
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
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-[#a4fc3c] focus:border-transparent"
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
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-[#a4fc3c] focus:border-transparent"
                placeholder="2.0"
              />
            </div>
          </div>
        </div>

        {position && (
          <>
            {/* Position Size Card */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-400">Position Size</h2>
              <p className="text-4xl font-bold text-[#a4fc3c]">
                {position.shares.toLocaleString()} shares
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Total Value: ${(position.shares * parseFloat(entryPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Risk/Reward Card */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-6 text-white">Risk/Reward Levels (1:2 Ratio)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stop Loss */}
                <div className="bg-[#0a0a0a] rounded-lg p-5 border-l-4 border-red-500">
                  <p className="text-sm font-medium text-gray-400 mb-2">Stop Loss</p>
                  <p className="text-3xl font-bold text-red-500 mb-4">
                    ${position.stopLoss.toFixed(2)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Risk per share:</span>
                      <span className="text-sm font-semibold text-red-500">
                        ${position.riskPerShare.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Risk:</span>
                      <span className="text-sm font-semibold text-red-500">
                        ${position.totalRisk.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-sm text-gray-400">Risk % of Account:</span>
                      <span className="text-sm font-semibold text-white">
                        {((position.totalRisk / currentBalance) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profit Target */}
                <div className="bg-[#0a0a0a] rounded-lg p-5 border-l-4 border-[#a4fc3c]">
                  <p className="text-sm font-medium text-gray-400 mb-2">Profit Target</p>
                  <p className="text-3xl font-bold text-[#a4fc3c] mb-4">
                    ${position.profitTarget.toFixed(2)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Reward per share:</span>
                      <span className="text-sm font-semibold text-[#a4fc3c]">
                        ${position.rewardPerShare.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Reward:</span>
                      <span className="text-sm font-semibold text-[#a4fc3c]">
                        ${position.totalReward.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-sm text-gray-400">Reward % of Account:</span>
                      <span className="text-sm font-semibold text-white">
                        {((position.totalReward / currentBalance) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-[#0a0a0a] rounded-md border border-gray-800">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Risk/Reward Ratio:</span> 1:2 
                  <span className="text-gray-500"> (Risking ${position.totalRisk.toFixed(2)} to make ${position.totalReward.toFixed(2)})</span>
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