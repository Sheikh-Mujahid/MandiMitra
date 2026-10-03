/**
 * MandiMitra AI - Transport & Vehicle Logistics Module
 * 
 * Requirements:
 * - Vehicle presets: Tractor (capacity 40 q, Rs 25/km), Pickup (20 q, Rs 18/km), Truck (100 q, Rs 35/km).
 * - Rates editable.
 * - vehiclesNeeded = Math.ceil(quantity / capacity).
 * - Cost = vehicles * distanceKm * ratePerKm * (roundTrip ? 2 : 1).
 * - recommendVehicle(quantity, distanceKm): pick the cheapest vehicle type for the load.
 */

export const VEHICLE_PRESETS = {
  pickup: {
    id: 'pickup',
    name: 'Pickup (1.5-2T)',
    nameHi: 'पिकअप (20 क्विंटल)',
    nameMr: 'पिकअप (२० क्विंटल)',
    capacity: 20, // quintals (2 tonnes)
    capacityQntl: 20,
    defaultRatePerKm: 18,
    ratePerKm: 18,
    icon: 'Truck'
  },
  tractor: {
    id: 'tractor',
    name: 'Tractor Trolley (4T)',
    nameHi: 'ट्रैक्टर ट्रॉली (40 क्विंटल)',
    nameMr: 'ट्रॅक्टर ट्रॉली (४० क्विंटल)',
    capacity: 40, // quintals (4 tonnes)
    capacityQntl: 40,
    defaultRatePerKm: 25,
    ratePerKm: 25,
    icon: 'Tractor'
  },
  truck: {
    id: 'truck',
    name: 'Medium Truck (10T)',
    nameHi: 'ट्रक (100 क्विंटल)',
    nameMr: 'ट्रक (१०० क्विंटल)',
    capacity: 100, // quintals (10 tonnes)
    capacityQntl: 100,
    defaultRatePerKm: 35,
    ratePerKm: 35,
    icon: 'Truck'
  },
  // Additional presets for backwards-compatibility with rich UI
  tata407: {
    id: 'tata407',
    name: 'Tata 407 (3T)',
    nameHi: 'टाटा 407 (30 क्विंटल)',
    nameMr: 'टाटा ४०७ (३० क्विंटल)',
    capacity: 30,
    capacityQntl: 30,
    defaultRatePerKm: 22,
    ratePerKm: 22,
    icon: 'Truck'
  },
  truck6wheeler: {
    id: 'truck6wheeler',
    name: '6-Wheeler Heavy Truck (12T)',
    nameHi: '6-चक्का भारी ट्रक (120 क्विंटल)',
    nameMr: '६-चाकांचा मोठा ट्रक (१२० क्विंटल)',
    capacity: 120,
    capacityQntl: 120,
    defaultRatePerKm: 45,
    ratePerKm: 45,
    icon: 'Truck'
  }
};

/**
 * Calculates number of vehicles needed based on load quantity and capacity
 * @param {number} quantity - Quantity in quintals
 * @param {number} capacity - Capacity in quintals per vehicle
 * @returns {number}
 */
export function calculateVehiclesNeeded(quantity, capacity) {
  const qty = Math.max(0, Number(quantity) || 0);
  const cap = Math.max(0.1, Number(capacity) || 20);
  if (qty === 0) return 0;
  return Math.ceil(qty / cap);
}

/**
 * Calculates transport cost
 * @param {Object} params
 * @param {number} params.quantity - Quintals
 * @param {number} params.distanceKm - Distance one-way in km
 * @param {string} [params.vehicleType='pickup'] - Vehicle type id
 * @param {number} [params.ratePerKm] - Custom rate per km (editable)
 * @param {boolean} [params.roundTrip=false] - Whether freight charges round-trip
 * @returns {Object} { vehiclesNeeded, ratePerKm, cost, tripMultiplier }
 */
export function calculateTransportCost({
  quantity = 20,
  distanceKm = 0,
  vehicleType = 'pickup',
  ratePerKm = null,
  roundTrip = false,
  vehiclePresets = VEHICLE_PRESETS
} = {}) {
  const preset = vehiclePresets[vehicleType] || vehiclePresets.pickup;
  const vehiclesNeeded = calculateVehiclesNeeded(quantity, preset.capacity);
  const effectiveRate = (ratePerKm !== null && ratePerKm !== undefined && Number(ratePerKm) > 0)
    ? Number(ratePerKm)
    : preset.ratePerKm;
  const tripMultiplier = roundTrip ? 2 : 1;
  const cost = Math.round(vehiclesNeeded * Number(distanceKm) * effectiveRate * tripMultiplier * 100) / 100;

  return {
    vehicleType: preset.id,
    vehiclesNeeded,
    ratePerKm: effectiveRate,
    tripMultiplier,
    cost
  };
}

/**
 * Recommends the cheapest vehicle type for the given load and distance
 * @param {number} quantity - Quantity in quintals
 * @param {number} distanceKm - Distance in km
 * @param {Object} [customRates={}] - Optional custom per-km rates per vehicle type
 * @returns {Object} { vehicleType, cost, vehiclesNeeded, ratePerKm, comparison }
 */
export function recommendVehicle(quantity, distanceKm, customRates = {}, roundTrip = false) {
  const qty = Math.max(0.1, Number(quantity) || 0.1);
  const dist = Math.max(0, Number(distanceKm) || 0);

  // Compare core presets: pickup, tractor, truck
  const candidateKeys = ['pickup', 'tractor', 'truck'];
  let best = null;
  const comparison = [];

  for (const key of candidateKeys) {
    const preset = VEHICLE_PRESETS[key];
    const rate = customRates[key] !== undefined ? Number(customRates[key]) : preset.ratePerKm;
    const calc = calculateTransportCost({
      quantity: qty,
      distanceKm: dist,
      vehicleType: key,
      ratePerKm: rate,
      roundTrip
    });

    comparison.push({
      vehicleType: key,
      name: preset.name,
      capacity: preset.capacity,
      vehiclesNeeded: calc.vehiclesNeeded,
      ratePerKm: calc.ratePerKm,
      cost: calc.cost
    });

    if (!best || calc.cost < best.cost) {
      best = {
        vehicleType: key,
        cost: calc.cost,
        vehiclesNeeded: calc.vehiclesNeeded,
        ratePerKm: calc.ratePerKm,
        config: preset
      };
    }
  }

  return {
    ...best,
    comparison
  };
}

/**
 * Determines optimal vehicle and vehicles needed
 * Supports 'auto' selection or explicit vehicle ID
 */
export function determineVehicles(quantity, vehicleType = 'auto') {
  const qty = Math.max(0.1, Number(quantity) || 0.1);

  if (vehicleType && vehicleType !== 'auto' && VEHICLE_PRESETS[vehicleType]) {
    const config = VEHICLE_PRESETS[vehicleType];
    const count = Math.ceil(qty / config.capacity);
    return {
      vehicleType,
      vehiclesNeeded: Math.max(1, count),
      config
    };
  }

  // Auto-selection using recommendVehicle
  const rec = recommendVehicle(qty, 50);
  return {
    vehicleType: rec.vehicleType,
    vehiclesNeeded: rec.vehiclesNeeded,
    config: rec.config || VEHICLE_PRESETS[rec.vehicleType]
  };
}

