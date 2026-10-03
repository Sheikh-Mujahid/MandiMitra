import { describe, it, expect } from 'vitest';
import { rankMarkets, determineVehicles, calculateRoadDistance } from './engine.js';

describe('MandiMitra Recommendation Engine Unit Tests', () => {
  const mockMarkets = [
    {
      id: 'local_mandi',
      name: 'Local APMC',
      state: 'Maharashtra',
      district: 'Nashik',
      lat: 20.10,
      lon: 74.15,
      marketFeePercent: 1.0,
      commissionPercent: 0.0,
      weighmentPerQntl: 5.0,
      loadingPerQntl: 10.0
    },
    {
      id: 'distant_metro_mandi',
      name: 'Distant Metro Terminal Yard',
      state: 'Maharashtra',
      district: 'Mumbai',
      lat: 19.05,
      lon: 73.00,
      marketFeePercent: 1.5,
      commissionPercent: 0.0,
      weighmentPerQntl: 8.0,
      loadingPerQntl: 15.0
    }
  ];

  const mockPrices = {
    crops: [{ id: 'onion', name: 'Onion', spoilageFactor: 0.0 }],
    marketPrices: {
      onion: [
        {
          marketId: 'local_mandi',
          modalPrice: 2000,
          trendAdjustment: 0.0,
          confidence: 0.95,
          dataAgeDays: 0,
          trend: 'STABLE'
        },
        {
          marketId: 'distant_metro_mandi',
          modalPrice: 2300, // Higher price!
          trendAdjustment: 0.0,
          confidence: 0.92,
          dataAgeDays: 0,
          trend: 'UP'
        }
      ]
    }
  };

  const mockDistances = {
    roadWindingFactor: 1.28,
    farmerOrigins: [
      {
        id: 'farm_origin',
        lat: 20.08,
        lon: 74.10,
        distancesKm: {
          local_mandi: 15,
          distant_metro_mandi: 220
        }
      }
    ]
  };

  it('matches required engine interface properties', () => {
    const results = rankMarkets({
      crop: 'onion',
      quantity: 50,
      location: 'farm_origin',
      vehicle: 'auto',
      ratePerKm: 30,
      priceAdjust: 0,
      roundTrip: false,
      extraCosts: {},
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);

    const first = results[0];
    // Required fields from problem prompt:
    expect(first).toHaveProperty('market');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('expectedPrice');
    expect(first).toHaveProperty('distanceKm');
    expect(first).toHaveProperty('transport');
    expect(first).toHaveProperty('otherCosts');
    expect(first).toHaveProperty('netReturn');
    expect(first).toHaveProperty('trend');
    expect(first).toHaveProperty('confidence');
    expect(first).toHaveProperty('dataAgeDays');
    expect(first).toHaveProperty('rank');
  });

  it('proves core problem: highest modal price is NOT always highest net return', () => {
    // 20 quintals transported in 1 pickup
    // Local: 2000 * 20 = 40,000 revenue. Transport: 15km * 30 = 450.
    // Distant: 2300 * 20 = 46,000 revenue. Transport: 220km * 30 = 6,600.
    // At small quantities, distant mandi transport eats away the ₹300/qntl price premium!
    const results = rankMarkets({
      crop: 'onion',
      quantity: 20,
      location: 'farm_origin',
      vehicle: 'pickup',
      ratePerKm: 30,
      priceAdjust: 0,
      roundTrip: false,
      extraCosts: { spoilageFactor: 0 },
      customMarkets: mockMarkets,
      customPrices: mockPrices,
      customDistances: mockDistances
    });

    const localRank = results.find((r) => r.market.id === 'local_mandi');
    const distantRank = results.find((r) => r.market.id === 'distant_metro_mandi');

    expect(distantRank.price).toBeGreaterThan(localRank.price); // Modal price is higher
    expect(localRank.netReturn).toBeGreaterThan(distantRank.netReturn); // But local net return is HIGHER!
    expect(localRank.rank).toBe(1);
    expect(distantRank.rank).toBe(2);
  });

  it('correctly calculates core formula: expectedPrice, revenue, transport, and netReturn', () => {
    const results = rankMarkets({
      crop: 'onion',
      quantity: 30,
      location: 'farm_origin',
      vehicle: 'tata407', // Capacity 30 -> 1 vehicle
      ratePerKm: 30,
      priceAdjust: 10, // +10% price change
      roundTrip: true, // x2 multiplier
      extraCosts: {
        loadingPerQntl: 10,
        marketFeePercent: 1.0,
        commissionPercent: 0.0,
        weighmentPerQntl: 5,
        spoilageFactor: 0
      },
      customMarkets: [mockMarkets[0]],
      customPrices: mockPrices,
      customDistances: mockDistances
    });

    const item = results[0];
    // expectedPrice = 2000 * (1 + 0 + 0.10) = 2200
    expect(item.expectedPrice).toBe(2200);
    // revenue = 2200 * 30 = 66,000
    expect(item.revenue).toBe(66000);
    // transport = 1 vehicle * 15 km * 30 rate * 2 (round trip) = 900
    expect(item.transport).toBe(900);
    // loading = 10 * 30 = 300
    // market fee = 66000 * 1% = 660
    // weighment = 5 * 30 = 150
    // otherCosts = 300 + 660 + 150 = 1110
    expect(item.otherCosts).toBe(1110);
    // netReturn = 66000 - 900 - 1110 = 63,990
    expect(item.netReturn).toBe(63990);
    // Mathematical consistency check:
    expect(item.revenue - item.transport - item.otherCosts).toBe(item.netReturn);
  });

  it('handles vehicle sizing correctly', () => {
    // 45 quintals should require 1 Tata407 (capacity 30) -> 2 vehicles, or 1 14ft (capacity 60) -> 1 vehicle
    const autoPick = determineVehicles(45, 'auto');
    expect(autoPick.vehicleType).toBe('truck14ft');
    expect(autoPick.vehiclesNeeded).toBe(1);

    const manualPickup = determineVehicles(45, 'pickup'); // Capacity 15
    expect(manualPickup.vehiclesNeeded).toBe(3);
  });
});
