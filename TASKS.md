# MandiMitra AI - Development Tasks Checklist

## TASK 1: Project Setup
- [x] Create project directory structure (`frontend/`, `backend/`, `data/`, `scripts/`, `.github/workflows/`)
- [x] Initialize Git repository with comprehensive `.gitignore` (`node_modules`, `.env`, `__pycache__`, `venv`, `dist`)
- [x] Scaffold frontend with Vite + React + Tailwind CSS
- [x] Scaffold backend with FastAPI: `backend/main.py` with `GET /health` returning `{"status": "ok"}`, CORS enabled, and `requirements.txt`
- [x] Add `.env.example` with `DATA_GOV_API_KEY` and `RESOURCE_ID` placeholders
- [x] Create `README.md` skeleton and `TASKS.md` 6-task checklist
- [x] Verify both frontend and backend servers start without errors
- [x] Commit: `chore: initialize repo with frontend and backend scaffolds`

---

## TASK 2: Data Layer + Daily Update Pipeline
- [x] `data/markets.json`: 8 Maharashtra mandis (Amravati, Akola, Nagpur, Yavatmal, Washim, Buldhana, Wardha, Achalpur) with `market_id`, name, district, state, latitude, longitude, and farmer start locations with coordinates
- [x] `scripts/fetch_prices.py`:
  - Reads `DATA_GOV_API_KEY` and `RESOURCE_ID` from environment variables
  - Calls data.gov.in mandi price API filtered by `state=Maharashtra` and commodities (Wheat, Soybean, Gram/Chana)
  - Cleans data: parses dates, drops zero/invalid prices, normalizes market names against `markets.json`
  - Merges into `data/prices.json` keeping 60 days of history
  - Writes `data/last_updated.json` with latest dates per mandi/crop and fetch timestamp
  - Exponential backoff retry with graceful offline snapshot preservation
  - `--offline` flag generating realistic 30-day sample history with random walk and `"source": "sample"`
- [x] `scripts/build_distances.py`:
  - Calculates road distance and duration between farmer start locations and mandis
  - OSRM public API with polite rate-limiting, disk cache, and Haversine x 1.3 fallback
  - Records calculation method used (`osrm` or `haversine_fallback`)
- [x] `.github/workflows/daily-update.yml`:
  - Cron scheduled at 01:00 UTC (6:30 AM IST) + `workflow_dispatch`
  - Uses GitHub repository secrets `DATA_GOV_API_KEY` and `RESOURCE_ID`
  - Commits and pushes changed data files
- [x] Generate 30-day initial offline snapshot for demo and add `scripts/README.md`
- [x] Commit: `feat(data): add mandi data, price fetch pipeline, daily update workflow`

---

## TASK 3: Recommendation Engine in `frontend/src/engine/` (Pure JS) with Unit Tests (Vitest)
- [x] `frontend/src/engine/transport.js`:
  - Vehicle presets: Tractor (40q, ₹25/km), Pickup (20q, ₹18/km), Truck (100q, ₹35/km), plus Tata 407 & 6-Wheeler
  - Editable rates support
  - `vehiclesNeeded = Math.ceil(quantity / capacity)`
  - `cost = vehicles * distanceKm * ratePerKm * (roundTrip ? 2 : 1)`
  - `recommendVehicle(quantity, distanceKm)`: picks cheapest vehicle type for load
- [x] `frontend/src/engine/trend.js`:
  - From price history: 7-day change %, 30-day change %, moving average, regression slope, volatility (std dev)
  - `trendLabel`: Rising / Falling / Stable (configurable threshold)
  - `trendAdjustment`: damped near-term adjustment (capped at ±5%)
  - `confidence` (0-100) computed from observations, volatility, days since last update; returns contributing factors object
- [x] `frontend/src/engine/netReturn.js`:
  - Core formula: `expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)`
  - `revenue = expectedPrice * quantity`
  - `transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)`
  - `netReturn = revenue - transport - loading - marketFee - commission - wastage - storage`
  - Editable default extras per crop (loading, APMC cess, commission, transit wastage, storage)
  - Returns full cost breakdown object
