/**
 * MandiMitra AI - Net Return Calculation Module
 * 
 * CORE FORMULA:
 * expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
 * revenue = expectedPrice * quantity
 * transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
 * netReturn = revenue - transport - loading - marketFee - commission - wastage - storage
 * 
 * Requirements:
 * - Editable default extras per crop: loading (Rs/q), market fee (% of revenue), commission (% of revenue),
 *   wastage (% of quantity; higher for perishables), optional storage cost for wait scenarios.
 * - Return a full cost breakdown object, not just a number.
 */

export const CROP_DEFAULT_EXTRAS = {
  soybean: {
    loadingPerQntl: 12.0,
    marketFeePercent: 1.05,
    commissionPercent: 0.0,
    weighmentPerQntl: 6.0,
    wastageFactor: 0.00015, // 0.015% per 100km (durable grain)
    wastagePercent: 0.5,
    storageCostPerQntlDay: 0.20
  },
  wheat: {
    loadingPerQntl: 10.0,
    marketFeePercent: 1.0,
    commissionPercent: 0.0,
    weighmentPerQntl: 5.0,
    wastageFactor: 0.00010,
    wastagePercent: 0.4,
    storageCostPerQntlDay: 0.18
  },
  chana: {
    loadingPerQntl: 12.0,
    marketFeePercent: 1.0,
    commissionPercent: 0.0,
    weighmentPerQntl: 6.0,
    wastageFactor: 0.00012,
    wastagePercent: 0.5,
    storageCostPerQntlDay: 0.22
  },
  gram: {
    loadingPerQntl: 12.0,
    marketFeePercent: 1.0,
    commissionPercent: 0.0,
    weighmentPerQntl: 6.0,
    wastageFactor: 0.00012,
    wastagePercent: 0.5,
    storageCostPerQntlDay: 0.22
  },
  onion: {
    loadingPerQntl: 15.0,
    marketFeePercent: 1.2,
    commissionPercent: 0.0,
    weighmentPerQntl: 8.0,
    wastageFactor: 0.00045, // Semi-perishable
    wastagePercent: 2.0,
    storageCostPerQntlDay: 0.40
  },
  tomato: {
    loadingPerQntl: 18.0,
    marketFeePercent: 1.5,
    commissionPercent: 2.0,
    weighmentPerQntl: 10.0,
    wastageFactor: 0.00120, // Highly perishable in transit
    wastagePercent: 4.5,
    storageCostPerQntlDay: 1.00
  },
  potato: {
    loadingPerQntl: 14.0,
    marketFeePercent: 1.1,
    commissionPercent: 0.0,
    weighmentPerQntl: 7.0,
    wastageFactor: 0.00025,
    wastagePercent: 1.2,
    storageCostPerQntlDay: 0.35
  },
  cotton: {
    loadingPerQntl: 16.0,
    marketFeePercent: 1.0,
    commissionPercent: 0.0,
    weighmentPerQntl: 10.0,
    wastageFactor: 0.00010,
    wastagePercent: 0.3,
    storageCostPerQntlDay: 0.25
  },
  default: {
    loadingPerQntl: 12.0,
    marketFeePercent: 1.0,
    commissionPercent: 0.0,
    weighmentPerQntl: 6.0,
    wastageFactor: 0.00020,
    wastagePercent: 1.0,
    storageCostPerQntlDay: 0.25
  }
};

/**
 * Calculates net return and comprehensive cost breakdown
 * @param {Object} params
 * @param {number} params.modalPrice - Official modal price (Rs/quintal)
 * @param {number} params.quantity - Quantity in quintals
 * @param {number} [params.distanceKm=0] - Distance in km
 * @param {number} [params.transportCost=0] - Precalculated transport cost
 * @param {number} [params.trendAdjustment=0] - Damped trend adjustment (-0.05 to +0.05)
 * @param {number} [params.userPriceChange=0] - User what-if price delta (e.g. -0.10 to +0.10)
 * @param {string} [params.crop='soybean'] - Crop ID
 * @param {Object} [params.extraCosts={}] - User editable extra costs
 * @param {Object} [params.marketOverrides={}] - APMC market specific rates
 * @param {number} [params.storageDays=0] - Optional holding/wait days for storage cost
 * @returns {Object} Full breakdown and net return
 */
