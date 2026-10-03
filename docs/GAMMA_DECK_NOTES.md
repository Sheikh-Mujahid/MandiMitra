# 🌾 MandiMitra AI — Gamma Pitch Deck & Presentation Guide

Comprehensive slide-by-slide speaker notes, demo script, and product framing for the **MandiMitra AI** platform presentation.

---

## 🎯 Executive Summary (Elevator Pitch)

> **"Highest price is not always highest profit."**  
> Every day, Indian farmers lose ₹3,000–₹8,000 per truckload chasing distant mandis posting high modal rates, unaware that diesel haulage, deadheading, mandi cess, and adverse weather eat up their hard-earned margins.  
> **MandiMitra AI** is India's first real-time, explainable market recommendation platform that computes **true in-pocket profit**, factors in **weather logistics risks**, and gives farmers instant what-if decision power in their native language (**English, Hindi, Marathi**).

---

## 📽️ Slide Breakdown & Speaker Script

### Slide 1: Title & Hook
- **Visual**: MandiMitra AI logo, tagline: *"Smart Market Recommendation Platform for Farmers"*, live deployment badges, multilingual tag (`English | हिंदी | मराठी`).
- **Headline**: The ₹5,000 Illusion in Indian Agriculture.
- **Key Message**: Farmers don't take home modal prices; they take home net cash after logistics and deductions.
- **Speaker Script**:
  > *"Welcome everyone. In rural Maharashtra and across India, a farmer checks Agmarknet or an SMS bulletin. Mandi A shows ₹2,970/quintal. Mandi B shows ₹3,070/quintal. The farmer hires a truck and drives 180 kilometers to Mandi B. When they return, they realize fuel, toll, hamali, and return haulage cost ₹6,000—leaving them poorer than if they had stayed local. MandiMitra AI solves this problem."*

---

### Slide 2: The Core Problem: Why Price Portals Fail Farmers
- **Visual**: 3 pain-point cards:
  1. **Freight & Deadheading**: ₹30–₹45/km adds up quickly over 100+ km round-trips.
  2. **Hidden Deductions**: Cess (1%), Hamali (₹15–₹25/q), Weighment, Transit Spoilage.
  3. **Weather Disruption**: Unexpected downpours damage open-body trolley crops and cause mandi closures.
- **Speaker Script**:
  > *"Existing portals like Agmarknet and e-NAM are vital price bulletins, but they do not calculate individual farm logistics. They assume zero transport cost and sunny skies. A 50-quintal harvest traveling 150 km further incurs massive deadheading overhead. Furthermore, if a sudden monsoon shower or thunderstorm strikes the destination mandi, perishable crops can spoil before auction."*

---

### Slide 3: The MandiMitra AI Solution
- **Visual**: Split screenshot of the MandiMitra AI dashboard:
  - Top Recommendation Card with Medal & In-pocket profit.
  - Interactive What-If Simulator (Quantity, Transport rate, Round-trip toggle).
  - Weather Warning Banner & Weather Chips on each row.
- **Core Pillars**:
  - **Zero-Latency Client-Side Engine**: Sub-5ms calculation on every slider touch.
  - **Transparent Explainability**: "Why this market?" waterfall breakdown.
  - **Weather-Aware Advisory**: Live Open-Meteo forecasts with smart risk mitigation.
- **Speaker Script**:
  > *"MandiMitra AI computes the exact net return across all accessible mandis in milliseconds. Everything runs client-side without lag. Farmers can simulate fuel price jumps, test harvest volumes, see break-even distances, and evaluate 3-day weather risks without guessing."*

---

### Slide 4: Interactive Architecture & Data Pipeline
- **Visual**: Clean Mermaid architecture flow:
  - Daily Agmarknet automated sync via GitHub Actions.
  - FastAPI backend caching prices, winding road distances, and Open-Meteo weather.
  - Pure JS mathematical engine powering React + Vite + Tailwind frontend.
- **Speaker Script**:
  > *"Our architecture combines resilience with speed. A daily GitHub Action scrapes official Agmarknet data every morning at 07:30 IST. The FastAPI backend queries Open-Meteo for 3-day daily forecasts and caches responses. Crucially, the entire mathematical engine is also duplicated in pure, dependency-free JavaScript on the client, ensuring the dashboard works seamlessly even on spotty 2G/3G rural networks."*

---

### Slide 5: The Weather-Aware Feature (Task 7 Innovation)
- **Visual**:
  - Weather chips with 3-day popover forecast.
  - Advisory classification: Clear (☀️/⛅), Caution (🌦️/🌡️), Risk (⛈️/🌧️).
  - Warning Banner on Recommendation Card.
  - Toggle Switch: *"Include weather risk in ranking"*.
