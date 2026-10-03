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

def test_data_status_endpoint():
    response = client.get("/data-status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["priceBasis"] == "MODAL"
    assert data["freshnessStatus"] in ["fresh", "aging", "stale"]
    assert "fetchTimestamp" in data
    assert "latestRecordsByMandiCrop" in data
    assert "Modal prices from official mandi data" in data["note"]

def test_get_markets_endpoint():
    response = client.get("/markets")
    assert response.status_code == 200
    data = response.json()
    assert "markets" in data
    assert len(data["markets"]) >= 8
    first = data["markets"][0]
    assert "name" in first
    assert "district" in first

def test_get_crops_endpoint():
    response = client.get("/crops")
    assert response.status_code == 200
    data = response.json()
    assert "crops" in data
    assert len(data["crops"]) >= 3
    crop_ids = [c["id"] for c in data["crops"]]
    assert "soybean" in crop_ids

def test_get_prices_endpoint():
    # Full crop history
    response = client.get("/prices?crop=soybean")
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "soybean"
    assert data["priceType"] == "MODAL"
    assert len(data["records"]) > 0

    # Specific market filter
    m_id = data["records"][0]["marketId"]
    resp_market = client.get(f"/prices?crop=soybean&market={m_id}")
    assert resp_market.status_code == 200
    m_data = resp_market.json()
    assert m_data["marketId"] == m_id
    assert len(m_data["records"]) == 1

def test_get_distances_endpoint():
    # From specific location
    response = client.get("/distances?from=morshi_town")
    assert response.status_code == 200
    data = response.json()
    assert data["from"] == "morshi_town"
    assert "distancesKm" in data
    assert len(data["distancesKm"]) >= 8

    # All origins
    resp_all = client.get("/distances")
    assert resp_all.status_code == 200
    all_data = resp_all.json()
    assert "farmerOrigins" in all_data

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
        "crop": "soybean",
        "quantity": 50.0,
        "location": "morshi_town",
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

def test_weather_endpoint():
    response = client.get("/weather?lat=20.932&lon=77.7523")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["available", "unavailable"]
    assert "notice" in data

def test_weather_mandis_endpoint():
    response = client.get("/weather/mandis")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "mandis" in data
    assert len(data["mandis"]) >= 8
    assert "notice" in data

def test_weather_failure_fallback(monkeypatch):
    import urllib.request
    def mock_urlopen(*args, **kwargs):
        raise urllib.error.URLError("Network unreachable")
    
    monkeypatch.setattr(urllib.request, "urlopen", mock_urlopen)
    # Query with a coordinate that hasn't been cached
    response = client.get("/weather?lat=99.999&lon=99.999")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unavailable"
    assert "unavailable" in data["message"].lower()
    assert data["daily"] is None