export function calculateNetReturn({
  modalPrice,
  quantity,
  distanceKm = 0,
  transportCost = 0,
  trendAdjustment = 0,
  userPriceChange = 0,
  crop = 'soybean',
  extraCosts = {},
  marketOverrides = {},
  storageDays = 0
} = {}) {
  const price = Math.max(0, Number(modalPrice) || 0);
  const qty = Math.max(0.01, Number(quantity) || 0.01);
  const dist = Math.max(0, Number(distanceKm) || 0);

  // Normalize user price change (e.g. 5 or 0.05)
  const normalizedPriceChange = Math.abs(userPriceChange) > 1
    ? userPriceChange / 100
    : (Number(userPriceChange) || 0);

  const normalizedTrend = Number(trendAdjustment) || 0;

  // 1. Expected Price
  // expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
  const expectedPrice = Math.round(
    price * (1 + normalizedTrend + normalizedPriceChange) * 100
  ) / 100;

  // 2. Gross Revenue
  // revenue = expectedPrice * quantity
  const revenue = Math.round(expectedPrice * qty * 100) / 100;

  // Resolve crop default extras
  const cropKey = (crop || 'default').toLowerCase();
  const cropDefaults = CROP_DEFAULT_EXTRAS[cropKey] || CROP_DEFAULT_EXTRAS.default;

  // 3. Loading charges (Rs/quintal)
  const loadingPerQntl = Number(
    extraCosts.loadingPerQntl ??
    marketOverrides.loadingPerQntl ??
    cropDefaults.loadingPerQntl
  );
  const loading = Math.round(loadingPerQntl * qty * 100) / 100;

  // 4. Market fee (% of revenue)
  const marketFeePercent = Number(
    extraCosts.marketFeePercent ??
    marketOverrides.marketFeePercent ??
    cropDefaults.marketFeePercent
  );
  const marketFee = Math.round(revenue * (marketFeePercent / 100) * 100) / 100;

  // 5. Commission (% of revenue)
  const commissionPercent = Number(
    extraCosts.commissionPercent ??
    marketOverrides.commissionPercent ??
    cropDefaults.commissionPercent
  );
  const commission = Math.round(revenue * (commissionPercent / 100) * 100) / 100;

  // 6. Weighment charges (Rs/quintal)
  const weighmentPerQntl = Number(
    extraCosts.weighmentPerQntl ??
    marketOverrides.weighmentPerQntl ??
    cropDefaults.weighmentPerQntl
  );
  const weighment = Math.round(weighmentPerQntl * qty * 100) / 100;

  // 7. Wastage & transit spoilage
  // Can be specified as transit factor or fixed % of quantity
  const wastageFactor = Number(
    extraCosts.spoilageFactor ??
    cropDefaults.wastageFactor
  );
  const transitWastage = Math.round(revenue * wastageFactor * Math.min(dist, 300) * 100) / 100;
  const directWastage = extraCosts.wastagePercent !== undefined
    ? Math.round(revenue * (Number(extraCosts.wastagePercent) / 100) * 100) / 100
    : 0;
  const wastage = Math.max(transitWastage, directWastage);

  // 8. Storage cost for wait scenario
  const storageCostPerDay = Number(
    extraCosts.storageCostPerQntlDay ??
    cropDefaults.storageCostPerQntlDay
  );
  const storage = Math.round(storageCostPerDay * qty * Math.max(0, storageDays) * 100) / 100;

  // 9. Transport cost
  const transport = Math.round(Number(transportCost) * 100) / 100;

  // 10. Other costs
  const otherCosts = Math.round(
    (loading + marketFee + commission + weighment + wastage + storage) * 100
  ) / 100;

  const totalDeductions = Math.round((transport + otherCosts) * 100) / 100;

  // 11. Net Return
  // netReturn = revenue - transport - loading - marketFee - commission - wastage - storage
  const netReturn = Math.round((revenue - totalDeductions) * 100) / 100;
  const perQuintalNet = qty > 0 ? Math.round((netReturn / qty) * 100) / 100 : 0;

  return {
    modalPrice: price,
    expectedPrice,
    quantity: qty,
    revenue,
    transport,
    loading,
    marketFee,
    commission,
    weighment,
    wastage,
    storage,
    otherCosts,
    totalDeductions,
    netReturn,
    perQuintalNet
  };
}
