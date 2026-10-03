"""
MandiMitra AI - FastAPI Backend Server
Rules & Requirements:
- Say "daily-updated official mandi data", never "live"
- Prices are MODAL prices; UI and API must state this clearly
- Label forecasts "estimate, not guaranteed"
- All numbers internally consistent

Endpoints required by Task 4:
- GET /markets -> markets.json
- GET /crops -> available crops
- GET /prices?crop=&market= -> history for a crop (optionally one market)
- GET /distances?from= -> distances from a farmer location to all mandis
- GET /data-status -> latest record date per mandi, fetch timestamp, data source (official or sample), freshness status (fresh <=1 day, aging 2-3 days, stale >3)
- Read from /data files, cache in memory, reload when files change. Proper error responses and CORS.
"""

import json
import os
import time
import urllib.request
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.engine import rank_markets

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

app = FastAPI(
    title="MandiMitra AI API",
    description="Smart Market Recommendation Platform for Farmers (Daily-updated official mandi data)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache with modification-time invalidation
_FILE_CACHE: Dict[str, Any] = {}
_FILE_MTIMES: Dict[str, float] = {}

def get_cached_json(filename: str) -> Any:
    """
    Loads JSON from DATA_DIR with in-memory caching and auto-reload on file modification.
    """
    filepath = DATA_DIR / filename
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data file '{filename}' is missing from {DATA_DIR}"
        )
    
    current_mtime = os.path.getmtime(filepath)
    if filename not in _FILE_CACHE or _FILE_MTIMES.get(filename) != current_mtime:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            _FILE_CACHE[filename] = data
            _FILE_MTIMES[filename] = current_mtime
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid JSON in data file '{filename}': {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read data file '{filename}': {str(e)}"
            )

    return _FILE_CACHE[filename]

class RankRequest(BaseModel):
    crop: str = Field("soybean", description="Crop identifier (e.g. soybean, wheat, gram_chana)")
    quantity: float = Field(50.0, gt=0, description="Harvest quantity in quintals")
    location: Any = Field("morshi_town", description="Farmer location ID or lat/lon coordinates")
    vehicle: str = Field("pickup", description="Vehicle preset (pickup, tractor, truck, or auto)")
    ratePerKm: Optional[float] = Field(None, description="Editable freight rate in ₹/km")
    priceAdjust: float = Field(0.0, description="What-if price adjustment in % or decimal")
    roundTrip: bool = Field(False, description="Whether haulage pays for round-trip return")
    extraCosts: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Overrides for loading, cess, etc.")

# --- HEALTH & STATUS ---

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/data-status")
@app.get("/api/data-status")
def get_data_status():
    """
    Latest record date per mandi, fetch timestamp, data source (official or sample),
    and freshness status (fresh <=1 day, aging 2-3 days, stale >3).
    """
    last_updated = get_cached_json("last_updated.json")
    prices_data = get_cached_json("prices.json")

    timestamp_str = last_updated.get("timestamp")
    source_type = last_updated.get("sourceType", "sample")
    data_source = last_updated.get("dataSource", "Daily official mandi records")

    # Analyze max dataAgeDays across prices or compute from record dates
    records_by_mandi = last_updated.get("latestRecordsByMandiCrop", {})
    
    max_age_days = 0
    today = date.today()

    # Scan records to determine freshness
    for prec_date_str in records_by_mandi.values():
        try:
            d = datetime.strptime(prec_date_str, "%Y-%m-%d").date()
            age = (today - d).days
            if age > max_age_days:
                max_age_days = age
        except Exception:
            pass

    # Determine freshness status: fresh <=1 day, aging 2-3 days, stale >3
    if max_age_days <= 1:
        freshness_status = "fresh"
    elif max_age_days <= 3:
        freshness_status = "aging"
    else:
        freshness_status = "stale"

    return {
        "status": "online",
        "fetchTimestamp": timestamp_str,
        "dataSource": data_source,
        "sourceType": source_type,
        "freshnessStatus": freshness_status,
        "maxAgeDays": max_age_days,
        "priceBasis": "MODAL",
        "dataFrequency": "daily-updated official mandi data",
        "forecastDisclaimer": "estimate, not guaranteed",
        "latestRecordsByMandiCrop": records_by_mandi,
        "note": "Modal prices from official mandi data; actual price depends on quality and grade."
    }

