import { parseISO, isSameMonth, getDay, format } from 'date-fns'

// Calculate derived fields for a trade
// These fields are calculated from the database values and not stored
export const calculateDerivedFields = (trade) => {
  const profit_loss = (trade.exit_price - trade.entry_price) * trade.shares;
  const cents_diff = trade.exit_price - trade.entry_price;
  const win_loss = profit_loss > 0 ? 'W' : 'L';

  return {
    ...trade,
    profit_loss: Number(profit_loss.toFixed(2)),
    cents_diff: Number(cents_diff.toFixed(2)),
    win_loss
  };
};

// Auto-calculate trade metrics (legacy function for compatibility)
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
  const wins = trades.filter(t => t.win_loss === 'W');
  const losses = trades.filter(t => t.win_loss === 'L');
  
  const grossWins = wins.reduce((sum, t) => sum + t.profit_loss, 0);
  const grossLosses = Math.abs(losses.reduce((sum, t) => sum + t.profit_loss, 0));
  const netPL = trades.reduce((sum, t) => sum + t.profit_loss, 0);
  
  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;
  
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const expectancy = trades.length > 0 ? netPL / trades.length : 0;
  
  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.profit_loss)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.profit_loss)) : 0;
  
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  // Setup Quality Analysis
  const setupQualities = ['A', 'B', 'C'];
  const setupStats = setupQualities.map(quality => {
  const qualityTrades = trades.filter(t => t.setup_quality === quality);
  const setupWins = qualityTrades.filter(t => t.win_loss === 'W');
    return {
      quality,
      trades: qualityTrades.length,
      winRate: qualityTrades.length > 0 ? (setupWins.length / qualityTrades.length) * 100 : 0,
      avgPL: qualityTrades.length > 0 ? qualityTrades.reduce((sum, t) => sum + t.profit_loss, 0) / qualityTrades.length : 0,
      totalPL: qualityTrades.reduce((sum, t) => sum + t.profit_loss, 0)
    };
  }).filter(s => s.trades > 0);
  
  const bestSetup = setupStats.length > 0 
    ? setupStats.reduce((best, current) => current.totalPL > best.totalPL ? current : best)
    : { quality: 'N/A', winRate: 0, avgPL: 0 };
  
  const worstSetup = setupStats.length > 0
    ? setupStats.reduce((worst, current) => current.totalPL < worst.totalPL ? current : worst)
    : { quality: 'N/A', winRate: 0, avgPL: 0 };
  
  // Strategy Analysis
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))];
  const strategyStats = strategies.map(strategy => {
    const strategyTrades = trades.filter(t => t.strategy === strategy);
    return {
      name: strategy,
      totalPL: strategyTrades.reduce((sum, t) => sum + t.profit_loss, 0),
      trades: strategyTrades.length
    };
  });
  
  const bestStrategy = strategyStats.length > 0
    ? strategyStats.reduce((best, current) => current.totalPL > best.totalPL ? current : best)
    : { name: 'N/A', totalPL: 0 };
  
  // Sector Analysis
  const sectors = [...new Set(trades.map(t => t.sector).filter(Boolean))];
  const sectorStats = sectors.map(sector => {
    const sectorTrades = trades.filter(t => t.sector === sector);
    const sectorWins = sectorTrades.filter(t => t.win_loss === 'W');
    return {
      name: sector,
      winRate: sectorTrades.length > 0 ? (sectorWins.length / sectorTrades.length) * 100 : 0,
      trades: sectorTrades.length,
      totalPL: sectorTrades.reduce((sum, t) => sum + t.profit_loss, 0)
    };
  });
  
  const bestSector = sectorStats.length > 0
    ? sectorStats.reduce((best, current) => current.winRate > best.winRate ? current : best)
    : { name: 'N/A', winRate: 0 };
  
  // Consecutive losses calculation
  let maxConsecutiveLosses = 0;
  let currentConsecutiveLosses = 0;
  trades.forEach(trade => {
    if (trade.win_loss === 'L') {
      currentConsecutiveLosses++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
    } else {
      currentConsecutiveLosses = 0;
    }
  });
  
