/**
 * MandiMitra AI - Decision Extras Module
 * 
 * Requirements:
 * - breakEvenExtraDistance(baseMarket, otherMarket, ...) for additional distance
 *   versus the baseline market, accounting for vehicle step costs.
 * - sellNowVsWait(...) returning low/expected/high scenarios from historical volatility,
 *   labeled as an estimate.
 */

import { calculateVehiclesNeeded, VEHICLE_PRESETS } from './transport.js';
import { calculateVolatility, extractPrices } from './trend.js';

/**
 * Calculates how much additional distance a farmer can travel to another market
 * before the price advantage is completely wiped out by extra transport costs.
 * 
 * @param {Object} baseMarket - Baseline (e.g. nearest) market object with price & distance
 * @param {Object} otherMarket - Target competitor market with higher price
 * @param {Object} options
 * @param {number} options.quantity - Quantity in quintals
 * @param {string} [options.vehicleType='pickup'] - Vehicle type id
 * @param {number} [options.ratePerKm] - Rate per km
 * @param {boolean} [options.roundTrip=false] - Whether transport is round trip
 * @param {Object} [options.extraCosts={}] - Handling/fee overrides
 * @returns {Object}
 */
export function breakEvenExtraDistance(baseMarket, otherMarket, {
  quantity = 30,
  vehicleType = 'pickup',
  ratePerKm = null,
  roundTrip = false,
  extraCosts = {}
} = {}) {
  const qty = Math.max(0.1, Number(quantity) || 0.1);
  const preset = VEHICLE_PRESETS[vehicleType] || VEHICLE_PRESETS.pickup;
  const vehiclesNeeded = calculateVehiclesNeeded(qty, preset.capacity);
  const effectiveRate = (ratePerKm !== null && ratePerKm !== undefined && Number(ratePerKm) > 0)
    ? Number(ratePerKm)
    : preset.ratePerKm;
  const tripMultiplier = roundTrip ? 2 : 1;

  const transportPerKm = vehiclesNeeded * effectiveRate * tripMultiplier;

  const basePrice = Number(baseMarket.expectedPrice ?? baseMarket.price ?? baseMarket.modalPrice ?? 0);
  const otherPrice = Number(otherMarket.expectedPrice ?? otherMarket.price ?? otherMarket.modalPrice ?? 0);

  // Revenue difference
  const grossDiff = (otherPrice - basePrice) * qty;

  // If other market price is lower or equal, no break-even distance advantage exists
  if (grossDiff <= 0 || transportPerKm <= 0) {
    return {
      breakEvenExtraDistanceKm: 0,
      transportCostPerKm: transportPerKm,
      vehiclesNeeded,
      grossAdvantageRs: Math.max(0, grossDiff),
      canJustifyExtraDistance: false,
      explanation: 'Target market does not offer a price premium over base market.'
    };
  }

  // Account for market fee differential if available
  const baseFeePercent = Number(baseMarket.marketFeePercent ?? 1.0);
  const otherFeePercent = Number(otherMarket.marketFeePercent ?? 1.0);
  const feeDiff = ((otherPrice * qty * otherFeePercent) - (basePrice * qty * baseFeePercent)) / 100;

  const netAdvantageBeforeTransport = Math.max(0, grossDiff - feeDiff);
  const breakEvenExtraKm = Math.round((netAdvantageBeforeTransport / transportPerKm) * 10) / 10;

  return {
    breakEvenExtraDistanceKm: breakEvenExtraKm,
    transportCostPerKm: Math.round(transportPerKm * 100) / 100,
    vehiclesNeeded,
    grossAdvantageRs: Math.round(grossDiff),
    netAdvantageBeforeTransport: Math.round(netAdvantageBeforeTransport),
    canJustifyExtraDistance: breakEvenExtraKm > 0,
    explanation: `You can travel up to ${breakEvenExtraKm} km further to ${otherMarket.name || 'target market'} before the ₹${Math.round(grossDiff).toLocaleString('en-IN')} price gain is fully absorbed by transport freight.`
  };
}

/**
 * Analyzes whether to sell harvest now or wait/hold based on historical volatility and storage costs
 * 
 * @param {Object} params
 * @param {number} params.currentPrice - Current modal price (Rs/quintal)
 * @param {Array} [params.history=[]] - Historical price array
 * @param {number} [params.holdingDays=7] - Number of days to hold
 * @param {number} [params.storageCostPerDay=0.25] - Storage cost per quintal per day
 * @param {number} [params.quantity=50] - Harvest quantity in quintals
 * @param {number} [params.trendAdjustment=0] - Damped trend factor
 * @returns {Object} Scenarios labeled as estimate
 */
