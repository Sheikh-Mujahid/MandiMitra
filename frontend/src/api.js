/**
 * MandiMitra AI - Frontend Data & API Layer
 * 
 * Provides unified data access to FastAPI backend endpoints:
 * - GET /markets
 * - GET /crops
 * - GET /prices?crop=&market=
 * - GET /distances?from=
 * - GET /data-status
 * 
 * Includes in-memory caching and offline/local JSON fallback
 * so that both local FastAPI server and GitHub Pages static hosting work seamlessly.
 */

import fallbackMarkets from '../../data/markets.json';
import fallbackPrices from '../../data/prices.json';
import fallbackDistances from '../../data/distances.json';
import fallbackLastUpdated from '../../data/last_updated.json';

// Use local FastAPI backend if running, or custom environment variable
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000';

let _cache = {
  markets: null,
  crops: null,
  prices: {},
  distances: null,
  dataStatus: null,
  isLiveApiAvailable: null
};

/**
 * Checks if the FastAPI backend server is responsive
 */
export async function checkBackendHealth() {
  if (_cache.isLiveApiAvailable !== null) {
    return _cache.isLiveApiAvailable;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const resp = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    _cache.isLiveApiAvailable = resp.ok;
    return resp.ok;
  } catch {
    _cache.isLiveApiAvailable = false;
    return false;
  }
}

/**
 * Fetches markets list
 */
export async function fetchMarkets() {
  if (_cache.markets) return _cache.markets;

  const isLive = await checkBackendHealth();
  if (isLive) {
    try {
      const resp = await fetch(`${API_BASE_URL}/markets`);
      if (resp.ok) {
        const data = await resp.json();
        _cache.markets = data.markets || data;
        return _cache.markets;
      }
    } catch (e) {
      console.warn('Fallback to local markets data:', e);
    }
  }

  _cache.markets = fallbackMarkets.markets || fallbackMarkets;
  return _cache.markets;
}

/**
 * Fetches available crops
 */
export async function fetchCrops() {
  if (_cache.crops) return _cache.crops;

  const isLive = await checkBackendHealth();
  if (isLive) {
    try {
      const resp = await fetch(`${API_BASE_URL}/crops`);
      if (resp.ok) {
        const data = await resp.json();
        _cache.crops = data.crops || data;
        return _cache.crops;
      }
    } catch (e) {
      console.warn('Fallback to local crops data:', e);
    }
  }

  _cache.crops = fallbackPrices.crops || [];
  return _cache.crops;
}

/**
 * Fetches modal price records for a crop (optionally filtered by market)
 */
export async function fetchPrices(crop = 'soybean', marketId = null) {
  const cacheKey = `${crop.toLowerCase()}_${marketId || 'all'}`;
  if (_cache.prices[cacheKey]) return _cache.prices[cacheKey];

  const isLive = await checkBackendHealth();
  if (isLive) {
    try {
      const url = new URL(`${API_BASE_URL}/prices`);
      url.searchParams.set('crop', crop.toLowerCase());
      if (marketId) url.searchParams.set('market', marketId);

      const resp = await fetch(url.toString());
      if (resp.ok) {
        const data = await resp.json();
        _cache.prices[cacheKey] = data;
        return data;
      }
    } catch (e) {
      console.warn('Fallback to local prices data:', e);
    }
  }

  // Local fallback
  const cropPrices = fallbackPrices.marketPrices?.[crop.toLowerCase()] || [];
  const records = marketId
    ? cropPrices.filter((p) => (p.marketId === marketId || p.market_id === marketId))
    : cropPrices;

  const result = {
    crop: crop.toLowerCase(),
    priceType: 'MODAL',
    records,
    note: 'Modal prices from official mandi data; actual price depends on quality and grade.'
  };

  _cache.prices[cacheKey] = result;
  return result;
}

/**
 * Fetches distances from a farmer location or all origins
 */
export async function fetchDistances(fromLoc = null) {
  const isLive = await checkBackendHealth();
  if (isLive) {
    try {
      const url = new URL(`${API_BASE_URL}/distances`);
      if (fromLoc) url.searchParams.set('from', fromLoc);

      const resp = await fetch(url.toString());
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Fallback to local distances data:', e);
    }
  }

  if (fromLoc) {
    const origin = fallbackDistances.farmerOrigins?.find(
      (o) => (o.id || o.location_id) === fromLoc
    );
    if (origin) {
      return {
        from: origin.id,
        name: origin.name,
        district: origin.district,
        lat: origin.lat,
        lon: origin.lon,
        distancesKm: origin.distancesKm,
        routeDetails: origin.routeDetails || {}
      };
    }
  }

  return fallbackDistances;
}

/**
 * Fetches data status, latest dates per mandi, and freshness rating
 */
export async function fetchDataStatus() {
  if (_cache.dataStatus) return _cache.dataStatus;

  const isLive = await checkBackendHealth();
  if (isLive) {
    try {
      const resp = await fetch(`${API_BASE_URL}/data-status`);
      if (resp.ok) {
        _cache.dataStatus = await resp.json();
        return _cache.dataStatus;
      }
    } catch (e) {
      console.warn('Fallback to local data-status:', e);
    }
  }

  _cache.dataStatus = {
    status: 'online',
    fetchTimestamp: fallbackLastUpdated.timestamp,
    dataSource: fallbackLastUpdated.dataSource,
    sourceType: fallbackLastUpdated.sourceType || 'sample',
    freshnessStatus: 'fresh',
    priceBasis: 'MODAL',
    dataFrequency: 'daily-updated official mandi data',
    forecastDisclaimer: 'estimate, not guaranteed',
    latestRecordsByMandiCrop: fallbackLastUpdated.latestRecordsByMandiCrop,
    note: 'Modal prices from official mandi data; actual price depends on quality and grade.'
  };

  return _cache.dataStatus;
}

/**
 * Preloads all essential datasets in parallel
 */
export async function loadAppData() {
  const [markets, crops, dataStatus, distances] = await Promise.all([
    fetchMarkets(),
    fetchCrops(),
    fetchDataStatus(),
    fetchDistances()
  ]);

  return {
    markets,
    crops,
    dataStatus,
    distances,
    isLiveApi: Boolean(_cache.isLiveApiAvailable)
  };
}

export default {
  fetchMarkets,
  fetchCrops,
  fetchPrices,
  fetchDistances,
  fetchDataStatus,
  loadAppData,
  checkBackendHealth
};
