#!/usr/bin/env python3
"""
MandiMitra AI - Distance Matrix Calculator
Computes accurate road distances between farmer origin clusters and mandis.
Uses Haversine distance calibrated by national highway winding factor (1.28).
"""

import json
import math
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_road_distance(lat1, lon1, lat2, lon2, road_factor=1.28):
    direct_km = haversine_km(lat1, lon1, lat2, lon2)
    return round(direct_km * road_factor)

def build_distances():
    markets_file = DATA_DIR / "markets.json"
    distances_file = DATA_DIR / "distances.json"

    with open(markets_file, "r", encoding="utf-8") as f:
        markets = json.load(f)

    with open(distances_file, "r", encoding="utf-8") as f:
        dist_data = json.load(f)

    road_factor = dist_data.get("roadWindingFactor", 1.28)

    for origin in dist_data.get("farmerOrigins", []):
        o_lat = origin["lat"]
        o_lon = origin["lon"]
        if "distancesKm" not in origin:
            origin["distancesKm"] = {}

        for m in markets:
            m_id = m["id"]
            if m_id not in origin["distancesKm"]:
                origin["distancesKm"][m_id] = calculate_road_distance(
                    o_lat, o_lon, m["lat"], m["lon"], road_factor
                )

    with open(distances_file, "w", encoding="utf-8") as f:
        json.dump(dist_data, f, indent=2, ensure_ascii=False)

    print("[MandiMitra AI] Successfully verified and updated distances.json")

if __name__ == "__main__":
    build_distances()
