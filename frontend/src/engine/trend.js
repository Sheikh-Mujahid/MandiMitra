/**
 * MandiMitra AI - Price Trend & Forecasting Module
 * 
 * Requirements:
 * - From price history: 7-day change %, 30-day change %, moving average,
 *   simple linear-regression slope, volatility (std dev).
 * - trendLabel: Rising / Falling / Stable (threshold configurable).
 * - trendAdjustment: a damped near-term adjustment (cap at +/-5%) so forecasts stay conservative.
 * - confidence (0-100) computed from: number of observations, volatility, days since last update.
 *   Return the contributing factors so the UI can explain it.
 */

/**
 * Normalizes input history into an array of numeric prices [p0, p1, ... pN] (oldest to newest)
 * @param {Array} history
 * @returns {number[]}
 */
export function extractPrices(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .map((item) => {
      if (typeof item === 'number') return item;
      if (item && typeof item === 'object') {
        const val = item.modalPrice ?? item.price ?? item.value;
        return Number(val);
      }
      return NaN;
    })
    .filter((n) => !isNaN(n) && n > 0);
}

/**
 * Calculates standard deviation (volatility) of price series
 * @param {number[]} prices
 * @returns {number}
 */
export function calculateVolatility(prices) {
  if (!prices || prices.length < 2) return 0;
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (prices.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Calculates simple linear regression slope
 * @param {number[]} prices
 * @returns {number} slope per period (positive = upward trend, negative = downward)
 */
export function calculateSlope(prices) {
  const n = prices.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  return Math.round(slope * 100) / 100;
}

/**
 * Computes comprehensive price trend metrics
 * @param {Array} history - Array of numbers or { date, modalPrice }
 * @param {Object} [options]
 * @param {number} [options.daysSinceLastUpdate=0] - Days since last market data point
 * @param {number} [options.trendThreshold=1.5] - Percentage threshold for Rising/Falling
 * @returns {Object}
 */
export function analyzePriceTrend(history = [], options = {}) {
  const {
    daysSinceLastUpdate = 0,
    trendThreshold = 1.5,
    customCurrentPrice = null
  } = options;

  const rawPrices = extractPrices(history);
  const prices = customCurrentPrice && !rawPrices.includes(customCurrentPrice)
    ? [...rawPrices, Number(customCurrentPrice)]
    : rawPrices;

  const n = prices.length;
  if (n === 0) {
    return {
      currentPrice: 0,
      movingAverage7: 0,
      movingAverage30: 0,
      change7dPct: 0,
      change30dPct: 0,
      slope: 0,
      volatility: 0,
      volatilityPct: 0,
      trendLabel: 'Stable',
      trendAdjustment: 0,
      confidence: 50,
      confidenceFactors: {
        observations: 0,
        observationScore: 0,
        volatilityScore: 25,
        freshnessScore: 25,
        totalScore: 50
      }
    };
  }

  const currentPrice = prices[n - 1];

  // Moving averages
  const last7 = prices.slice(Math.max(0, n - 7));
  const movingAverage7 = Math.round((last7.reduce((s, p) => s + p, 0) / last7.length) * 100) / 100;

  const last30 = prices.slice(Math.max(0, n - 30));
  const movingAverage30 = Math.round((last30.reduce((s, p) => s + p, 0) / last30.length) * 100) / 100;

  // 7-day and 30-day percentage changes
  const price7dAgo = prices[Math.max(0, n - 8)] || prices[0];
  const change7dPct = price7dAgo > 0
    ? Math.round(((currentPrice - price7dAgo) / price7dAgo) * 10000) / 100
    : 0;

  const price30dAgo = prices[Math.max(0, n - 31)] || prices[0];
  const change30dPct = price30dAgo > 0
    ? Math.round(((currentPrice - price30dAgo) / price30dAgo) * 10000) / 100
    : 0;

  // Slope and volatility
  const slope = calculateSlope(prices);
  const volatility = calculateVolatility(prices);
  const volatilityPct = currentPrice > 0 ? Math.round((volatility / currentPrice) * 10000) / 100 : 0;

  // Trend Label (Rising / Falling / Stable)
  let trendLabel = 'Stable';
  if (change7dPct >= trendThreshold) {
    trendLabel = 'Rising';
  } else if (change7dPct <= -trendThreshold) {
    trendLabel = 'Falling';
  }

  // Damped near-term adjustment: capped at +/- 5% (+/- 0.05)
  // Uses 30% of the 7-day change rate, conservatively clamped
  const rawAdjustment = (change7dPct / 100) * 0.3;
  const trendAdjustment = Math.min(0.05, Math.max(-0.05, Math.round(rawAdjustment * 10000) / 10000));

  // Confidence (0-100)
  // Factor 1: Observation count (up to 40 pts for >= 30 days)
  const obsScore = Math.min(40, Math.round((n / 30) * 40));

  // Factor 2: Volatility penalty (up to 30 pts; deducted if volatilityPct > 3%)
  const volPenalty = Math.min(25, Math.max(0, Math.round(volatilityPct * 2.5)));
  const volScore = Math.max(5, 30 - volPenalty);

  // Factor 3: Data freshness / days since update (up to 30 pts)
  // 0 days: 30 pts, 1 day: 25 pts, 2 days: 18 pts, >= 7 days: 0 pts
  const staleDays = Math.max(0, Number(daysSinceLastUpdate) || 0);
  const freshnessScore = Math.max(0, Math.round(30 - staleDays * 5));

  const totalConfidence = Math.min(100, Math.max(10, obsScore + volScore + freshnessScore));

  return {
    currentPrice,
    movingAverage7,
    movingAverage30,
    change7dPct,
    change30dPct,
    slope,
    volatility,
    volatilityPct,
    trendLabel,
    trendAdjustment,
    confidence: totalConfidence,
    confidenceFactors: {
      observations: n,
      observationScore: obsScore,
      volatility: volatilityPct,
      volatilityScore: volScore,
      daysSinceLastUpdate: staleDays,
      freshnessScore,
      totalScore: totalConfidence
    }
  };
}
