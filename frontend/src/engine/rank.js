/**
 * MandiMitra AI - Market Ranking Module
 * 
 * Requirements:
 * - Stage 1 filter: market trades the crop, has data within the last N days (default 7),
 *   within max distance (default 200 km). Return excluded markets with reasons.
 * - Stage 2 rank by risk-adjusted net return = netReturn minus penalty for low confidence
 *   or stale data (penalty documented and small). Do not double count trend or distance;
 *   they appear only through price and transport.
 * - Include rank, margin over next option (Rs and %), and a flag if the highest-price market is not #1.
 */

import { calculateTransportCost, determineVehicles, calculateVehiclesNeeded, VEHICLE_PRESETS } from './transport.js';
import { analyzePriceTrend } from './trend.js';
import { calculateNetReturn, CROP_DEFAULT_EXTRAS } from './netReturn.js';
import { explainRecommendation } from './explain.js';
import { classifyWeather, weatherRiskPenalty, SAMPLE_DEMO_WEATHER } from './weather.js';

import defaultMarketsData from '../../../data/markets.json';
import defaultPricesData from '../../../data/prices.json';
import defaultDistancesData from '../../../data/distances.json';

/**
 * Calculates straight line / road winding distance
 */
export function calculateRoadDistance(lat1, lon1, lat2, lon2, roadFactor = 1.28) {
  const R = 6371; // km
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
 * Main ranking function
 * 
 * @param {Object} params
 * @param {string} [params.crop='soybean'] - Crop ID
 * @param {number} [params.quantity=50] - Quantity in quintals
 * @param {string|Object} [params.location='morshi'] - Farmer location id or {lat, lon}
 * @param {string} [params.vehicle='pickup'] - Vehicle type id or 'auto'
 * @param {number} [params.ratePerKm] - Custom transport rate per km
 * @param {number} [params.priceAdjust=0] - What-if price change (-20% to +20%)
 * @param {boolean} [params.roundTrip=false] - Whether transport charges round trip
 * @param {Object} [params.extraCosts={}] - Handling and market fee overrides
 * @param {string} [params.lang='en'] - 'en' | 'hi' | 'mr'
 * @param {number} [params.maxDistanceKm=250] - Max allowable road distance filter (default 250km / configurable)
 * @param {number} [params.maxDataAgeDays=7] - Max allowable data age in days (default 7)
 * @param {Object} [params.customMarkets] - Optional injected markets dataset
 * @param {Object} [params.customPrices] - Optional injected prices dataset
 * @param {Object} [params.customDistances] - Optional injected distances dataset
 * @returns {Array} Array of ranked market objects, with `.excluded` property attached
 */
export function rankMarkets({
  crop = 'soybean',
  quantity = 50,
  location = 'morshi',
  vehicle = 'pickup',
  ratePerKm = null,
  priceAdjust = 0,
  roundTrip = false,
  extraCosts = {},
  lang = 'en',
  maxDistanceKm = 250,
  maxDataAgeDays = 7,
  customMarkets = null,
  customPrices = null,
  customDistances = null,
  includeWeatherRisk = false,
  weatherData = null
} = {}) {
  const rawMarkets = customMarkets || defaultMarketsData;
  const markets = Array.isArray(rawMarkets) ? rawMarkets : (rawMarkets.markets || []);
  const prices = customPrices || defaultPricesData;
  const distances = customDistances || defaultDistancesData;

  const cropKey = (crop || 'soybean').toLowerCase();
  const cropPriceRecords = prices.marketPrices?.[cropKey] || [];
  const cropMetadata = prices.crops?.find((c) => c.id === cropKey) || {
    id: cropKey,
    name: crop,
    spoilageFactor: CROP_DEFAULT_EXTRAS[cropKey]?.wastageFactor || 0.00015
  };

  const qty = Math.max(0.1, Number(quantity) || 0.1);

  // Map markets
  const marketMap = new Map();
  for (const m of markets) {
    const id = m.market_id || m.id;
    marketMap.set(id, m);
  }

  // Resolve farmer origin coordinates & precomputed distance matrix
  let originLat = 21.3176;
  let originLon = 78.0102;
  let precomputedDistances = {};

  if (typeof location === 'string') {
    const origin = distances.farmerOrigins?.find(
      (o) => (o.id || o.location_id) === location
    );
    if (origin) {
      originLat = origin.lat || origin.latitude || originLat;
      originLon = origin.lon || origin.longitude || originLon;
      precomputedDistances = origin.distancesKm || {};
    }
  } else if (location && typeof location === 'object') {
    originLat = location.lat ?? location.latitude ?? originLat;
    originLon = location.lon ?? location.longitude ?? originLon;
    if (location.distancesKm) {
      precomputedDistances = location.distancesKm;
    }
  }

  // Resolve vehicle selection
  let selectedVehicleType = vehicle;
  let selectedVehiclesNeeded = 1;
  let effectiveRatePerKm = ratePerKm;

  if (vehicle === 'auto') {
    const autoRec = determineVehicles(qty, 'auto');
    selectedVehicleType = autoRec.vehicleType;
    selectedVehiclesNeeded = autoRec.vehiclesNeeded;
    effectiveRatePerKm = (ratePerKm !== null && ratePerKm !== undefined && Number(ratePerKm) > 0)
      ? Number(ratePerKm)
      : autoRec.config.defaultRatePerKm;
  } else {
    const preset = VEHICLE_PRESETS[vehicle] || VEHICLE_PRESETS.pickup;
    selectedVehicleType = preset.id;
    selectedVehiclesNeeded = calculateVehiclesNeeded(qty, preset.capacity);
    effectiveRatePerKm = (ratePerKm !== null && ratePerKm !== undefined && Number(ratePerKm) > 0)
      ? Number(ratePerKm)
      : preset.ratePerKm;
  }

  const stage1Qualified = [];
  const excluded = [];

  // STAGE 1 FILTER:
  // 1. Market trades the crop
  // 2. Has data within last N days (default 7)
  // 3. Within max distance (default 200/250 km)
  for (const prec of cropPriceRecords) {
    const market = marketMap.get(prec.marketId);
    if (!market) {
      excluded.push({
        marketId: prec.marketId,
        reason: 'Market not found in APMC directory'
      });
      continue;
    }

    const mKey = market.market_id || market.id;
    const mLat = market.latitude ?? market.lat;
    const mLon = market.longitude ?? market.lon;

    // Calculate distance
    let distanceKm = 0;
    if (precomputedDistances[mKey] !== undefined) {
      distanceKm = Number(precomputedDistances[mKey]);
    } else {
      distanceKm = calculateRoadDistance(
        originLat,
        originLon,
        mLat,
        mLon,
        distances.roadWindingFactor || 1.28
      );
    }

    const dataAgeDays = prec.dataAgeDays !== undefined ? Number(prec.dataAgeDays) : 0;

    // Filter checks
    if (prec.modalPrice === undefined || prec.modalPrice === null || Number(prec.modalPrice) <= 0) {
      excluded.push({
        market,
        marketId: mKey,
        distanceKm,
        dataAgeDays,
        reason: 'No current trading volume or valid modal price recorded for this crop'
      });
      continue;
    }

    if (dataAgeDays > maxDataAgeDays) {
      excluded.push({
        market,
        marketId: mKey,
        distanceKm,
        dataAgeDays,
        reason: `Price data is stale (${dataAgeDays} days old > ${maxDataAgeDays} days limit)`
      });
      continue;
    }

    if (distanceKm > maxDistanceKm) {
      excluded.push({
        market,
        marketId: mKey,
        distanceKm,
        dataAgeDays,
        reason: `Distance (${distanceKm} km) exceeds maximum operational radius (${maxDistanceKm} km)`
      });
      continue;
    }

    stage1Qualified.push({
      market,
      prec,
      distanceKm,
      dataAgeDays
    });
  }

  // STAGE 2: Calculate metrics & risk-adjusted net return
  const candidates = [];
  let highestModalPrice = 0;
  let highestPriceMarketRef = null;

  for (const { market, prec, distanceKm, dataAgeDays } of stage1Qualified) {
    const modalPrice = Number(prec.modalPrice);
    if (modalPrice > highestModalPrice) {
      highestModalPrice = modalPrice;
      highestPriceMarketRef = { market, price: modalPrice, distanceKm, modalPrice };
    }

    // Trend analysis
    const trendAnalysis = analyzePriceTrend(prec.history || [], {
      daysSinceLastUpdate: dataAgeDays,
      customCurrentPrice: modalPrice
    });

    const trendAdjustment = prec.trendAdjustment !== undefined
      ? Number(prec.trendAdjustment)
      : trendAnalysis.trendAdjustment;

    const confidence = prec.confidence !== undefined
      ? (typeof prec.confidence === 'number' && prec.confidence <= 1 ? Math.round(prec.confidence * 100) : Number(prec.confidence))
      : trendAnalysis.confidence;

    // Transport calculation
    const transportCalc = calculateTransportCost({
      quantity: qty,
      distanceKm,
      vehicleType: selectedVehicleType,
      ratePerKm: effectiveRatePerKm,
      roundTrip
    });

    // Net return calculation
    const netReturnCalc = calculateNetReturn({
      modalPrice,
      quantity: qty,
      distanceKm,
      transportCost: transportCalc.cost,
      trendAdjustment,
      userPriceChange: priceAdjust,
      crop: cropKey,
      extraCosts,
      marketOverrides: market
    });

    // Weather classification & optional risk penalty
    const mId = market.market_id || market.id;
    const mandiWeather = weatherData?.mandis?.[mId] || SAMPLE_DEMO_WEATHER.mandis?.[mId] || null;
    const weatherEval = classifyWeather(mandiWeather?.daily);

    // Documented percentage penalty applied ONLY when toggle is ON
    const weatherPenalty = includeWeatherRisk
      ? weatherRiskPenalty(weatherEval.level, netReturnCalc.netReturn)
      : 0;

    // Risk adjustment penalty:
    // Penalty is documented and small:
    // - Low confidence penalty: up to 0.5% of net return
    // - Data staleness penalty: 0.2% per day of staleness
    // - Weather risk penalty: 0.5% for caution, 1.5% for risk (ONLY if includeWeatherRisk is true)
    // Does NOT double count trend or distance (those are already accounted for in price and transport).
    const confFactor = Math.max(0, (100 - confidence) / 100);
    const confidencePenalty = Math.round(netReturnCalc.netReturn * 0.005 * confFactor * 100) / 100;
    const stalenessPenalty = Math.round(netReturnCalc.netReturn * 0.002 * dataAgeDays * 100) / 100;
    const totalRiskPenalty = Math.max(0, confidencePenalty + stalenessPenalty + weatherPenalty);
    const riskAdjustedNetReturn = Math.round((netReturnCalc.netReturn - totalRiskPenalty) * 100) / 100;

    candidates.push({
      market,
      marketId: market.market_id || market.id,
      price: modalPrice,
      modalPrice,
      expectedPrice: netReturnCalc.expectedPrice,
      distanceKm,
      transport: transportCalc.cost,
      vehiclesNeeded: transportCalc.vehiclesNeeded,
      vehicleType: selectedVehicleType,
      otherCosts: netReturnCalc.otherCosts,
      netReturn: netReturnCalc.netReturn,
      riskPenalty: totalRiskPenalty,
      riskAdjustedNetReturn,
      revenue: netReturnCalc.revenue,
      trend: prec.trend || trendAnalysis.trendLabel,
      trendAdjustment,
      confidence,
      confidenceFactors: trendAnalysis.confidenceFactors,
      dataAgeDays,
      arrivalsQntl: prec.arrivalsQntl || 0,
      history: prec.history || [],
      weatherLevel: weatherEval.level,
      weatherReasons: weatherEval.reasons,
      weather: {
        level: weatherEval.level,
        reasons: weatherEval.reasons,
        day0: weatherEval.day0,
        days: weatherEval.days,
        isAvailable: weatherEval.isAvailable,
        penalty: weatherPenalty
      },
      weatherRiskPenalty: weatherPenalty,
      costBreakdown: {
        revenue: netReturnCalc.revenue,
        expectedPrice: netReturnCalc.expectedPrice,
        transport: transportCalc.cost,
        loading: netReturnCalc.loading,
        marketFee: netReturnCalc.marketFee,
        commission: netReturnCalc.commission,
        weighment: netReturnCalc.weighment,
        wastage: netReturnCalc.wastage,
        storage: netReturnCalc.storage,
        otherCosts: netReturnCalc.otherCosts,
        totalDeductions: netReturnCalc.totalDeductions,
        netReturn: netReturnCalc.netReturn,
        perQuintalNet: netReturnCalc.perQuintalNet
      }
    });
  }

  // Sort by riskAdjustedNetReturn descending
  candidates.sort((a, b) => b.riskAdjustedNetReturn - a.riskAdjustedNetReturn);

  // Identify nearest for explanation
  let nearest = null;
  if (candidates.length > 0) {
    nearest = candidates.reduce((prev, curr) => (curr.distanceKm < prev.distanceKm ? curr : prev));
  }

  // Identify best alternative market with clear weather
  const clearAlternative = candidates.find(c => c.weather?.level === 'clear') || null;

  const top = candidates[0] || null;
  const runnerUp = candidates[1] || null;

  // Check if highest modal price market is not #1
  const isHighestPriceNotRankOne = Boolean(
    top &&
    highestPriceMarketRef &&
    highestPriceMarketRef.market?.id !== top.market?.id &&
    highestPriceMarketRef.price > top.price
  );

  // Add rank, margins, and whyChosen
  const rankedResults = candidates.map((item, index) => {
    const rank = index + 1;
    const nextItem = candidates[index + 1] || null;

    let marginOverNextRs = 0;
    let marginOverNextPct = 0;
    if (nextItem) {
      marginOverNextRs = Math.round((item.riskAdjustedNetReturn - nextItem.riskAdjustedNetReturn) * 100) / 100;
      marginOverNextPct = nextItem.riskAdjustedNetReturn > 0
        ? Math.round((marginOverNextRs / nextItem.riskAdjustedNetReturn) * 1000) / 10
        : 0;
    }

    let whyChosen = '';
    if (rank === 1) {
      const explanation = explainRecommendation({
        top: item,
        runnerUp,
        nearest,
        highestPriceMarket: highestPriceMarketRef,
        clearAlternative,
        cropName: cropMetadata.name,
        lang
      });
      whyChosen = explanation.summary;
    } else {
      const diff = Math.round(candidates[0].riskAdjustedNetReturn - item.riskAdjustedNetReturn);
      if (lang === 'mr') {
        whyChosen = `रँक #१ (${candidates[0].market.name}) पेक्षा ₹${diff.toLocaleString('en-IN')} कमी निव्वळ नफा मिळतो.`;
      } else if (lang === 'hi') {
        whyChosen = `रैंक #1 (${candidates[0].market.name}) की तुलना में ₹${diff.toLocaleString('en-IN')} कम शुद्ध लाभ मिलता है।`;
      } else {
        whyChosen = `Yields ₹${diff.toLocaleString('en-IN')} less net return than Rank #1 (${candidates[0].market.name}).`;
      }
    }

    return {
      ...item,
      rank,
      marginOverNextRs,
      marginOverNextPct,
      isHighestPriceNotRankOne: rank === 1 ? isHighestPriceNotRankOne : false,
      whyChosen
    };
  });

  // Attach excluded markets list to result array
  rankedResults.excluded = excluded;
  rankedResults.isHighestPriceNotRankOne = isHighestPriceNotRankOne;
  rankedResults.includeWeatherRisk = includeWeatherRisk;

  return rankedResults;
}