@app.get("/api/status")
def get_system_status():
    return get_data_status()

# --- MARKETS ---

@app.get("/markets")
@app.get("/api/markets")
def get_all_markets():
    """Returns markets from markets.json"""
    raw = get_cached_json("markets.json")
    markets_list = raw.get("markets", raw) if isinstance(raw, dict) else raw
    return {
        "markets": markets_list,
        "count": len(markets_list)
    }

# --- CROPS ---

@app.get("/crops")
@app.get("/api/crops")
def get_available_crops():
    """Returns available crops from prices.json"""
    prices_data = get_cached_json("prices.json")
    crops = prices_data.get("crops", [])
    return {
        "crops": crops,
        "count": len(crops)
    }

# --- PRICES ---

@app.get("/prices")
@app.get("/api/prices")
def get_prices(
    crop: str = Query("soybean", description="Crop identifier"),
    market: Optional[str] = Query(None, description="Optional market_id filter")
):
    """
    History for a crop (optionally one market)
    """
    prices_data = get_cached_json("prices.json")
    crop_key = crop.lower()
    crop_prices = prices_data.get("marketPrices", {}).get(crop_key)

    if not crop_prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No modal price data found for crop '{crop}'"
        )

    if market:
        filtered = [p for p in crop_prices if (p.get("marketId") == market or p.get("market_id") == market)]
        if not filtered:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No price records found for market '{market}' trading '{crop}'"
            )
        return {
            "crop": crop_key,
            "marketId": market,
            "priceType": "MODAL",
            "records": filtered,
            "note": "Modal prices from official mandi data; actual price depends on quality and grade."
        }

    return {
        "crop": crop_key,
        "priceType": "MODAL",
        "records": crop_prices,
        "note": "Modal prices from official mandi data; actual price depends on quality and grade."
    }

# --- DISTANCES ---

@app.get("/distances")
@app.get("/api/distances")
def get_distances(
    from_loc: Optional[str] = Query(None, alias="from", description="Farmer location identifier")
):
    """
    Returns distances from a farmer location to all mandis, or full distance matrix.
    """
    dist_data = get_cached_json("distances.json")
    origins = dist_data.get("farmerOrigins", [])

    if from_loc:
        normalized = from_loc.lower().strip()
        matched = next(
            (o for o in origins if o.get("id") == normalized or o.get("location_id") == normalized),
            None
        )
        if not matched:
            # Try partial matching
            matched = next(
                (o for o in origins if normalized in o.get("id", "").lower() or normalized in o.get("name", "").lower()),
                None
            )

        if not matched:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farmer location '{from_loc}' not found in registered origins."
            )

        return {
            "from": matched.get("id"),
            "name": matched.get("name"),
            "district": matched.get("district"),
            "lat": matched.get("lat"),
            "lon": matched.get("lon"),
            "distancesKm": matched.get("distancesKm", {}),
            "routeDetails": matched.get("routeDetails", {})
        }

    return {
        "roadWindingFactor": dist_data.get("roadWindingFactor", 1.3),
        "farmerOrigins": origins
    }

@app.get("/api/origins")
def get_origins():
    dist_data = get_cached_json("distances.json")
    return dist_data.get("farmerOrigins", [])

# --- WEATHER FORECAST ENDPOINTS (Open-Meteo, 30-min in-memory cache) ---

_WEATHER_CACHE: Dict[str, Any] = {}
_WEATHER_TIMESTAMPS: Dict[str, float] = {}
WEATHER_CACHE_TTL = 1800.0 # 30 minutes