- **The Non-Negotiable Principle**:
  > **Weather is an advisory warning and optional risk adjustment. It must NEVER silently change the default ranking.**
- **Speaker Script**:
  > *"Farmers told us they hate 'black box AI' that changes recommendations without explanation. In MandiMitra AI, default rankings are 100% based on financial net return. If the top-ranked mandi faces heavy rain or thunderstorms, we raise a high-visibility warning banner advising them of the risk and calculating the exact profit difference for the nearest clear-weather mandi. Only when the farmer explicitly toggles 'Include weather risk in ranking' does the engine apply an audited 0.5%–1.5% risk penalty."*

---

### Slide 6: Live Demo Script (The "Akola Storm" Scenario)
- **Demo Setup**:
  1. Click the **"Akola Storm Demo"** preset button in the header or sidebar.
  2. Setup auto-populates: **Origin**: Murtizapur, **Crop**: Wheat, **Quantity**: 50 quintals, **Freight**: ₹35/km.
  3. **Initial State (Toggle OFF)**:
     - **#1 Market**: Akola APMC (Net Return: ₹1,40,776).
     - **Warning Banner appears**: *"⚠️ Heavy rainfall expected near Akola APMC on your travel day. Amravati APMC has clear weather and is ₹2,089 lower."*
     - Akola row displays a red **"Risk · ⛈️ 29°C · 85% rain"** chip.
     - Amravati row displays an emerald **"Clear · ☀️ 32°C · 10% rain"** chip.
  4. **The Interaction (Toggle ON)**:
     - Flip the switch: **"Include weather risk in ranking"**.
     - Instantly, ranking updates! Akola absorbs a 1.5% weather risk penalty (₹2,112), bringing its adjusted return to ₹138,664.
     - **Amravati APMC (₹1,38,687) becomes the new #1 recommendation!**
     - Highlight banner animates: *"Recommendation changed: Akola APMC ➔ Amravati APMC"*.
- **Speaker Script**:
  > *"Notice how clear this is. With weather risk off, Akola is financially ahead by ₹2,089. But the farmer sees the storm warning. By toggling weather risk, they see that taking a minor ₹2,000 variance saves them from a potential ₹30,000 crop ruin in open transit. The farmer is always in control."*

---

### Slide 7: Mathematical Transparency & Audited Consistency
- **Visual**: Side-by-side comparison table of mathematical formulas:
  - Gross Revenue = Modal Price × (1 + Trend) × Quantity
  - Transport = Ceil(Quantity / Capacity) × Distance × Rate × RoundTrip
  - Net Return = Revenue - Transport - Deductions
  - Weather Penalty = Net Return × (1 - PenaltyRate) *(When toggle is active)*
- **Speaker Script**:
  > *"Every calculation is identical to the exact rupee across both Python backend and JavaScript frontend. 15 Vitest tests and 11 Pytest tests run on every pull request to ensure complete mathematical parity."*

---

### Slide 8: Impact & Future Roadmap
- **Key Metrics**:
  - **₹3,000–₹8,000** average transport savings per dispatch.
  - **100% Client-side responsiveness** (< 5ms).
  - **3 Regional languages** natively supported.
- **Future Capabilities**:
  1. Grain Moisture & Quality Grading dockage calculator.
  2. Shared Transport pooling between neighboring farmers.
  3. MSP floor price procurement center alerts.
  4. Offline PWA & SMS/IVR fallback.
- **Closing Script**:
  > *"MandiMitra AI bridges the gap between public government data and practical farm economics. It gives Indian portals the dignity of transparency, the power of simulation, and the confidence to maximize every rupee of their harvest. Thank you."*

---

## 🛠️ Quick Demo Checklist for Presenters

1. [ ] Ensure backend is running: `uvicorn backend.main:app --port 8000` (or run frontend in standalone mode with static assets).
2. [ ] Open frontend in browser: `http://localhost:5173`.
3. [ ] Switch language to **हिंदी** or **मराठी** briefly to demonstrate native localization.
4. [ ] Click **"Akola Storm Demo"** preset.
5. [ ] Point out the red weather chip on Akola and the yellow warning banner on the recommendation card.
6. [ ] Click **"Why this market?"** to show the mini 3-day forecast strip and cost waterfall.
7. [ ] Flip **"Include weather risk in ranking"** toggle to show the instant flip to Amravati APMC.
8. [ ] Show the tooltip when hovering over any weather chip to reveal the 3-day temperature & rain probability outlook.