export function sellNowVsWait({
  currentPrice,
  history = [],
  holdingDays = 7,
  storageCostPerDay = 0.25,
  quantity = 50,
  trendAdjustment = 0
} = {}) {
  const pNow = Math.max(1, Number(currentPrice) || 1000);
  const days = Math.max(1, Number(holdingDays) || 7);
  const qty = Math.max(0.1, Number(quantity) || 0.1);
  const storagePerQntlDay = Math.max(0, Number(storageCostPerDay) || 0.25);

  const prices = extractPrices(history);
  const volatility = calculateVolatility(prices);
  const dailyVol = prices.length >= 2 ? volatility / Math.sqrt(7) : pNow * 0.015;

  // Expected price shift from trend over holding period
  const trendShift = pNow * (Number(trendAdjustment) || 0) * (days / 7);
  const expectedFuturePrice = Math.round((pNow + trendShift) * 100) / 100;

  // Multi-day volatility band (sqrt of time scaling)
  const band = Math.round(dailyVol * Math.sqrt(days) * 1.645 * 100) / 100; // 90% confidence band

  const lowPrice = Math.max(0, Math.round((expectedFuturePrice - band) * 100) / 100);
  const highPrice = Math.round((expectedFuturePrice + band) * 100) / 100;

  // Storage cost
  const totalStorageCost = Math.round(storagePerQntlDay * days * qty * 100) / 100;
  const storagePerQntl = Math.round(storagePerQntlDay * days * 100) / 100;

  // Returns
  const sellNowGross = Math.round(pNow * qty * 100) / 100;
  const waitExpectedGross = Math.round(expectedFuturePrice * qty * 100) / 100;
  const waitExpectedNet = Math.round((waitExpectedGross - totalStorageCost) * 100) / 100;

  const waitLowNet = Math.round((lowPrice * qty - totalStorageCost) * 100) / 100;
  const waitHighNet = Math.round((highPrice * qty - totalStorageCost) * 100) / 100;

  const netGainExpected = Math.round((waitExpectedNet - sellNowGross) * 100) / 100;

  let recommendation = 'SELL_NOW';
  let advice = '';

  if (netGainExpected > totalStorageCost * 1.5) {
    recommendation = 'HOLD_AND_WAIT';
    advice = `Holding for ${days} days is projected to deliver +₹${netGainExpected.toLocaleString('en-IN')} net gain after paying ₹${totalStorageCost.toLocaleString('en-IN')} storage. (Estimate, not guaranteed)`;
  } else if (netGainExpected < -totalStorageCost * 0.5) {
    recommendation = 'SELL_NOW';
    advice = `Selling immediately is advised. Holding for ${days} days risks a projected drop of ₹${Math.abs(netGainExpected).toLocaleString('en-IN')} plus ₹${totalStorageCost.toLocaleString('en-IN')} storage cost. (Estimate, not guaranteed)`;
  } else {
    recommendation = 'SELL_NOW_NEUTRAL';
    advice = `Projected price gain of ₹${netGainExpected.toLocaleString('en-IN')} is too slim to justify ₹${totalStorageCost.toLocaleString('en-IN')} storage and downside price volatility. Selling now avoids market risk. (Estimate, not guaranteed)`;
  }

  return {
    disclaimer: 'Estimate, not guaranteed. Based on historical price volatility and daily official mandi modal records.',
    holdingDays: days,
    currentPrice: pNow,
    sellNowGross,
    totalStorageCost,
    storagePerQntl,
    scenarios: {
      low: {
        pricePerQntl: lowPrice,
        netReturn: waitLowNet,
        gainLossVsNow: Math.round((waitLowNet - sellNowGross) * 100) / 100
      },
      expected: {
        pricePerQntl: expectedFuturePrice,
        netReturn: waitExpectedNet,
        gainLossVsNow: netGainExpected
      },
      high: {
        pricePerQntl: highPrice,
        netReturn: waitHighNet,
        gainLossVsNow: Math.round((waitHighNet - sellNowGross) * 100) / 100
      }
    },
    recommendation,
    advice
  };
}
