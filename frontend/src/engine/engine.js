/**
 * MandiMitra AI - Core Pure Recommendation Engine
 * 
 * CORE FORMULA:
 * expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
 * revenue = expectedPrice * quantity
 * transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
 * netReturn = revenue - transport - loading - marketFee - commission - wastage
 * 
 * ENGINE INTERFACE (do not change names):
 * rankMarkets({crop, quantity, location, vehicle, ratePerKm, priceAdjust, roundTrip, extraCosts})
 *   -> [{market, price, expectedPrice, distanceKm, transport, otherCosts, netReturn, trend, confidence, dataAgeDays, rank}]
 * 
 * Sourced from daily-updated official mandi data.
 * Prices are MODAL prices.
 * Forecasts are estimate, not guaranteed.
 */

import marketsData from '../../../data/markets.json';
import pricesData from '../../../data/prices.json';
import distancesData from '../../../data/distances.json';

export const VEHICLE_CONFIGS = {
  pickup: {
    id: 'pickup',
    name: 'Pickup (Bolero Maxi / 1.5T)',
    nameHi: 'पिकअप (1.5 टन)',
    nameMr: 'पिकअप (१.५ टन)',
    capacityQntl: 15,
    defaultRatePerKm: 26,
    icon: 'Truck'
  },
  tata407: {
    id: 'tata407',
    name: 'Tata 407 / LCV (3T)',
    nameHi: 'टाटा 407 / एलसीवी (3 टन)',
    nameMr: 'टाटा ४०७ (३ टन)',
    capacityQntl: 30,
    defaultRatePerKm: 32,
    icon: 'Truck'
  },
  tractor: {
    id: 'tractor',
    name: 'Tractor Trolley (4T)',
    nameHi: 'ट्रैक्टर ट्रॉली (4 टन)',
    nameMr: 'ट्रॅक्टर ट्रॉली (४ टन)',
    capacityQntl: 40,
    defaultRatePerKm: 28,
    icon: 'Tractor'
  },
  truck14ft: {
    id: 'truck14ft',
    name: '14ft Medium Truck (6T)',
    nameHi: '14 फीट ट्रक (6 टन)',
    nameMr: '१४ फूट ट्रक (६ टन)',
    capacityQntl: 60,
    defaultRatePerKm: 38,
    icon: 'Truck'
  },
  truck6wheeler: {
    id: 'truck6wheeler',
    name: '6-Wheeler Heavy Truck (12T)',
    nameHi: '6-चक्का भारी ट्रक (12 टन)',
    nameMr: '६-चाकांचा मोठा ट्रक (१२ टन)',
    capacityQntl: 120,
    defaultRatePerKm: 52,
    icon: 'Truck'
  }
};

/**
 * Determines optimal vehicle and vehicles needed
 */
export function determineVehicles(quantity, vehicleType = 'auto') {
  const qty = Math.max(0.1, Number(quantity) || 0.1);
  
  if (vehicleType && VEHICLE_CONFIGS[vehicleType]) {
    const config = VEHICLE_CONFIGS[vehicleType];
    const count = Math.ceil(qty / config.capacityQntl);
    return {
      vehicleType,
      vehiclesNeeded: Math.max(1, count),
      config
    };
  }

  // Auto-selection based on quantity
  const types = ['pickup', 'tata407', 'tractor', 'truck14ft', 'truck6wheeler'];
  for (const t of types) {
    if (qty <= VEHICLE_CONFIGS[t].capacityQntl) {
      return {
        vehicleType: t,
        vehiclesNeeded: 1,
        config: VEHICLE_CONFIGS[t]
      };
    }
  }

  // Fallback to 6-wheeler
  const config = VEHICLE_CONFIGS.truck6wheeler;
  return {
    vehicleType: 'truck6wheeler',
    vehiclesNeeded: Math.ceil(qty / config.capacityQntl),
    config
  };
}

/**
 * Haversine road distance calculation with highway winding factor
 */
