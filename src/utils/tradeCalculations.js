// Auto-calculate trade metrics
export const calculateTradeMetrics = (bought, sold, shares) => {
  const centsDiff = sold - bought;
  const profitLoss = centsDiff * shares;
  const winLoss = profitLoss >= 0 ? 'W' : 'L';
  
  return {
    profitLoss: Number(profitLoss.toFixed(2)),
    centsDiff: Number(centsDiff.toFixed(2)),
    winLoss
  };
};

// Calculate dashboard statistics
export const calculateStats = (trades, startingBalance) => {
  const wins = trades.filter(t => t.winLoss === 'W');
  const losses = trades.filter(t => t.winLoss === 'L');
  
  const grossWins = wins.reduce((sum, t) => sum + t.profitLoss, 0);
  const grossLosses = Math.abs(losses.reduce((sum, t) => sum + t.profitLoss, 0));
  const netPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
  
  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;
  
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const expectancy = trades.length > 0 ? netPL / trades.length : 0;
  
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.profitLoss)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.profitLoss)) : 0;
  
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  // Setup Quality Analysis
  const setupQualities = ['A', 'B', 'C'];
  const setupStats = setupQualities.map(quality => {
    const qualityTrades = trades.filter(t => t.setupQuality === quality);
    const setupWins = qualityTrades.filter(t => t.winLoss === 'W');
    return {
      quality,
      trades: qualityTrades.length,
      winRate: qualityTrades.length > 0 ? (setupWins.length / qualityTrades.length) * 100 : 0,
      avgPL: qualityTrades.length > 0 ? qualityTrades.reduce((sum, t) => sum + t.profitLoss, 0) / qualityTrades.length : 0,
      totalPL: qualityTrades.reduce((sum, t) => sum + t.profitLoss, 0)
    };
  }).filter(s => s.trades > 0);
  
  const bestSetup = setupStats.length > 0 
    ? setupStats.reduce((best, current) => current.totalPL > best.totalPL ? current : best)
    : { quality: 'N/A', winRate: 0, avgPL: 0 };
  
  const worstSetup = setupStats.length > 0
    ? setupStats.reduce((worst, current) => current.totalPL < worst.totalPL ? current : worst)
    : { quality: 'N/A', winRate: 0, avgPL: 0 };
  
  // Strategy Analysis
  const strategies = [...new Set(trades.map(t => t.strategy))];
  const strategyStats = strategies.map(strategy => {
    const strategyTrades = trades.filter(t => t.strategy === strategy);
    return {
      name: strategy,
      totalPL: strategyTrades.reduce((sum, t) => sum + t.profitLoss, 0),
      trades: strategyTrades.length
    };
  });
  
  const bestStrategy = strategyStats.length > 0
    ? strategyStats.reduce((best, current) => current.totalPL > best.totalPL ? current : best)
    : { name: 'N/A', totalPL: 0 };
  
  // Sector Analysis
  const sectors = [...new Set(trades.map(t => t.sector))];
  const sectorStats = sectors.map(sector => {
    const sectorTrades = trades.filter(t => t.sector === sector);
    const sectorWins = sectorTrades.filter(t => t.winLoss === 'W');
    return {
      name: sector,
      winRate: sectorTrades.length > 0 ? (sectorWins.length / sectorTrades.length) * 100 : 0,
      trades: sectorTrades.length
    };
  });
  
  const bestSector = sectorStats.length > 0
    ? sectorStats.reduce((best, current) => current.winRate > best.winRate ? current : best)
    : { name: 'N/A', winRate: 0 };
  
  // Consecutive losses calculation
  let maxConsecutiveLosses = 0;
  let currentConsecutiveLosses = 0;
  trades.forEach(trade => {
    if (trade.winLoss === 'L') {
      currentConsecutiveLosses++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
    } else {
      currentConsecutiveLosses = 0;
    }
  });
  
  // Current streak
  let currentStreak = 0;
  let streakType = '';
  if (trades.length > 0) {
    for (let i = trades.length - 1; i >= 0; i--) {
      if (i === trades.length - 1) {
        streakType = trades[i].winLoss;
        currentStreak = 1;
      } else if (trades[i].winLoss === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  const currentStreakDisplay = trades.length > 0 ? `${currentStreak}${streakType}` : '0';
  
  const currentBalance = startingBalance + netPL;
  const roi = ((netPL / startingBalance) * 100);
  
  return {
    netPL,
    grossWins,
    grossLosses,
    profitFactor,
    winRate,
    totalTrades: trades.length,
    expectancy,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    totalWins: wins.length,
    totalLosses: losses.length,
    riskRewardRatio,
    bestSetup,
    worstSetup,
    bestStrategy,
    bestSector,
    maxConsecutiveLosses,
    currentStreak: currentStreakDisplay,
    startingBalance,
    currentBalance,
    roi,
    recentTrades: [...trades].reverse().slice(0, 10) // Last 10 trades
  };
};