def fetch_open_meteo_forecast(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetches 3-day daily weather forecast from Open-Meteo with in-memory caching and safe fallback.
    Never crashes the application.
    """
    cache_key = f"{round(lat, 4)}_{round(lon, 4)}"
    now = time.time()

    # Check unexpired cache
    if cache_key in _WEATHER_CACHE:
        age = now - _WEATHER_TIMESTAMPS.get(cache_key, 0)
        if age < WEATHER_CACHE_TTL:
            return _WEATHER_CACHE[cache_key]

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&daily=weather_code,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"
        f"&timezone=Asia%2FKolkata&forecast_days=3"
    )

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MandiMitraAI/1.0"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            if resp.status == 200:
                raw_data = json.loads(resp.read().decode())
                daily = raw_data.get("daily", {})
                formatted = {
                    "latitude": lat,
                    "longitude": lon,
                    "status": "available",
                    "updatedAt": datetime.now().strftime("%I:%M %p"),
                    "daily": {
                        "time": daily.get("time", []),
                        "weather_code": daily.get("weather_code", []),
                        "temperature_2m_max": daily.get("temperature_2m_max", []),
                        "precipitation_sum": daily.get("precipitation_sum", []),
                        "precipitation_probability_max": daily.get("precipitation_probability_max", []),
                        "wind_speed_10m_max": daily.get("wind_speed_10m_max", [])
                    },
                    "source": "Open-Meteo",
                    "notice": "Forecasts are estimates and may change."
                }
                _WEATHER_CACHE[cache_key] = formatted
                _WEATHER_TIMESTAMPS[cache_key] = now
                return formatted
    except Exception:
        # Fallback to stale cached data if available
        if cache_key in _WEATHER_CACHE:
            return _WEATHER_CACHE[cache_key]

    # Graceful fallback: weather unavailable
    return {
        "latitude": lat,
        "longitude": lon,
        "status": "unavailable",
        "updatedAt": None,
        "daily": None,
        "message": "Weather service currently unavailable. No risk penalty applied.",
        "notice": "Forecasts are estimates and may change."
    }

@app.get("/weather")
@app.get("/api/weather")
def get_weather(lat: float = Query(..., description="Latitude"), lon: float = Query(..., description="Longitude")):
    return fetch_open_meteo_forecast(lat, lon)

@app.get("/weather/mandis")
@app.get("/api/weather/mandis")
def get_mandis_weather():
    raw_markets = get_cached_json("markets.json")
    markets = raw_markets.get("markets", raw_markets) if isinstance(raw_markets, dict) else raw_markets

    mandis_weather = {}
    for m in markets:
        m_id = m.get("market_id") or m.get("id")
        lat = m.get("latitude") or m.get("lat")
        lon = m.get("longitude") or m.get("lon")
        if lat and lon:
            mandis_weather[m_id] = fetch_open_meteo_forecast(float(lat), float(lon))
        else:
            mandis_weather[m_id] = {
                "status": "unavailable",
                "notice": "Forecasts are estimates and may change."
            }

    return {
        "status": "ok",
        "updatedAt": datetime.now().strftime("%I:%M %p"),
        "mandis": mandis_weather,
        "notice": "Forecasts are estimates and may change."
    }

# --- RANKING RECOMMENDATIONS ---

@app.post("/api/rank")
@app.post("/rank")
def rank_mandi_recommendations(req: RankRequest):
    raw_markets = get_cached_json("markets.json")
    markets = raw_markets.get("markets", raw_markets) if isinstance(raw_markets, dict) else raw_markets
    prices_data = get_cached_json("prices.json")
    distances_data = get_cached_json("distances.json")

    crop_prices = prices_data.get("marketPrices", {}).get(req.crop.lower())
    if not crop_prices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No modal prices found for crop: {req.crop}"
        )

    ranked = rank_markets(
        markets=markets,
        price_records=crop_prices,
        crop=req.crop,
        quantity=req.quantity,
        location=req.location,
        vehicle=req.vehicle,
        rate_per_km=req.ratePerKm,
        price_adjust=req.priceAdjust,
        round_trip=req.roundTrip,
        extra_costs=req.extraCosts,
        distances_data=distances_data
    )

    return {
        "crop": req.crop,
        "quantity": req.quantity,
        "price_basis": "MODAL",
        "data_frequency": "daily-updated official mandi data",
        "forecast_label": "estimate, not guaranteed",
        "note": "Modal prices from official mandi data; actual price depends on quality and grade.",
        "recommendations": ranked
    }
