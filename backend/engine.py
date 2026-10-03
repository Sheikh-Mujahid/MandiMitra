"""
MandiMitra AI - Core Recommendation Engine (Python Backend Implementation)
Strictly adheres to:
- expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
- revenue = expectedPrice * quantity
- transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
- netReturn = revenue - transport - loading - marketFee - commission - wastage
- Prices are MODAL prices; label forecasts "estimate, not guaranteed"
- Sourced from daily-updated official mandi data
"""

import math
from typing import Dict, Any, List, Optional

VEHICLE_CAPACITIES = {
    "pickup": 15.0,        # Bolero / 1.5 tonne pickup (~15 quintals)
    "tata407": 30.0,       # 3.0 tonne LCV (~30 quintals)
    "tractor": 40.0,       # Tractor trolley (~40 quintals)
    "truck14ft": 60.0,     # 14ft medium truck (~60 quintals)
    "truck6wheeler": 120.0 # 6-wheeler truck (~120 quintals)
}

VEHICLE_BASE_RATES = {
    "pickup": 26.0,
    "tata407": 32.0,
    "tractor": 28.0,
    "truck14ft": 38.0,
    "truck6wheeler": 52.0
}

def determine_vehicles(quantity: float, vehicle_type: str = "auto") -> tuple[str, int]:
    if quantity <= 0:
        return "pickup", 1
    
    if vehicle_type in VEHICLE_CAPACITIES:
        cap = VEHICLE_CAPACITIES[vehicle_type]
        count = math.ceil(quantity / cap)
        return vehicle_type, max(1, count)
    
    # Auto-selection: find the vehicle type that minimizes wasted trips
    for v_type in ["pickup", "tata407", "tractor", "truck14ft", "truck6wheeler"]:
        if quantity <= VEHICLE_CAPACITIES[v_type]:
            return v_type, 1
    
    # Larger than 120 quintals: use 6-wheeler
    return "truck6wheeler", math.ceil(quantity / VEHICLE_CAPACITIES["truck6wheeler"])

def calculate_haversine_road_distance(lat1: float, lon1: float, lat2: float, lon2: float, road_factor: float = 1.28) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c * road_factor, 1)

def generate_why_chosen_explanation(top_mandi: Dict[str, Any], runner_up: Optional[Dict[str, Any]], nearest_mandi: Optional[Dict[str, Any]], crop_name: str) -> str:
    m_name = top_mandi["market"]["name"]
    net_return = top_mandi["netReturn"]
    expected_price = top_mandi["expectedPrice"]
    distance = top_mandi["distanceKm"]
    transport = top_mandi["transport"]

    if not runner_up or runner_up["market"]["id"] == top_mandi["market"]["id"]:
        return f"{m_name} offers the highest expected net return of ₹{net_return:,.0f} for your {crop_name} based on daily-updated official mandi modal prices."

    profit_diff = net_return - runner_up["netReturn"]
    runner_name = runner_up["market"]["name"]

    # Check if top mandi is farther but pays more net return:
    if nearest_mandi and nearest_mandi["market"]["id"] != top_mandi["market"]["id"]:
        near_name = nearest_mandi["market"]["name"]
        near_dist = nearest_mandi["distanceKm"]
        extra_dist = distance - near_dist
        if extra_dist > 0:
            return (
                f"Selected {m_name} because higher modal price (₹{expected_price:,.0f}/q) yields "
                f"₹{profit_diff:,.0f} more net profit than {runner_name}, comfortably absorbing "
                f"the extra ₹{transport:,.0f} transport cost across {extra_dist:.0f} additional km compared to {near_name}."
            )

    return (
        f"Selected {m_name} as #1 choice: yields ₹{profit_diff:,.0f} higher net profit than "
        f"{runner_name} due to favorable modal price (₹{expected_price:,.0f}/q) and optimized transport economics."
    )

