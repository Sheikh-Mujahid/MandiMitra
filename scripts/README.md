# MandiMitra AI - Data Pipeline & Scripts

This folder contains the automated scripts for fetching daily official mandi prices and computing road logistics matrices.

---

## 🔑 Obtaining a data.gov.in API Key

1. Register for a free account at [https://data.gov.in/](https://data.gov.in/).
2. Log in and navigate to **My Account > API Keys**.
3. Copy your unique API Key.
4. Locate the **"Current Daily Price of Various Commodities (Agmarknet)"** dataset.
   - Resource ID: `9ef84268-d588-465a-a308-a864a43d0070`
5. Set environment variables locally in `.env`:
   ```bash
   DATA_GOV_API_KEY="your_api_key_here"
   RESOURCE_ID="9ef84268-d588-465a-a308-a864a43d0070"
   ```
6. For GitHub Actions deployment, configure repository secrets:
   - `Settings > Secrets and variables > Actions > New repository secret`
   - Name: `DATA_GOV_API_KEY`
   - Name: `RESOURCE_ID`

---

## 🚀 Running the Scripts

### 1. Fetch Daily Prices
```bash
# Live API mode (requires DATA_GOV_API_KEY):
python scripts/fetch_prices.py

# Offline / Demo Mode (generates 30-day realistic sample history):
python scripts/fetch_prices.py --offline
```

### 2. Build Distance & Duration Matrix
```bash
# Computes road distance and travel time from all farmer locations to all mandis
# Uses OSRM public API with disk cache and Haversine x 1.3 fallback:
python scripts/build_distances.py
```