export function calculateRoadDistance(lat1, lon1, lat2, lon2, roadFactor = 1.28) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * roadFactor * 10) / 10;
}

/**
 * Generates transparent rationale for top market recommendation (EN / HI / MR)
 */
export function generateRationale(top, runnerUp, nearest, cropName, lang = 'en') {
  const mName = top.market.name;
  const net = Math.round(top.netReturn);
  const expPrice = Math.round(top.expectedPrice);
  const dist = Math.round(top.distanceKm);
  const trans = Math.round(top.transport);

  if (!runnerUp) {
    if (lang === 'mr') {
      return `${mName} आपल्या ${cropName} पिकासाठी दैनिक अद्यतनित अधिकृत बाजार समिती माहितीनुसार सर्वाधिक अंदाजित निव्वळ नफा (₹${net.toLocaleString('en-IN')}) देते.`;
    }
    if (lang === 'hi') {
      return `${mName} आपकी ${cropName} उपज के लिए दैनिक अद्यतन आधिकारिक मंडी डेटा के आधार पर उच्चतम अपेक्षित शुद्ध लाभ (₹${net.toLocaleString('en-IN')}) प्रदान करती है।`;
    }
    return `${mName} delivers the highest expected net return of ₹${net.toLocaleString('en-IN')} for your ${cropName} based on daily-updated official mandi modal prices.`;
  }

  const profitDiff = Math.round(top.netReturn - runnerUp.netReturn);
  const runnerName = runnerUp.market.name;

  if (nearest && nearest.market.id !== top.market.id) {
    const nearName = nearest.market.name;
    const extraDist = Math.round(dist - nearest.distanceKm);
    if (extraDist > 0) {
      if (lang === 'mr') {
        return `सर्वोत्तम निवड: ${mName} मधील अधिक मॉडेल भाव (₹${expPrice.toLocaleString('en-IN')}/क्विं.) मुळे ${runnerName} पेक्षा +₹${profitDiff.toLocaleString('en-IN')} जास्त निव्वळ नफा मिळतो. ${nearName} च्या तुलनेत +${extraDist} किमी अतिरिक्त अंतराचा ₹${trans.toLocaleString('en-IN')} वाहतूक खर्च सहज भरून निघतो.`;
      }
      if (lang === 'hi') {
        return `#1 विकल्प के रूप में ${mName} का चयन: अनुकूल मॉडल भाव (₹${expPrice.toLocaleString('en-IN')}/क्विं.) के कारण ${runnerName} की तुलना में +₹${profitDiff.toLocaleString('en-IN')} अधिक शुद्ध लाभ मिलता है, जो ${nearName} से +${extraDist} किमी अतिरिक्त दूरी का ₹${trans.toLocaleString('en-IN')} परिवहन खर्च आसानी से निकाल लेता है।`;
      }
      return `Selected ${mName}: Favorable modal price (₹${expPrice.toLocaleString('en-IN')}/q) yields +₹${profitDiff.toLocaleString('en-IN')} more net profit than ${runnerName}, easily overcoming ₹${trans.toLocaleString('en-IN')} transport across +${extraDist} km extra distance compared to ${nearName}.`;
    }
  }

  if (lang === 'mr') {
    return `सर्वोत्तम निवड म्हणून ${mName}: सर्व वाहतूक व बाजार समिती शुल्क वजा जाता उत्तम मॉडेल भावामुळे (₹${expPrice.toLocaleString('en-IN')}/क्विं.) ${runnerName} पेक्षा ₹${profitDiff.toLocaleString('en-IN')} जास्त निव्वळ नफा मिळतो.`;
  }
  if (lang === 'hi') {
    return `#1 सिफारिश के रूप में ${mName}: सभी परिवहन व मंडी कटौतियों के बाद बेहतर मॉडल भाव (₹${expPrice.toLocaleString('en-IN')}/क्विं.) के कारण ${runnerName} से ₹${profitDiff.toLocaleString('en-IN')} अधिक शुद्ध लाभ प्राप्त होता है।`;
  }
  return `Selected ${mName} as #1 recommendation: yields ₹${profitDiff.toLocaleString('en-IN')} higher net profit than ${runnerName} with superior modal price (₹${expPrice.toLocaleString('en-IN')}/q) after all transport and mandi charges.`;
}

