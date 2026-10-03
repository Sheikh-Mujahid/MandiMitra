import React from 'react';
import { 
  Gauge, 
  MapPin, 
  ArrowRight, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { breakEvenExtraDistance } from '../engine/extras';
import { translations } from '../i18n/translations';

export default function BreakEvenDistanceCard({ 
  rankedMarkets = [], 
  quantity = 50, 
  vehicleType = 'pickup', 
  ratePerKm = 18, 
  roundTrip = false,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  if (rankedMarkets.length < 2) return null;

  // Find nearest market as baseline
  const nearest = rankedMarkets.reduce((prev, curr) => (curr.distanceKm < prev.distanceKm ? curr : prev));

  // Find market with highest price that is farther than nearest
  const higherPriced = rankedMarkets.filter(
    (m) => m.market.id !== nearest.market.id && m.price > nearest.price
  );

  const targetMarket = higherPriced.length > 0 
    ? higherPriced.reduce((prev, curr) => (curr.price > prev.price ? curr : prev))
    : rankedMarkets[1];

  const result = breakEvenExtraDistance(nearest, targetMarket, {
    quantity,
    vehicleType,
    ratePerKm,
    roundTrip
  });

  const actualExtraDistance = Math.max(0, Math.round(targetMarket.distanceKm - nearest.distanceKm));
  const isWorthWhile = result.canJustifyExtraDistance && result.breakEvenExtraDistanceKm >= actualExtraDistance;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 m-0">
              Break-Even Distance Analysis
            </h3>
            <p className="text-[11px] text-slate-500 m-0">
              How much further can you drive for higher price before transport wipes out the profit?
            </p>
          </div>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-bold self-start sm:self-auto ${
          isWorthWhile 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {isWorthWhile ? '✓ Extra Distance Justified' : '✗ Unprofitable to Travel'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        
        {/* Baseline & Target Comparison */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Nearest Baseline:</span>
            <span className="font-bold text-slate-800">{nearest.market.name}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>{nearest.distanceKm} km away</span>
            <span className="font-semibold text-slate-900">₹{nearest.price}/q</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Target Higher Price:</span>
            <span className="font-bold text-slate-800">{targetMarket.market.name}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>{targetMarket.distanceKm} km (+{actualExtraDistance} km)</span>
            <span className="font-semibold text-emerald-700">₹{targetMarket.price}/q (+₹{targetMarket.price - nearest.price}/q)</span>
          </div>
        </div>

        {/* Max Break-Even Distance Stat */}
        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 flex flex-col justify-center text-center">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Max Break-Even Extra Distance
          </span>
          <div className="text-2xl font-black text-emerald-800">
            +{result.breakEvenExtraDistanceKm} km
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 font-medium">
            Actual extra distance: <strong>+{actualExtraDistance} km</strong>
          </span>
        </div>

        {/* Actionable Advice */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
              Farmer Recommendation
            </span>
            <p className="text-xs text-slate-700 leading-relaxed m-0 font-medium">
              {result.explanation}
            </p>
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Vehicle freight rate: ₹{result.transportCostPerKm}/km ({result.vehiclesNeeded} veh.)
          </div>
        </div>

      </div>
    </div>
  );
}
