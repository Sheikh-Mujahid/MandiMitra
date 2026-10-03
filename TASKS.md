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

## TASK 3: Core Recommendation Engine
- [x] Implement pure JavaScript engine: `frontend/src/engine/engine.js`
  - Function signature: `rankMarkets({crop, quantity, location, vehicle, ratePerKm, priceAdjust, roundTrip, extraCosts, lang})`
  - Formula:
    - `expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)`
    - `revenue = expectedPrice * quantity`
    - `transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)`
    - `netReturn = revenue - transport - loading - marketFee - commission - wastage`
  - Vehicle sizing logic (Pickup 1.5T, Tata 407 3T, Tractor 4T, 14ft 6T, 6-Wheeler 12T)
  - Dynamic "Why Chosen" rationale generator explaining profit advantage over runner-up and nearest mandi
- [x] Vitest unit test suite (`frontend/src/engine/engine.test.js`) verifying math consistency and edge cases

---

## TASK 4: User Assumptions & What-If Controls
- [x] Interactive controls panel with zero-latency reactive updates:
  - Crop selection chips
  - Farmer origin location picker
  - Harvest quantity slider (quintals + tonnes)
  - Vehicle selection with auto-selection recommendation
  - Freight rate slider (₹/km)
  - One-way vs. Round-trip haulage toggle
  - What-If Price Stress Testing slider (-20% to +20%)
  - Advanced APMC cess, weighment, and transit spoilage accordion
- [x] Hero card highlighting Rank #1 Mandi with transparent decision rationale and in-pocket net profit

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