- [x] `frontend/src/engine/rank.js`: `rankMarkets(...)`
  - Stage 1 filter: market trades crop, data within last N days (default 7), max distance (default 250 km); tracks excluded markets with reasons
  - Stage 2 rank: risk-adjusted net return (small documented confidence/staleness penalty without double-counting trend or distance)
  - Output includes rank, margin over next option (₹ and %), `isHighestPriceNotRankOne` flag
- [x] `frontend/src/engine/explain.js`: `explainRecommendation(result)` returns structured reasons and plain-language paragraphs (EN, HI, MR) covering price advantage, transport, trend, margin over #2, and highest-price-not-highest-profit case
- [x] `frontend/src/engine/extras.js`: `breakEvenExtraDistance(...)` and `sellNowVsWait(...)` scenarios
- [x] Vitest unit test suite (`frontend/src/engine/engine.test.js`) with 10/10 tests passing:
  - Vehicle step function
  - Round-trip toggle
  - Quantity change flipping ranking
  - Transport slider flipping #1
  - Stale-market exclusion
  - Margin calculation (₹ and %)
  - Test fixture where highest-price market loses to nearer one
  - Break-even distance & sell now vs wait
- [x] Commit: `feat(engine): add net return, transport, trend and ranking with tests`

---

## TASK 4: Backend API + Farmer Input Form
- [x] FastAPI Backend Endpoints (`backend/main.py`):
  - `GET /markets` -> `markets.json`
  - `GET /crops` -> available crops list
  - `GET /prices?crop=&market=` -> history for crop (optionally filtered by market)
  - `GET /distances?from=` -> distances from farmer location to all mandis
  - `GET /data-status` -> latest record date per mandi, fetch timestamp, data source, freshness status (`fresh` <= 1 day, `aging` 2-3 days, `stale` > 3)
  - In-memory cache with modification-time (`mtime`) auto-reload
  - Full CORS and error handling
  - 8/8 Pytest tests passing (`backend/test_backend.py`)
- [x] Frontend Data Layer & Input Form:
  - `frontend/src/api.js`: loads all endpoints in parallel with caching and offline fallback
  - `frontend/src/context/FarmerContext.jsx`: central state management, validation, and reactive ranking
  - Farmer Input Form (`AssumptionsPanel.jsx` & `FarmerInputForm.jsx`):
    - Crop dropdown
    - Quantity (quintals) slider and numeric input
    - Farmer origin location picker + "Use My Location" browser geolocation snapping
    - Vehicle type presets with auto-prefilled freight rates
    - Round-trip haulage toggle
    - What-if expected price stress testing slider (-20% to +20%)
    - Input validation with user-friendly error messages
    - Prominent visible note: *"Modal prices from official mandi data; actual price depends on quality and grade."*
- [x] Commit: `feat: add API endpoints and farmer input form`


---

## TASK 5: Interactive Visualizations & Geographic Mapping
- [x] Ranked mandis list with expandable cost breakdown drawer
- [x] Net Profit vs. Road Distance Tradeoff chart (Recharts) proving highest modal price != highest profit
- [x] Revenue & Deductions Waterfall/Stacked bar chart (Recharts)
- [x] 7-Day Historical Modal Price Trends chart (Recharts)
- [x] Geographic Mandi Map (Leaflet) with farmer origin pin, ranked mandi pins, and route polylines

---

## TASK 6: Multilingual UI & Final Polishing
- [x] First-class support for English, Hindi (हिंदी), and Marathi (मराठी)
- [x] Agricultural terminology translated (e.g. कांदा, टोमॅटो, बटाटा, हरभरा, हमाली, तोलाई)
- [x] Strict compliance standards:
  - "Prices are MODAL prices" prominently displayed
  - "Estimate, not guaranteed" forecast disclaimer
  - Sourced from "daily-updated official mandi data" (never "live")
- [x] Data methodology modal with mathematical formula explanation
- [x] Full test pass (Vitest + Pytest) & production build verification