def rank_markets(
    markets: List[Dict[str, Any]],
    price_records: List[Dict[str, Any]],
    crop: str,
    quantity: float,
    location: Any,
    vehicle: str = "auto",
    rate_per_km: Optional[float] = None,
    price_adjust: float = 0.0,
    round_trip: bool = False,
    extra_costs: Optional[Dict[str, Any]] = None,
    distances_data: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Ranks mandis by netReturn:
    expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
    revenue = expectedPrice * quantity
    transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
    netReturn = revenue - transport - loading - marketFee - commission - wastage
    """
    extra_costs = extra_costs or {}
    
    # Normalize priceAdjust if entered as percentage e.g. 5 -> 0.05
    user_price_change = price_adjust / 100.0 if abs(price_adjust) > 1.0 else price_adjust
    
    # Resolve vehicle and rate
    chosen_vehicle_type, vehicles_needed = determine_vehicles(quantity, vehicle)
    cost_per_km = rate_per_km if (rate_per_km is not None and rate_per_km > 0) else VEHICLE_BASE_RATES.get(chosen_vehicle_type, 30.0)
    trip_multiplier = 2 if round_trip else 1

    # Map markets by id
    market_map = {m["id"]: m for m in markets}
    
    # Resolve farmer location coordinates
    origin_lat, origin_lon = 20.0898, 74.1089 # default Niphad
    precomputed_distances = {}
    
    if isinstance(location, str) and distances_data:
        for origin in distances_data.get("farmerOrigins", []):
            if origin["id"] == location:
                origin_lat = origin["lat"]
                origin_lon = origin["lon"]
                precomputed_distances = origin.get("distancesKm", {})
                break
    elif isinstance(location, dict):
        origin_lat = location.get("lat", origin_lat)
        origin_lon = location.get("lon", origin_lon)
        if "distancesKm" in location:
            precomputed_distances = location["distancesKm"]

    results = []

    for prec in price_records:
        m_id = prec["marketId"]
        if m_id not in market_map:
            continue
        market = market_map[m_id]

        # 1. Road Distance
        if m_id in precomputed_distances:
            distance_km = float(precomputed_distances[m_id])
        else:
            distance_km = calculate_haversine_road_distance(origin_lat, origin_lon, market["lat"], market["lon"])

        # 2. Expected Price calculation
        modal_price = float(prec["modalPrice"])
        trend_adjustment = float(prec.get("trendAdjustment", 0.0))
        # expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
        expected_price = round(modal_price * (1.0 + trend_adjustment + user_price_change), 2)

        # 3. Revenue
        revenue = round(expected_price * quantity, 2)

        # 4. Transport cost
        # transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
        transport = round(vehicles_needed * distance_km * cost_per_km * trip_multiplier, 2)

        # 5. Extra & Market Costs
        loading_per_qntl = extra_costs.get("loadingPerQntl", market.get("loadingPerQntl", 12.0))
        loading = round(loading_per_qntl * quantity, 2)

        market_fee_percent = extra_costs.get("marketFeePercent", market.get("marketFeePercent", 1.0))
        market_fee = round(revenue * (market_fee_percent / 100.0), 2)

        commission_percent = extra_costs.get("commissionPercent", market.get("commissionPercent", 0.0))
        commission = round(revenue * (commission_percent / 100.0), 2)

        weighment_per_qntl = extra_costs.get("weighmentPerQntl", market.get("weighmentPerQntl", 6.0))
        weighment = round(weighment_per_qntl * quantity, 2)

        # Spoilage / wastage cost based on distance
        spoilage_rate = extra_costs.get("spoilageRate", 0.00015 * min(distance_km, 300))
        wastage = round(revenue * spoilage_rate, 2)

        other_costs = round(loading + market_fee + commission + weighment + wastage, 2)

        # 6. Net Return
        # netReturn = revenue - transport - loading - marketFee - commission - wastage
        net_return = round(revenue - transport - other_costs, 2)

        results.append({
            "market": market,
            "price": modal_price,
            "expectedPrice": expected_price,
            "distanceKm": distance_km,
            "transport": transport,
            "otherCosts": other_costs,
            "netReturn": net_return,
            "revenue": revenue,
            "trend": prec.get("trend", "STABLE"),
            "confidence": prec.get("confidence", 0.90),
            "dataAgeDays": prec.get("dataAgeDays", 0),
            "vehiclesNeeded": vehicles_needed,
            "vehicleType": chosen_vehicle_type,
            "costBreakdown": {
                "grossRevenue": revenue,
                "transport": transport,
                "loading": loading,
                "marketFee": market_fee,
                "commission": commission,
                "weighment": weighment,
                "wastage": wastage,
                "totalDeductions": round(transport + other_costs, 2)
            }
        })

    # Sort descending by netReturn
    results.sort(key=lambda x: x["netReturn"], reverse=True)

    # Assign ranks and explanations
    nearest_mandi = min(results, key=lambda x: x["distanceKm"]) if results else None
    runner_up = results[1] if len(results) > 1 else None

    for idx, item in enumerate(results):
        item["rank"] = idx + 1
        if idx == 0:
            item["whyChosen"] = generate_why_chosen_explanation(item, runner_up, nearest_mandi, crop)
        else:
            diff_from_top = results[0]["netReturn"] - item["netReturn"]
            item["whyChosen"] = f"Yields ₹{diff_from_top:,.0f} less net return than #{1} ({results[0]['market']['name']})."

    return results
