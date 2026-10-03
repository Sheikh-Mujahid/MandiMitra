/**
 * MandiMitra AI - Core Recommendation Engine
 * 
 * Central entry point uniting:
 * - transport.js (vehicle sizing, cost, recommendations)
 * - trend.js (price moving averages, slope, volatility, damped adjustment, confidence)
 * - netReturn.js (core formula, deductions, cost breakdown)
 * - rank.js (stage 1 filtering, stage 2 risk-adjusted ranking, margins)
 * - explain.js (structured decision reasons and trilingual explanations)
 * - extras.js (break-even extra distance, sell now vs wait analysis)
 * 
 * CORE FORMULA:
 * expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
 * revenue = expectedPrice * quantity
 * transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
 * netReturn = revenue - transport - loading - marketFee - commission - wastage - storage
 * 
 * ENGINE INTERFACE:
 * rankMarkets({crop, quantity, location, vehicle, ratePerKm, priceAdjust, roundTrip, extraCosts})
 *   -> [{market, price, expectedPrice, distanceKm, transport, otherCosts, netReturn, trend, confidence, dataAgeDays, rank}]
 */

export * from './transport.js';
export * from './trend.js';
export * from './netReturn.js';
export * from './rank.js';
export * from './explain.js';
export * from './extras.js';

// Re-export VEHICLE_CONFIGS for backwards compatibility with any existing components
export { VEHICLE_PRESETS as VEHICLE_CONFIGS } from './transport.js';

import { rankMarkets as rankMarketsInternal } from './rank.js';
import { determineVehicles as determineVehiclesInternal } from './transport.js';

// Default export
export default {
  rankMarkets: rankMarketsInternal,
  determineVehicles: determineVehiclesInternal
};
