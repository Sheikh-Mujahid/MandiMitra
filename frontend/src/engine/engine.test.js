import { describe, it, expect } from 'vitest';
import {
  rankMarkets,
  calculateVehiclesNeeded,
  calculateTransportCost,
  recommendVehicle,
  analyzePriceTrend,
  calculateVolatility,
  calculateSlope,
  calculateNetReturn,
  breakEvenExtraDistance,
  sellNowVsWait,
  explainRecommendation,
  VEHICLE_PRESETS
} from './engine.js';

describe('MandiMitra Recommendation Engine Unit Tests', () => {
  // Mock APMC markets: Local (near, modest price) vs Terminal (distant, higher modal price)
  const mockMarkets = [
    {
      id: 'local_mandi',
      market_id: 'local_mandi',
      name: 'Local APMC Yard',
      state: 'Maharashtra',
      district: 'Amravati',
      lat: 21.0,
      lon: 77.8,
      marketFeePercent: 1.0,
      commissionPercent: 0.0,
      weighmentPerQntl: 5.0,
      loadingPerQntl: 10.0
    },
    {
      id: 'distant_metro_mandi',
      market_id: 'distant_metro_mandi',
      name: 'Distant Metro Terminal',
      state: 'Maharashtra',
      district: 'Nagpur',
      lat: 21.15,
      lon: 79.1,
      marketFeePercent: 1.0,
      commissionPercent: 0.0,
      weighmentPerQntl: 5.0,
      loadingPerQntl: 10.0
    },
    {
      id: 'stale_mandi',
      market_id: 'stale_mandi',
      name: 'Stale APMC Yard',
      state: 'Maharashtra',
      district: 'Yavatmal',
      lat: 20.4,
      lon: 78.1,
      marketFeePercent: 1.0,
      commissionPercent: 0.0,
      weighmentPerQntl: 5.0,
      loadingPerQntl: 10.0
    }
  ];

  const mockPrices = {
    crops: [{ id: 'soybean', name: 'Soybean', spoilageFactor: 0.0 }],
    marketPrices: {
      soybean: [
        {
          marketId: 'local_mandi',
          modalPrice: 4600, // Lower price
          trendAdjustment: 0.0,
          confidence: 95,
          dataAgeDays: 0,
          trend: 'STABLE',
          history: [4550, 4580, 4600, 4590, 4600]
        },
        {
          marketId: 'distant_metro_mandi',
          modalPrice: 4800, // Higher price (+Rs 200/q)
          trendAdjustment: 0.0,
          confidence: 90,
          dataAgeDays: 0,
          trend: 'UP',
          history: [4650, 4700, 4750, 4780, 4800]
        },
        {
          marketId: 'stale_mandi',
          modalPrice: 5000,
          trendAdjustment: 0.0,
          confidence: 40,
          dataAgeDays: 14, // 14 days stale! Should be excluded by Stage 1 filter (max 7 days)
          trend: 'STABLE',
          history: [5000]
        }
      ]
    }
  };

  const mockDistances = {
    roadWindingFactor: 1.28,
    farmerOrigins: [
      {
        id: 'farm_origin',
        lat: 21.05,
        lon: 77.85,
        distancesKm: {
          local_mandi: 15,
          distant_metro_mandi: 160,
          stale_mandi: 80
        }
      }
    ]
  };

  // 1. Vehicle step function
  it('implements vehicle step function: vehiclesNeeded = ceil(quantity / capacity)', () => {
    // Pickup capacity is 20 q
    expect(calculateVehiclesNeeded(10, 20)).toBe(1);
    expect(calculateVehiclesNeeded(20, 20)).toBe(1);
    expect(calculateVehiclesNeeded(21, 20)).toBe(2);
    expect(calculateVehiclesNeeded(40, 20)).toBe(2);
    expect(calculateVehiclesNeeded(41, 20)).toBe(3);

    // Tractor capacity is 40 q
    expect(calculateVehiclesNeeded(40, 40)).toBe(1);
    expect(calculateVehiclesNeeded(41, 40)).toBe(2);

    // Truck capacity is 100 q
    expect(calculateVehiclesNeeded(100, 100)).toBe(1);
    expect(calculateVehiclesNeeded(105, 100)).toBe(2);
  });

  // 2. Recommend cheapest vehicle
  it('recommendVehicle picks the cheapest vehicle type for the given load', () => {
    // For 15 quintals, Pickup is cheapest
    const rec15 = recommendVehicle(15, 50);
    expect(rec15.vehicleType).toBe('pickup');

    // For 80 quintals, 2 Tractors (2 * 50km * 25 = 2500) vs 1 Truck (1 * 50km * 35 = 1750)
    // Truck is cheaper than multiple tractors/pickups
    const rec80 = recommendVehicle(80, 50);
    expect(rec80.vehicleType).toBe('truck');
    expect(rec80.cost).toBe(1750);
  });

  // 3. Round-trip toggle
  it('round-trip toggle doubles the transport cost exactly', () => {
    const oneWay = calculateTransportCost({
      quantity: 20,
      distanceKm: 50,
      vehicleType: 'pickup',
      ratePerKm: 18,
      roundTrip: false
    });
    // 1 vehicle * 50 km * 18 = 900
    expect(oneWay.cost).toBe(900);

    const roundTrip = calculateTransportCost({
      quantity: 20,
      distanceKm: 50,
      vehicleType: 'pickup',
      ratePerKm: 18,
      roundTrip: true
    });
    // 1 vehicle * 50 km * 18 * 2 = 1800
    expect(roundTrip.cost).toBe(1800);
    expect(roundTrip.cost).toBe(oneWay.cost * 2);
  });

  // 4. Test fixture where highest-price market loses to a nearer one
  it('proves core problem: highest-price market loses to a nearer one due to transport freight', () => {
    // 20 quintals transported via pickup (1 vehicle)
    // Local: 4600 price, 15 km, transport = 1 * 15 * 18 = 270. Revenue = 92,000.
    // Distant: 4800 price (+200 premium), 160 km, transport = 1 * 160 * 18 = 2,880. Extra transport = 2,610.
    // Price gain is 20 q * 200 = 4,000. If round trip is true: transport = 5,760, which wipes out the gain!
    const results = rankMarkets({
      crop: 'soybean',
      quantity: 20,
      location: 'farm_origin',
      vehicle: 'pickup',
      ratePerKm: 18,
      roundTrip: true, // Round trip haulage
      extraCosts: { spoilageFactor: 0 },
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });

    const local = results.find((r) => r.marketId === 'local_mandi');
    const distant = results.find((r) => r.marketId === 'distant_metro_mandi');

    expect(distant.modalPrice).toBeGreaterThan(local.modalPrice);
    expect(local.netReturn).toBeGreaterThan(distant.netReturn);
    expect(local.rank).toBe(1);
    expect(results.isHighestPriceNotRankOne).toBe(true);
  });

  // 5. Quantity change flipping the ranking
  it('quantity change flips the ranking: small batch prefers local, large batch absorbs freight and prefers terminal', () => {
    // At 15 quintals, local wins because distant transport eats the margin
    const smallBatch = rankMarkets({
      crop: 'soybean',
      quantity: 15,
      location: 'farm_origin',
      vehicle: 'pickup',
      ratePerKm: 20,
      roundTrip: true,
      extraCosts: { spoilageFactor: 0 },
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });
    expect(smallBatch[0].marketId).toBe('local_mandi');

    // At 100 quintals (truckload), the Rs 200/q premium yields Rs 20,000 extra revenue.
    // 1 truck freight to distant (160km * 35 * 2) = 11,200.
    // Net advantage = 20,000 - 11,200 = +8,800. Distant metro mandi flips to #1!
    const largeBatch = rankMarkets({
      crop: 'soybean',
      quantity: 100,
      location: 'farm_origin',
      vehicle: 'truck',
      ratePerKm: 35,
      roundTrip: true,
      extraCosts: { spoilageFactor: 0 },
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });
    expect(largeBatch[0].marketId).toBe('distant_metro_mandi');
    expect(largeBatch[0].rank).toBe(1);
  });

  // 6. Transport slider flipping #1
  it('transport slider flips #1: cheap transport favors distant market, expensive transport flips to local market', () => {
    // 50 quintals: 2 pickups or 1 truck
    // At low freight rate (Rs 10/km), distant wins
    const lowFreight = rankMarkets({
      crop: 'soybean',
      quantity: 50,
      location: 'farm_origin',
      vehicle: 'pickup',
      ratePerKm: 10,
      roundTrip: false,
      extraCosts: { spoilageFactor: 0 },
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });
    expect(lowFreight[0].marketId).toBe('distant_metro_mandi');

    // At high freight rate (Rs 45/km), local flips to #1
    const highFreight = rankMarkets({
      crop: 'soybean',
      quantity: 50,
      location: 'farm_origin',
      vehicle: 'pickup',
      ratePerKm: 45,
      roundTrip: false,
      extraCosts: { spoilageFactor: 0 },
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });
    expect(highFreight[0].marketId).toBe('local_mandi');
  });

  // 7. Stale-market exclusion (Stage 1 filter)
  it('excludes markets with stale price data exceeding maxDataAgeDays', () => {
    const results = rankMarkets({
      crop: 'soybean',
      quantity: 30,
      location: 'farm_origin',
      maxDataAgeDays: 7, // Limit is 7 days
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });

    // Stale mandi had 14 days age, so it must not be in ranked candidates
    const found = results.find((r) => r.marketId === 'stale_mandi');
    expect(found).toBeUndefined();

    // Must be listed in excluded with explicit reason
    expect(results.excluded).toBeDefined();
    const excludedStale = results.excluded.find((e) => e.marketId === 'stale_mandi');
    expect(excludedStale).toBeDefined();
    expect(excludedStale.reason).toMatch(/stale/i);
  });

  // 8. Margin calculation
  it('calculates margin over next option in Rs and %', () => {
    const results = rankMarkets({
      crop: 'soybean',
      quantity: 30,
      location: 'farm_origin',
      vehicle: 'pickup',
      ratePerKm: 20,
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    const top = results[0];
    const second = results[1];

    expect(top.marginOverNextRs).toBeDefined();
    expect(top.marginOverNextPct).toBeDefined();
    expect(top.marginOverNextRs).toBe(
      Math.round((top.riskAdjustedNetReturn - second.riskAdjustedNetReturn) * 100) / 100
    );
    expect(top.marginOverNextRs).toBeGreaterThanOrEqual(0);
  });

  // 9. Trend analysis metrics
  it('trend module computes moving average, regression slope, volatility, and confidence factors', () => {
    const history = [4500, 4550, 4600, 4650, 4700, 4750, 4800];
    const trend = analyzePriceTrend(history, { daysSinceLastUpdate: 0 });

    expect(trend.movingAverage7).toBe(4650);
    expect(trend.slope).toBeGreaterThan(0); // Upward trend
    expect(trend.trendLabel).toBe('Rising');
    expect(trend.trendAdjustment).toBeGreaterThan(0);
    expect(trend.trendAdjustment).toBeLessThanOrEqual(0.05); // Damped to max 5%
    expect(trend.confidence).toBeGreaterThan(0);
    expect(trend.confidenceFactors).toHaveProperty('observationScore');
    expect(trend.confidenceFactors).toHaveProperty('volatilityScore');
    expect(trend.confidenceFactors).toHaveProperty('freshnessScore');
  });

  // 10. Break-even extra distance & sell now vs wait
  it('calculates breakEvenExtraDistance and sellNowVsWait accurately', () => {
    const base = { modalPrice: 4600, distanceKm: 15 };
    const other = { modalPrice: 4800, distanceKm: 120 };

    const breakEven = breakEvenExtraDistance(base, other, {
      quantity: 30,
      vehicleType: 'pickup',
      ratePerKm: 20,
      roundTrip: false
    });

    expect(breakEven.canJustifyExtraDistance).toBe(true);
    expect(breakEven.breakEvenExtraDistanceKm).toBeGreaterThan(0);
    expect(breakEven.grossAdvantageRs).toBe(6000); // (4800 - 4600) * 30

    // Sell now vs wait
    const waitAnalysis = sellNowVsWait({
      currentPrice: 4600,
      history: [4500, 4550, 4580, 4600],
      holdingDays: 7,
      quantity: 50
    });

    expect(waitAnalysis).toHaveProperty('recommendation');
    expect(waitAnalysis).toHaveProperty('scenarios');
    expect(waitAnalysis.scenarios).toHaveProperty('low');
    expect(waitAnalysis.scenarios).toHaveProperty('expected');
    expect(waitAnalysis.scenarios).toHaveProperty('high');
    expect(waitAnalysis.disclaimer).toMatch(/Estimate, not guaranteed/i);
  });
});
