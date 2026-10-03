import json
from pathlib import Path
from backend.engine import rank_markets, determine_vehicles, calculate_haversine_road_distance
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_status_endpoint_rules():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["data_freshness"] == "daily-updated official mandi data"
    assert data["price_type"] == "MODAL"
    assert "estimate, not guaranteed" in data["forecast_disclaimer"]

def test_core_formula_mathematical_consistency():
    markets = [
        {
            "id": "test_mandi_1",
            "name": "Test Mandi 1",
            "state": "Maharashtra",
            "district": "Nashik",
            "lat": 20.0,
            "lon": 74.0,
            "marketFeePercent": 1.0,
            "commissionPercent": 0.0,
            "weighmentPerQntl": 5.0,
            "loadingPerQntl": 10.0
        }
    ]
    prices = [
        {
            "marketId": "test_mandi_1",
            "modalPrice": 2000.0,
            "trendAdjustment": 0.05, # +5%
            "confidence": 0.95,
            "dataAgeDays": 0
        }
    ]
    distances_data = {
        "farmerOrigins": [
            {
                "id": "test_origin",
                "lat": 20.0,
                "lon": 74.0,
                "distancesKm": {"test_mandi_1": 50}
            }
        ]
    }

    # Parameters
    quantity = 30.0 # quintals -> 1 Tata407 (capacity 30)
    rate_per_km = 30.0
    price_adjust = 0.0
    round_trip = False

    ranked = rank_markets(
        markets=markets,
        price_records=prices,
        crop="onion",
        quantity=quantity,
        location="test_origin",
        vehicle="tata407",
        rate_per_km=rate_per_km,
        price_adjust=price_adjust,
        round_trip=round_trip,
        extra_costs={"spoilageRate": 0.0},
        distances_data=distances_data
    )

    result = ranked[0]
    # Expected price = modalPrice * (1 + 0.05 + 0) = 2000 * 1.05 = 2100
    assert result["expectedPrice"] == 2100.0
    # Revenue = 2100 * 30 = 63000
    assert result["revenue"] == 63000.0
    # Transport = 1 * 50 * 30 * 1 = 1500
    assert result["transport"] == 1500.0
    # Loading = 10 * 30 = 300
    # Market fee = 63000 * 0.01 = 630
    # Commission = 0
    # Weighment = 5 * 30 = 150
    # Wastage = 0
    expected_other = 300 + 630 + 150 # 1080
    assert result["otherCosts"] == 1080.0
    # Net return = 63000 - 1500 - 1080 = 60420
    assert result["netReturn"] == 60420.0

def test_rank_api_endpoint():
    payload = {
        "crop": "onion",
        "quantity": 50.0,
        "location": "niphad_farm",
        "vehicle": "auto",
        "ratePerKm": 30.0,
        "priceAdjust": 5.0, # +5%
        "roundTrip": False
    }
    response = client.post("/api/rank", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["price_basis"] == "MODAL"
    assert data["data_frequency"] == "daily-updated official mandi data"
    assert len(data["recommendations"]) > 0
    # Top ranked mandi must have rank == 1
    assert data["recommendations"][0]["rank"] == 1
    # Check that netReturn is strictly descending
    net_returns = [r["netReturn"] for r in data["recommendations"]]
    assert net_returns == sorted(net_returns, reverse=True)