// Current streak - consecutive days traded
let currentStreak = 0;
if (trades.length > 0) {
  const uniqueDates = [...new Set(trades.map(t => t.trade_date))].sort((a, b) =>
    new Date(b) - new Date(a)
  );

  currentStreak = 1; // At least 1 day if we have trades

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const previousDate = new Date(uniqueDates[i + 1]);

    const diffTime = currentDate - previousDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      currentStreak++;
    } else {
      break; // Streak broken
    }
  }
}
const currentStreakDisplay = trades.length > 0 ? `${currentStreak}` : '0';
  
  const currentBalance = startingBalance + netPL;
  const roi = ((netPL / startingBalance) * 100);
  
  // News vs No-News Analysis
  const newsTrades = trades.filter(t => t.news === true);
  const noNewsTrades = trades.filter(t => t.news === false);
  const newsStats = {
    trades: newsTrades.length,
    winRate: newsTrades.length > 0 ? (newsTrades.filter(t => t.win_loss === 'W').length / newsTrades.length) * 100 : 0,
    totalPL: newsTrades.reduce((sum, t) => sum + t.profit_loss, 0)
  };
  const noNewsStats = {
    trades: noNewsTrades.length,
    winRate: noNewsTrades.length > 0 ? (noNewsTrades.filter(t => t.win_loss === 'W').length / noNewsTrades.length) * 100 : 0,
    totalPL: noNewsTrades.reduce((sum, t) => sum + t.profit_loss, 0)
  };

  // Best/Worst Ticker
  const tickerMap = {};
  trades.forEach(trade => {
    if (!tickerMap[trade.ticker]) {
      tickerMap[trade.ticker] = {
        ticker: trade.ticker,
        trades: 0,
        totalPL: 0
      };
    }
    tickerMap[trade.ticker].trades++;
    tickerMap[trade.ticker].totalPL += trade.profit_loss;
  });
  const tickerStats = Object.values(tickerMap);
  const bestTicker = tickerStats.length > 0
    ? tickerStats.reduce((best, current) => current.totalPL > best.totalPL ? current : best)
    : { ticker: 'N/A', totalPL: 0, trades: 0 };
  const worstTicker = tickerStats.length > 0
    ? tickerStats.reduce((worst, current) => current.totalPL < worst.totalPL ? current : worst)
    : { ticker: 'N/A', totalPL: 0, trades: 0 };

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
    setupStats, // All setup quality stats
    bestStrategy,
    strategyStats, // All strategy stats
    bestSector,
    sectorStats, // All sector stats
    bestTicker,
    worstTicker,
    newsStats,
    noNewsStats,
    maxConsecutiveLosses,
    currentStreak: currentStreakDisplay,
    startingBalance,
    currentBalance,
    roi,
    recentTrades: [...trades].reverse().slice(0, 10) // Last 10 trades
  };
};