/**
 * ENGINE INTERFACE (do not change names):
 * rankMarkets({crop, quantity, location, vehicle, ratePerKm, priceAdjust, roundTrip, extraCosts})
 *   -> [{market, price, expectedPrice, distanceKm, transport, otherCosts, netReturn, trend, confidence, dataAgeDays, rank}]
 */
export function rankMarkets({
  crop = 'onion',
  quantity = 50,
  location = 'niphad_farm',
  vehicle = 'auto',
  ratePerKm = null,
  priceAdjust = 0,
  roundTrip = false,
  extraCosts = {},
  lang = 'en',
  customMarkets = null,
  customPrices = null,
  customDistances = null
} = {}) {
  const rawMarkets = customMarkets || marketsData;
  const markets = Array.isArray(rawMarkets) ? rawMarkets : (rawMarkets.markets || []);
  const prices = customPrices || pricesData;
  const distances = customDistances || distancesData;

  const cropKey = (crop || 'soybean').toLowerCase();
  const cropPriceRecords = prices.marketPrices?.[cropKey] || [];
  const cropMetadata = prices.crops?.find((c) => c.id === cropKey) || {
    name: crop,
    spoilageFactor: 0.00015
  };

  const qty = Math.max(0.1, Number(quantity) || 0.1);

  // Normalize user price change (e.g. 5% -> 0.05, or 0.05 -> 0.05)
  const userPriceChange = Math.abs(priceAdjust) > 1 ? priceAdjust / 100 : priceAdjust;

  // Resolve vehicle selection
  const { vehicleType, vehiclesNeeded, config } = determineVehicles(qty, vehicle);
  const costPerKm =
    ratePerKm !== null && ratePerKm !== undefined && Number(ratePerKm) > 0
      ? Number(ratePerKm)
      : config.defaultRatePerKm;
  const tripMultiplier = roundTrip ? 2 : 1;

  // Map markets by market_id / id
  const marketMap = new Map();
  for (const m of markets) {
    const mId = m.market_id || m.id;
    marketMap.set(mId, m);
  }

  // Resolve farmer origin coordinates & precomputed distances
  let originLat = 20.9320;
  let originLon = 77.7523;
  let precomputedDistances = {};

  if (typeof location === 'string') {
    const origin = distances.farmerOrigins?.find((o) => o.id === location || o.location_id === location);
    if (origin) {
      originLat = origin.lat || origin.latitude;
      originLon = origin.lon || origin.longitude;
      precomputedDistances = origin.distancesKm || {};
    }
  } else if (location && typeof location === 'object') {
    originLat = location.lat ?? location.latitude ?? originLat;
    originLon = location.lon ?? location.longitude ?? originLon;
    if (location.distancesKm) {
      precomputedDistances = location.distancesKm;
    }
  }

  const results = [];

  for (const prec of cropPriceRecords) {
    const market = marketMap.get(prec.marketId);
    if (!market) continue;

    // 1. Distance Calculation
    const mKey = market.market_id || market.id;
    const mLat = market.latitude ?? market.lat;
    const mLon = market.longitude ?? market.lon;

    let distanceKm = 0;
    if (precomputedDistances[mKey] !== undefined) {
      distanceKm = Number(precomputedDistances[mKey]);
    } else {
      distanceKm = calculateRoadDistance(
        originLat,
        originLon,
        mLat,
        mLon,
        distances.roadWindingFactor || 1.3
      );
    }

    // 2. Expected Price
    // expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
    const modalPrice = Number(prec.modalPrice);
    const trendAdjustment = Number(prec.trendAdjustment || 0);
    const expectedPrice = Math.round(
      modalPrice * (1 + trendAdjustment + userPriceChange) * 100
    ) / 100;

    // 3. Revenue
    // revenue = expectedPrice * quantity
    const revenue = Math.round(expectedPrice * qty * 100) / 100;

    // 4. Transport Cost
    // transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
    const transport = Math.round(
      vehiclesNeeded * distanceKm * costPerKm * tripMultiplier * 100
    ) / 100;

    // 5. Loading, APMC fee, Commission, Weighment, Wastage
    const loadingPerQntl = extraCosts.loadingPerQntl ?? market.loadingPerQntl ?? 12.0;
    const loading = Math.round(loadingPerQntl * qty * 100) / 100;

    const marketFeePercent = extraCosts.marketFeePercent ?? market.marketFeePercent ?? 1.0;
    const marketFee = Math.round(revenue * (marketFeePercent / 100) * 100) / 100;

    const commissionPercent = extraCosts.commissionPercent ?? market.commissionPercent ?? 0.0;
    const commission = Math.round(revenue * (commissionPercent / 100) * 100) / 100;

    const weighmentPerQntl = extraCosts.weighmentPerQntl ?? market.weighmentPerQntl ?? 6.0;
    const weighment = Math.round(weighmentPerQntl * qty * 100) / 100;

    const wastageFactor = extraCosts.spoilageFactor ?? cropMetadata.spoilageFactor ?? 0.00015;
    const wastage = Math.round(revenue * wastageFactor * Math.min(distanceKm, 300) * 100) / 100;

    // otherCosts = loading + marketFee + commission + wastage + weighment
    const otherCosts = Math.round(
      (loading + marketFee + commission + weighment + wastage) * 100
    ) / 100;

    // 6. Net Return
    // netReturn = revenue - transport - loading - marketFee - commission - wastage
    const netReturn = Math.round((revenue - transport - otherCosts) * 100) / 100;

    results.push({
      market,
      price: modalPrice,
      expectedPrice,
      distanceKm,
      transport,
      otherCosts,
      netReturn,
      revenue,
      trend: prec.trend || 'STABLE',
      trendAdjustment,
      confidence: prec.confidence || 0.9,
      dataAgeDays: prec.dataAgeDays ?? 0,
      arrivalsQntl: prec.arrivalsQntl || 0,
      history: prec.history || [],
      vehiclesNeeded,
      vehicleType,
      costBreakdown: {
        revenue,
        transport,
        loading,
        marketFee,
        commission,
        weighment,
        wastage,
        totalDeductions: Math.round((transport + otherCosts) * 100) / 100
      }
    });
  }

  // Sort by netReturn descending
  results.sort((a, b) => b.netReturn - a.netReturn);

  // Identify nearest for explanation
  let nearest = null;
  if (results.length > 0) {
    nearest = results.reduce((prev, curr) =>
      curr.distanceKm < prev.distanceKm ? curr : prev
    );
  }

  const runnerUp = results[1] || null;

  // Add rank and rationale
  return results.map((item, index) => {
    const rank = index + 1;
    let whyChosen = '';
    if (rank === 1) {
      whyChosen = generateRationale(item, runnerUp, nearest, cropMetadata.name, lang);
    } else {
      const diff = Math.round(results[0].netReturn - item.netReturn);
      if (lang === 'mr') {
        whyChosen = `रँक #१ (${results[0].market.name}) पेक्षा ₹${diff.toLocaleString('en-IN')} कमी निव्वळ नफा मिळतो.`;
      } else if (lang === 'hi') {
        whyChosen = `रैंक #1 (${results[0].market.name}) की तुलना में ₹${diff.toLocaleString('en-IN')} कम शुद्ध लाभ मिलता है।`;
      } else {
        whyChosen = `Yields ₹${diff.toLocaleString('en-IN')} less net return than Rank #1 (${results[0].market.name}).`;
      }
    }

    return {
      ...item,
      rank,
      whyChosen
    };
  });
}
