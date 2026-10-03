import React, { useState } from 'react';
import { 
  CalendarClock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Clock, 
  Warehouse, 
  ShieldAlert, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { sellNowVsWait } from '../engine/extras';
import { translations } from '../i18n/translations';

export default function SellNowVsWaitCard({
  topMandi,
  cropName = 'Crop',
  quantity = 50,
  lang = 'en'
}) {
  const [holdingDays, setHoldingDays] = useState(3); // Default 3 days as requested
  const t = translations[lang] || translations.en;

  if (!topMandi) return null;

  const currentPrice = topMandi.price || 4000;
  const history = topMandi.history30Days || topMandi.history || [currentPrice];

  const analysis = sellNowVsWait({
    currentPrice,
    history,
    holdingDays,
    storageCostPerDay: 0.25,
    quantity,
    trendAdjustment: topMandi.trendAdjustment || 0
  });

  const { sellNowGross, totalStorageCost, scenarios, recommendation, advice } = analysis;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 m-0">
                Sell Now vs. Wait {holdingDays} Days Scenario
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Estimate, not guaranteed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Evaluate storage holding costs vs. price volatility risks before withholding produce
            </p>
          </div>
        </div>

        {/* Holding Days Selector (3 days default) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {[3, 7, 14].map((d) => (
            <button
              key={d}
              onClick={() => setHoldingDays(d)}
              className={`px-2.5 py-1 rounded-lg transition ${
                holdingDays === d ? 'bg-white text-emerald-800 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Wait {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Sell Now vs Wait Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* 1. Sell Today Option */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                Option A: Sell Today
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Zero Risk
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              ₹{Math.round(sellNowGross).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500">
              {quantity} q @ ₹{currentPrice}/q (Modal)
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500">
            Storage cost: <strong>₹0</strong> (Instant payout)
          </div>
        </div>

        {/* 2. Wait: Low (Downside) Scenario */}
        <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-rose-800 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-600" />
                Wait: Low Scenario
              </span>
              <span className="text-[10px] text-rose-700 font-semibold">Downside</span>
            </div>
            <div className="text-xl font-black text-rose-800 mt-1">
              ₹{Math.round(scenarios.low.netReturn).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">
              ₹{Math.round(scenarios.low.pricePerQntl)}/q ({scenarios.low.gainLossVsNow >= 0 ? `+₹${scenarios.low.gainLossVsNow}` : `-₹${Math.abs(scenarios.low.gainLossVsNow)}`})
            </span>
          </div>

          <div className="pt-3 border-t border-rose-200 text-[11px] text-rose-700">
            Market drops due to peak arrivals
          </div>
        </div>

        {/* 3. Wait: Expected (Middle) Scenario */}
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                Wait: Expected
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded font-bold">
                Projected
              </span>
            </div>
            <div className="text-xl font-black text-amber-900 mt-1">
              ₹{Math.round(scenarios.expected.netReturn).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              ₹{Math.round(scenarios.expected.pricePerQntl)}/q ({scenarios.expected.gainLossVsNow >= 0 ? `+₹${scenarios.expected.gainLossVsNow}` : `-₹${Math.abs(scenarios.expected.gainLossVsNow)}`})
            </span>
          </div>

          <div className="pt-3 border-t border-amber-200 text-[11px] text-amber-800 flex justify-between">
            <span>Storage: -₹{totalStorageCost}</span>
            <span>Net: {scenarios.expected.gainLossVsNow >= 0 ? `+₹${scenarios.expected.gainLossVsNow}` : `-₹${Math.abs(scenarios.expected.gainLossVsNow)}`}</span>
          </div>
        </div>

        {/* 4. Wait: High (Surge) Scenario */}
        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                Wait: High Scenario
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">Upside</span>
            </div>
            <div className="text-xl font-black text-emerald-800 mt-1">
              ₹{Math.round(scenarios.high.netReturn).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              ₹{Math.round(scenarios.high.pricePerQntl)}/q (+₹{scenarios.high.gainLossVsNow})
            </span>
          </div>

          <div className="pt-3 border-t border-emerald-200 text-[11px] text-emerald-700">
            Market surge if terminal supply dips
          </div>
        </div>

      </div>

      {/* Advice Callout */}
      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-bold">Decision Takeaway: </strong>
          {advice}
          <span className="block text-[10px] text-slate-400 mt-0.5">
            * Storage calculated at ₹0.25/quintal/day. Historical price volatility model based on official daily modal prices.
          </span>
        </div>
      </div>

    </div>
  );
}
