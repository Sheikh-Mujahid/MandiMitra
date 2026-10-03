# MandiMitra AI (मंडी मित्र एआई / शेतकरी मित्र)
### Smart Market Recommendation Platform for Farmers

[![GitHub Pages Deployment](https://github.com/Sheikh-Mujahid/MandiMitra/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Sheikh-Mujahid/MandiMitra/actions/workflows/deploy-pages.yml)
[![Daily Mandi Price Sync](https://github.com/Sheikh-Mujahid/MandiMitra/actions/workflows/daily-update.yml/badge.svg)](https://github.com/Sheikh-Mujahid/MandiMitra/actions/workflows/daily-update.yml)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A4%8Work%20%7C%20%E0%A4%AE%E0%A4%B0%E0%A4%BE%E0%A4%A0%E0%A5%80-emerald)](https://sheikh-mujahid.github.io/MandiMitra/)

> **"Highest price is not always highest profit."**  
> MandiMitra AI empowers farmers to maximize net in-pocket income by ranking nearby agricultural markets (mandis) based on expected net return after accounting for road distance, vehicle logistics, handling charges, mandi cess, and price trends.
>
> 🌐 **Live Demo:** [https://sheikh-mujahid.github.io/MandiMitra/](https://sheikh-mujahid.github.io/MandiMitra/)  
> 📦 **GitHub Repository:** [https://github.com/Sheikh-Mujahid/MandiMitra](https://github.com/Sheikh-Mujahid/MandiMitra)

---

## 📌 Problem Statement

Mandi modal prices, transport costs, and daily price trends differ significantly across markets. Farmers often travel to distant terminal markets chasing higher posted prices, only to find that extra freight, vehicle deadheading, and handling fees completely wipe out their margins. 

**Core Insight**: A local mandi with a modal price of ₹2,450/q located 15 km away can yield substantially higher net profit than a metro mandi posting ₹2,900/q located 220 km away when factoring in multi-axle freight and transit spoilage.

---

## 🚀 Key Features

1. **Instant Reactive Ranking Engine**:
   - Ranks all reachable mandis by **expected net return** (`netReturn`).
   - Pure client-side calculations update rankings, charts, and map routes with zero latency as the farmer moves sliders.

2. **Transparent "Why Chosen" Decision Rationale**:
   - Explains in plain language why the #1 market was chosen over the runner-up and the nearest market (e.g., how the price premium offsets the extra road distance).

3. **Real-World Farm Assumptions & Logistics**:
   - **Vehicle Sizing**: Auto-selects or allows picking Bolero Pickup (1.5T), Tata 407 (3T), Tractor Trolley (4T), 14ft Truck (6T), or 6-Wheeler (12T).
   - **Freight Options**: Configurable ₹/km rate and One-way vs. Round-trip haulage toggle.
   - **Price Stress Testing**: Slider for -20% to +20% price shifts to simulate market crashes or surges before leaving the farm.
   - **Granular Deductions**: Loading/unloading, weighment, APMC market cess, and transit spoilage.

4. **Visual Analytics**:
   - **Net Profit vs. Distance Tradeoff**: Proves visually where transport costs overpower price premiums.
   - **Cost Deductions Waterfall**: Side-by-side stacked view of Gross Revenue, Transport, Handling, and In-Pocket Net Return.
   - **7-Day Price Trends**: Historical modal price trajectory across competitor mandis.
   - **Interactive Leaflet Map**: Visualizes the farm origin, color-coded mandi pins, and optimal highway routes.

5. **Farmer-Centric Multilingual Design**:
   - Trilingual support: Instant one-click toggle between **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
   - Tailored terminology for agricultural trade (e.g. कांदा, टोमॅटो, बटाटा, हरभरा, हमाली, तोलाई, बाजार समिती).
   - Quick one-tap preset scenarios (e.g., Nashik Onion, Dindori Tomato, Indore Soybean).

---

## 📐 Core Mathematical Formulas

Every metric displayed on MandiMitra AI is 100% mathematically consistent:

```text
expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)
revenue       = expectedPrice * quantity
transport     = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)
netReturn     = revenue - transport - loading - marketFee - commission - wastage
```

Where:
- `loading = loadingPerQntl * quantity`
- `marketFee = revenue * (marketFeePercent / 100)`
- `commission = revenue * (commissionPercent / 100)`
- `wastage = revenue * spoilageFactor * min(distanceKm, 300)`
- `otherCosts = loading + marketFee + commission + weighment + wastage`
- `vehiclesNeeded = ceil(quantity / vehicleCapacity)`

---

## 🧩 Engine Interface

The pure recommendation engine in `frontend/src/engine/engine.js` (and `backend/engine.py`) implements the exact standardized signature:

```javascript
rankMarkets({ crop, quantity, location, vehicle, ratePerKm, priceAdjust, roundTrip, extraCosts })
  -> [{ market, price, expectedPrice, distanceKm, transport, otherCosts, netReturn, trend, confidence, dataAgeDays, rank }]
```

---

## 🛡️ Standards & Compliance Rules

1. **Modal Prices Only**: All market prices are official **MODAL prices** (the most frequent transaction price for the day). The UI explicitly states this on cards, charts, and tables.
2. **Forecast Disclaimer**: All projected prices and trend adjustments are clearly labeled **"estimate, not guaranteed"**.
3. **Data Freshness**: Always described as **"daily-updated official mandi data"** (never "live").
4. **Environment Variables**: API keys (e.g., `DATA_GOV_IN_API_KEY`) are accessed strictly through environment variables.

---

## 📂 Repository Structure

```text
MandiMitra-AI/
├── frontend/
│   ├── src/
│   │   ├── engine/
│   │   │   ├── engine.js         # Pure JS recommendation engine
│   │   │   └── engine.test.js    # Vitest engine test suite
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── AssumptionsPanel.jsx
│   │   │   ├── TopRecommendationBanner.jsx
│   │   │   ├── RankedMandiList.jsx
│   │   │   ├── ProfitDistanceChart.jsx
│   │   │   ├── RevenueCostWaterfallChart.jsx
│   │   │   ├── PriceTrendHistoryChart.jsx
│   │   │   ├── MandiMap.jsx
│   │   │   └── DataDisclaimerModal.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py                   # FastAPI server & endpoints
│   ├── engine.py                 # Python engine mirror
│   ├── test_backend.py           # Pytest test suite
│   └── requirements.txt
├── data/
│   ├── markets.json              # APMC registry (fees, lat, lon, facilities)
│   ├── prices.json               # Daily official modal prices, arrivals & trends
│   ├── distances.json            # Calibrated road distances & farm clusters
│   └── last_updated.json         # Data source & update timestamp
├── scripts/
│   ├── fetch_prices.py           # Agmarknet / API sync script
│   └── build_distances.py        # Road winding distance matrix builder
├── .github/
│   └── workflows/
│       └── daily-update.yml      # Daily cron job (02:00 UTC)
├── README.md
└── TASKS.md
```

---

## 🛠️ Quick Start & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To run engine unit tests:
```bash
npm test
```

### 2. Run the Backend (FastAPI)
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```
Open API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

To run backend tests:
```bash
python -m pytest backend/test_backend.py -v
```

### 3. Run Data Sync Scripts
```bash
python scripts/fetch_prices.py
python scripts/build_distances.py
```

---

## 🤖 Daily Automated Updates (GitHub Actions)

A GitHub Actions workflow is scheduled in `.github/workflows/daily-update.yml` to run daily at 02:00 UTC (07:30 IST) when official mandi prices are published across APMC yards. It fetches updated modal prices, updates `data/prices.json` and `data/last_updated.json`, and commits updates to the repository.