// Calculate calendar-specific insights
export const calculateCalendarInsights = (trades, currentMonth) => {
  
  // Filter trades for current month
  const monthTrades = trades.filter(trade => {
    const tradeDate = parseISO(trade.trade_date);
    return isSameMonth(tradeDate, currentMonth);
  });

  if (monthTrades.length === 0) {
    return {
      dayOfWeekStats: [],
      currentStreak: { type: null, days: 0 },
      bestDay: null,
      worstDay: null,
      mostActiveDay: null,
      avgPLPerDay: 0,
      tradingDays: 0
    };
  }

  // Group trades by date
  const tradesByDate = {};
  monthTrades.forEach(trade => {
    if (!tradesByDate[trade.trade_date]) {
      tradesByDate[trade.trade_date] = [];
    }
    tradesByDate[trade.trade_date].push(trade);
  });

  // Calculate day of week stats (0 = Sunday, 6 = Saturday)
  const dayOfWeekStats = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
    const dayTrades = monthTrades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date);
      return getDay(tradeDate) === dayOfWeek;
    });

    const dayPL = dayTrades.reduce((sum, t) => sum + t.profit_loss, 0);
    const wins = dayTrades.filter(t => t.profit_loss > 0).length;
    const losses = dayTrades.filter(t => t.profit_loss < 0).length;

    return {
      dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      shortName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      totalPL: dayPL,
      avgPL: dayTrades.length > 0 ? dayPL / dayTrades.length : 0,
      trades: dayTrades.length,
      wins,
      losses,
      winRate: dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0
    };
  }).filter(stat => stat.trades > 0);

  // Calculate current streak (winning or losing days)
  const sortedDates = Object.keys(tradesByDate).sort((a, b) => new Date(b) - new Date(a));
  let currentStreak = { type: null, days: 0 };
  
  if (sortedDates.length > 0) {
    let streakType = null;
    let streakDays = 0;
    
    for (const date of sortedDates) {
      const dayPL = tradesByDate[date].reduce((sum, t) => sum + t.profit_loss, 0);
      const dayType = dayPL > 0 ? 'win' : dayPL < 0 ? 'loss' : null;
      
      if (dayType && (streakType === null || streakType === dayType)) {
        streakType = dayType;
        streakDays++;
      } else if (dayType && streakType !== dayType) {
        break;
      }
    }
    
    currentStreak = { type: streakType, days: streakDays };
  }

  // Find best and worst days
  let bestDay = null;
  let worstDay = null;
  let mostActiveDay = null;
  let maxPL = -Infinity;
  let minPL = Infinity;
  let maxTrades = 0;

  Object.entries(tradesByDate).forEach(([date, dayTrades]) => {
    const dayPL = dayTrades.reduce((sum, t) => sum + t.profit_loss, 0);
    
    if (dayPL > maxPL) {
      maxPL = dayPL;
      bestDay = { date, pl: dayPL, trades: dayTrades.length };
    }
    
    if (dayPL < minPL) {
      minPL = dayPL;
      worstDay = { date, pl: dayPL, trades: dayTrades.length };
    }
    
    if (dayTrades.length > maxTrades) {
      maxTrades = dayTrades.length;
      mostActiveDay = { date, pl: dayPL, trades: dayTrades.length };
    }
  });

  // Calculate average P/L per trading day
  const tradingDays = Object.keys(tradesByDate).length;
  const totalPL = monthTrades.reduce((sum, t) => sum + t.profit_loss, 0);
  const avgPLPerDay = tradingDays > 0 ? totalPL / tradingDays : 0;

  return {
    dayOfWeekStats,
    currentStreak,
    bestDay,
    worstDay,
    mostActiveDay,
    avgPLPerDay,
    tradingDays
  };
};

// Calculate month comparison
export const compareMonths = (trades, currentMonth, previousMonth) => {
  
  const currentMonthTrades = trades.filter(trade => {
    const tradeDate = parseISO(trade.trade_date);
    return isSameMonth(tradeDate, currentMonth);
  });

  const previousMonthTrades = trades.filter(trade => {
    const tradeDate = parseISO(trade.trade_date);
    return isSameMonth(tradeDate, previousMonth);
  });

  const currentPL = currentMonthTrades.reduce((sum, t) => sum + t.profit_loss, 0);
  const previousPL = previousMonthTrades.reduce((sum, t) => sum + t.profit_loss, 0);
  const difference = currentPL - previousPL;
  const percentChange = previousPL !== 0 ? (difference / Math.abs(previousPL)) * 100 : 0;

  return {
    current: {
      pl: currentPL,
      trades: currentMonthTrades.length,
      days: new Set(currentMonthTrades.map(t => t.trade_date)).size
    },
    previous: {
      pl: previousPL,
      trades: previousMonthTrades.length,
      days: new Set(previousMonthTrades.map(t => t.trade_date)).size
    },
    difference,
    percentChange
  };
};