#!/usr/bin/env python3
"""
MandiMitra AI - Road Distance & Duration Matrix Builder
Computes road distance (km) and travel duration from every farmer start location to every mandi.
Uses OSRM public API with disk caching and polite timeout.
Falls back to calibrated Haversine x 1.3 when offline, rate-limited, or slow.
Stores the calculation method used ('osrm' or 'haversine_fallback').
"""

import json
import time
import math
import urllib.request
import urllib.parse
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_FILE = DATA_DIR / ".osrm_distance_cache.json"

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_haversine_fallback(lat1: float, lon1: float, lat2: float, lon2: float) -> tuple[float, float]:
    direct_km = haversine_km(lat1, lon1, lat2, lon2)
    road_km = round(direct_km * 1.3, 1) # Road winding factor 1.3
    # Estimated truck speed ~ 40 km/h + 20 mins handling
    duration_minutes = round((road_km / 40.0) * 60 + 20)
    return road_km, duration_minutes

def build_distances():
    markets_file = DATA_DIR / "markets.json"
    distances_file = DATA_DIR / "distances.json"

    if not markets_file.exists():
        print(f"[Error] {markets_file} missing!", flush=True)
        return

    with open(markets_file, "r", encoding="utf-8") as f:
        m_data = json.load(f)

    markets = m_data.get("markets", [])
    farmer_locations = m_data.get("farmer_locations", [])

    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except Exception:
            cache = {}

    print(f"[MandiMitra] Building distance matrix for {len(farmer_locations)} origins and {len(markets)} mandis...", flush=True)

    # Test OSRM probe
    use_osrm = True
    try:
        probe_url = "https://router.project-osrm.org/route/v1/driving/77.75,20.93;77.00,20.70?overview=false"
        req = urllib.request.Request(probe_url, headers={"User-Agent": "MandiMitra-Agent/1.0"})
        with urllib.request.urlopen(req, timeout=1.5) as res:
            if res.status != 200:
                use_osrm = False
    except Exception:
        use_osrm = False
        print("[MandiMitra] OSRM public server unreachable or slow. Using calibrated Haversine x 1.3 fallback.", flush=True)

    farmer_origins_output = []
    methods_used = set()

    for origin in farmer_locations:
        o_id = origin.get("location_id") or origin.get("id")
        o_lat = origin["latitude"]
        o_lon = origin["longitude"]
        
        origin_distances = {}
        origin_routes = {}

        for mandi in markets:
            m_id = mandi.get("market_id") or mandi.get("id")
            m_lat = mandi["latitude"]
            m_lon = mandi["longitude"]

            cache_key = f"{round(o_lat, 4)},{round(o_lon, 4)}->{round(m_lat, 4)},{round(m_lon, 4)}"
            
            dist_km = None
            dur_min = None
            method = "haversine_fallback"

            if cache_key in cache:
                cached = cache[cache_key]
                dist_km = cached["distance_km"]
                dur_min = cached["duration_minutes"]
                method = cached["method"]
            elif use_osrm:
                try:
                    url = f"https://router.project-osrm.org/route/v1/driving/{o_lon},{o_lat};{m_lon},{m_lat}?overview=false"
                    req = urllib.request.Request(url, headers={"User-Agent": "MandiMitra-Agent/1.0"})
                    with urllib.request.urlopen(req, timeout=1.5) as response:
                        if response.status == 200:
                            data = json.loads(response.read().decode("utf-8"))
                            routes = data.get("routes", [])
                            if routes:
                                dist_km = round(routes[0].get("distance", 0) / 1000.0, 1)
                                dur_min = round(routes[0].get("duration", 0) / 60.0)
                                method = "osrm"
                                cache[cache_key] = {
                                    "distance_km": dist_km,
                                    "duration_minutes": dur_min,
                                    "method": "osrm"
                                }
                                time.sleep(0.2)
                except Exception:
                    pass

            if dist_km is None or dur_min is None:
                dist_km, dur_min = calculate_haversine_fallback(o_lat, o_lon, m_lat, m_lon)
                method = "haversine_fallback"
                cache[cache_key] = {
                    "distance_km": dist_km,
                    "duration_minutes": dur_min,
                    "method": method
                }

            methods_used.add(method)
            origin_distances[m_id] = dist_km
            origin_routes[m_id] = {
                "distanceKm": dist_km,
                "durationMinutes": dur_min,
                "durationHours": round(dur_min / 60.0, 1),
                "method": method
            }

        farmer_origins_output.append({
            "id": o_id,
            "location_id": o_id,
            "name": origin["name"],
            "district": origin.get("district", ""),
            "lat": o_lat,
            "lon": o_lon,
            "description": origin.get("description", ""),
            "distancesKm": origin_distances,
            "routeDetails": origin_routes
        })

    # Save disk cache
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception:
        pass

    final_payload = {
        "roadWindingFactor": 1.3,
        "calculationMethods": sorted(list(methods_used)),
        "farmerOrigins": farmer_origins_output
    }

    with open(distances_file, "w", encoding="utf-8") as f:
        json.dump(final_payload, f, indent=2, ensure_ascii=False)

    print(f"[MandiMitra] Successfully saved distances to {distances_file.name}. Methods: {sorted(list(methods_used))}", flush=True)

if __name__ == "__main__":
    build_distances()
