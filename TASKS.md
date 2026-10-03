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
  - Cron scheduled at 02:00 UTC (07:30 AM IST) + `workflow_dispatch`
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

## TASK 5: Interactive Dashboard (Main Demo)
- [x] 1. Recommendation card: "Sell at <market>" with expected net return in Indian format (₹1,32,500), rank medal, and a "Why?" button
- [x] 2. Ranked comparison table: Rank, Market, Distance, Price/q, Trend arrow and %, Transport, Other costs, Net return, Confidence, Freshness dot; Excluded markets listed below with reason; animated row reordering
- [x] 3. What-if simulator: sliders for quantity (1-300 q), transport rate per km, expected price change (-10% to +10%), round-trip toggle, vehicle selector; updates on every change with zero button press; highlight when #1 changes ("Recommendation changed: <from> -> <to>")
- [x] 4. "Why this market?" panel: structured reasons from explainRecommendation, profit breakdown waterfall, margin over #2 in ₹ and %, callout "Highest price is not highest profit" when relevant, expandable full calculation
- [x] 5. Compare-two-markets view: pick any two markets side by side with diff highlights
- [x] 6. Price trend chart (Recharts): 30-day modal price lines for top 3 markets with 7-day and 30-day change, confidence indicator with contributing factors
- [x] 7. Data freshness badge in header from `/data-status` (green updated today, yellow older, red stale, plus sample data indicator)
- [x] 8. Demo scenario preset button: "50 q wheat from Amravati" loading a scenario where raising transport rate (₹18 -> ₹42/km) flips #1 market (Buldhana -> Amravati)
- [x] 9. Responsive mobile-first design, large readable fonts, clean farmer-friendly design, empty and loading states
- [x] Commit: `feat(ui): add ranking, what-if simulator, explanation and demo scenario`

---

## TASK 6: Stretch Features, Polish, Docs, Deploy
- [x] 1. Break-even distance card: extra distance a higher-priced market can be before it stops being worth it vs baseline market (`extras.js`). Commit: `feat: add break-even distance`
- [x] 2. Sell now vs wait 3 days: low/expected/high return range, storage cost and risk labeled "Estimate, not guaranteed" (`SellNowVsWaitCard.jsx`). Commit: `feat: add sell now vs wait scenario`
- [x] 3. Language toggle English / Hindi / Marathi covering all UI labels and explanation text (`translations.js`). Commit: `feat: add language toggle`
- [x] 4. Price alert (in-app): farmer sets target price for crop/market, banner when latest crosses it or distance from target, stored in `localStorage` (`PriceAlertBanner.jsx`). Commit: `feat: add in-app price alerts`
- [x] 5. Interactive map with Leaflet/OpenStreetMap: farmer location and mandis, click marker to see distance, price, transport, and net return (`MandiMap.jsx`). Commit: `feat: add mandi map`
- [x] 6. Final README: problem, solution, screenshots, architecture diagram, data source and limits, calculation formulas, daily update workflow, setup instructions, "how we differ from e-NAM, AGMARKNET and similar tools", future work. Commit: `docs: finalize README`
- [x] 7. Deploy: frontend to Vercel/Netlify, backend to Render/Railway, environment variables documented, live links in README (`vercel.json`, `netlify.toml`, `render.yaml`, `.env.example`). Commit: `chore: deploy`

---

## TASK 7: Weather-Aware Feature & Risk Adjustment
- [x] 1. Backend Open-Meteo Integration (`backend/main.py`):
  - `GET /weather?lat=&lon=` and `GET /weather/mandis` for all mandis in one call.
  - 30-min in-memory cache, graceful error handling and offline fallback (`{"status": "unavailable"}`).
  - Unit tests in `backend/test_backend.py` covering endpoints, cache, and failure fallback (11/11 passing).
- [x] 2. Pure JS Weather Engine (`frontend/src/engine/weather.js`):
  - `classifyWeather(daily)`: Configurable thresholds for `risk` (heavy rain >= 20mm or prob >= 70%, thunderstorms, wind >= 40km/h), `caution` (moderate rain 5-20mm, extreme heat > 40°C), and `clear`.
  - `weatherRiskPenalty(level, netReturn)`: Small documented penalty (0% clear, 0.5% caution, 1.5% risk) applied **only** when toggle is ON.
  - Default ranking strictly unchanged when toggle is OFF.
  - `explainRecommendation` extended: warning sentence if #1 market has weather risk, naming best clear-weather alternative and net-return profit difference.
  - Unit tests in `frontend/src/engine/engine.test.js` (15/15 passing).
- [x] 3. Interactive UI Components:
  - `WeatherChip.jsx`: Weather icon + max temperature + rain chance with 3-day forecast tooltip on table and cards.
  - Warning banner on `TopRecommendationBanner.jsx` when #1 market is "caution" or "risk".
  - Toggle in `AssumptionsPanel.jsx`: "Include weather risk in ranking" (default OFF) updating ranking instantly with highlight change animation.
  - Mini 3-day forecast strip in `WhyChosenModal.jsx` with timestamp and advisory note.
  - Advisory notice: *"Forecasts are estimates and may change."*
  - Multilingual dictionaries in `translations.js` for English, Hindi, and Marathi.
- [x] 4. Demo Scenario Preset:
  - "Akola Storm Demo" preset button (Wheat, Murtizapur, 50 q, ₹35/km freight).
  - Akola is #1 with thunderstorm/heavy rain warning; Amravati is #2 clear weather.
  - Toggling "Include weather risk in ranking" flips recommendation to Amravati APMC.
- [x] 5. Documentation & Deck Notes:
  - Updated `README.md` with features, Open-Meteo data source, limitations, and calculation formula.
  - Created `docs/GAMMA_DECK_NOTES.md` with comprehensive slide-by-slide speaker notes and demo guide.
- [x] Commit: `feat: add weather forecast, risk warning and optional ranking adjustment`

