"""
MandiMitra AI - FastAPI Backend Server
Rules:
- Say "daily-updated official mandi data", never "live"
- Prices are MODAL prices; UI and API must state this clearly
- Label forecasts "estimate, not guaranteed"
- All numbers internally consistent
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
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

def load_json_file(filename: str) -> Any:
    filepath = DATA_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=500, detail=f"Data file {filename} missing")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

class RankRequest(BaseModel):
    crop: str = Field("onion", description="Crop identifier")
    quantity: float = Field(50.0, ge=0.1, description="Quantity in quintals")
    location: Any = Field("niphad_farm", description="Location ID or lat/lon dict")
    vehicle: str = Field("auto", description="Vehicle type (auto, pickup, tata407, tractor, truck14ft, truck6wheeler)")
    ratePerKm: Optional[float] = Field(None, description="Transport rate in ₹/km")
    priceAdjust: float = Field(0.0, description="Hypothetical price adjustment in % or decimal")
    roundTrip: bool = Field(False, description="Whether transport pays for round trip")
    extraCosts: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Overrides for loading, cess, etc.")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/status")
def get_system_status():
    last_updated = load_json_file("last_updated.json")
    return {
        "status": "online",
        "data_freshness": "daily-updated official mandi data",
        "price_type": "MODAL",
        "forecast_disclaimer": "estimate, not guaranteed",
        "metadata": last_updated
    }

@app.get("/api/markets")
def get_all_markets():
    return load_json_file("markets.json")

@app.get("/api/crops")
def get_crops():
    prices_data = load_json_file("prices.json")
    return prices_data.get("crops", [])

@app.get("/api/prices")
def get_prices(crop: str = Query("onion", description="Crop ID")):
    prices_data = load_json_file("prices.json")
    crop_prices = prices_data.get("marketPrices", {}).get(crop.lower())
    if not crop_prices:
        raise HTTPException(status_code=404, detail=f"No modal price data found for crop: {crop}")
    return {
        "crop": crop,
        "price_type": "MODAL",
        "disclaimer": "Prices are modal prices from daily-updated official mandi data. Forecasts are estimate, not guaranteed.",
        "records": crop_prices
    }

@app.get("/api/origins")
def get_farmer_origins():
    dist_data = load_json_file("distances.json")
    return dist_data.get("farmerOrigins", [])

@app.post("/api/rank")
def rank_mandi_recommendations(req: RankRequest):
    markets = load_json_file("markets.json")
    prices_data = load_json_file("prices.json")
    distances_data = load_json_file("distances.json")

    crop_prices = prices_data.get("marketPrices", {}).get(req.crop.lower())
    if not crop_prices:
        raise HTTPException(status_code=404, detail=f"No modal prices found for crop: {req.crop}")

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
        "recommendations": ranked
    }

@app.get("/api/history")
def get_price_history(crop: str = Query("onion"), market_id: Optional[str] = Query(None)):
    prices_data = load_json_file("prices.json")
    crop_prices = prices_data.get("marketPrices", {}).get(crop.lower(), [])
    if market_id:
        crop_prices = [p for p in crop_prices if p["marketId"] == market_id]
    return {
        "crop": crop,
        "price_type": "MODAL",
        "history": crop_prices
    }
