import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Scale, 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function CompareMarketsView({ rankedMarkets = [], lang = 'en' }) {
  const t = translations[lang] || translations.en;

  const [marketAId, setMarketAId] = useState(rankedMarkets[0]?.market?.id || '');
  const [marketBId, setMarketBId] = useState(rankedMarkets[1]?.market?.id || '');

  if (rankedMarkets.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
        <p>At least two markets are required for side-by-side comparison.</p>
      </div>
    );
  }

  const marketA = rankedMarkets.find((m) => m.market?.id === marketAId) || rankedMarkets[0];
  const marketB = rankedMarkets.find((m) => m.market?.id === marketBId) || rankedMarkets[1] || rankedMarkets[0];

  const netDiff = Math.round(marketA.netReturn - marketB.netReturn);
  const priceDiff = Math.round(marketA.price - marketB.price);
  const distDiff = Math.round(marketA.distanceKm - marketB.distanceKm);
  const transDiff = Math.round(marketA.transport - marketB.transport);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 m-0">
            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'mr' ? 'दोन बाजार समित्यांची तुलना' : lang === 'hi' ? 'दो मंडियों की तुलना' : 'Compare Two Markets Side-by-Side'}</span>
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {lang === 'mr' 
              ? 'कोणत्याही दोन बाजार समित्यांची थेट निव्वळ नफा व खर्चाची तुलना करा' 
              : lang === 'hi' 
              ? 'किन्हीं दो मंडियों के शुद्ध लाभ और परिवहन खर्च की आमने-सामने तुलना करें' 
              : 'Pick any two mandis to evaluate net return, freight burden, and price premium tradeoffs'}
          </p>
        </div>

        {/* Winner Banner */}
        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 flex items-center gap-1.5 self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {netDiff > 0 
              ? `${marketA.market.name} yields +₹${netDiff.toLocaleString('en-IN')} more net return` 
              : netDiff < 0 
              ? `${marketB.market.name} yields +₹${Math.abs(netDiff).toLocaleString('en-IN')} more net return`
              : 'Both markets yield identical net profit'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Market Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          {/* Market A Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Market A (Baseline)
            </label>
            <div className="relative">
              <select
                value={marketA.market.id}
                onChange={(e) => setMarketAId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-emerald-500 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 pr-10 focus:ring-2 focus:ring-emerald-500/20"
              >
                {rankedMarkets.map((m) => (
                  <option key={`a_${m.market.id}`} value={m.market.id}>
                    #{m.rank} {m.market.name} ({m.distanceKm} km | ₹{m.price}/q)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Market B Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Market B (Competitor)
            </label>
            <div className="relative">
              <select
                value={marketB.market.id}
                onChange={(e) => setMarketBId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-emerald-500 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 pr-10 focus:ring-2 focus:ring-emerald-500/20"
              >
                {rankedMarkets.map((m) => (
                  <option key={`b_${m.market.id}`} value={m.market.id}>
                    #{m.rank} {m.market.name} ({m.distanceKm} km | ₹{m.price}/q)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3">Metric</th>
                <th className="pb-3 text-emerald-800 font-extrabold">{marketA.market.name} (A)</th>
                <th className="pb-3 text-teal-800 font-extrabold">{marketB.market.name} (B)</th>
                <th className="pb-3 text-right">Advantage (A vs B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              
              {/* Rank */}
              <tr>
                <td className="py-3 text-xs font-semibold text-slate-500">Overall Rank</td>
                <td className="py-3 font-bold">#{marketA.rank}</td>
                <td className="py-3 font-bold">#{marketB.rank}</td>
                <td className="py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    marketA.rank < marketB.rank ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {marketA.rank < marketB.rank ? `A is ranked higher (+${marketB.rank - marketA.rank} pos)` : `B is ranked higher (+${marketA.rank - marketB.rank} pos)`}
                  </span>
                </td>
              </tr>

              {/* In-Pocket Net Return */}
              <tr className="bg-emerald-50/50">
                <td className="py-3.5 text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-700" />
                  <span>In-Pocket Net Return</span>
                </td>
                <td className="py-3.5 text-base font-extrabold text-emerald-900">
                  ₹{Math.round(marketA.netReturn).toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 text-base font-extrabold text-teal-900">
                  ₹{Math.round(marketB.netReturn).toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 text-right font-black">
                  <span className={`text-sm px-2.5 py-1 rounded-lg ${
                    netDiff >= 0 ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
                  }`}>
                    {netDiff >= 0 ? `+₹${netDiff.toLocaleString('en-IN')} (A)` : `+₹${Math.abs(netDiff).toLocaleString('en-IN')} (B)`}
                  </span>
                </td>
              </tr>

              {/* Official Modal Price */}
              <tr>
                <td className="py-3 text-xs font-semibold text-slate-500">Official Modal Price</td>
                <td className="py-3 font-bold text-slate-900">₹{marketA.price.toLocaleString('en-IN')}/q</td>
                <td className="py-3 font-bold text-slate-900">₹{marketB.price.toLocaleString('en-IN')}/q</td>
                <td className="py-3 text-right text-xs">
                  {priceDiff !== 0 ? (
                    <span className={priceDiff > 0 ? 'text-emerald-700 font-bold' : 'text-slate-600 font-bold'}>
                      {priceDiff > 0 ? `+₹${priceDiff}/q higher at A` : `+₹${Math.abs(priceDiff)}/q higher at B`}
                    </span>
                  ) : 'Identical modal price'}
                </td>
              </tr>

              {/* Road Distance */}
              <tr>
                <td className="py-3 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Road Distance</span>
                </td>
                <td className="py-3 font-bold text-slate-800">{marketA.distanceKm} km</td>
                <td className="py-3 font-bold text-slate-800">{marketB.distanceKm} km</td>
                <td className="py-3 text-right text-xs">
                  {distDiff !== 0 ? (
                    <span className={distDiff < 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {distDiff < 0 ? `A is ${Math.abs(distDiff)} km closer` : `B is ${distDiff} km closer`}
                    </span>
                  ) : 'Equal distance'}
                </td>
              </tr>

              {/* Total Transport Freight */}
              <tr>
                <td className="py-3 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Transport Freight Cost</span>
                </td>
                <td className="py-3 font-bold text-slate-800">₹{Math.round(marketA.transport).toLocaleString('en-IN')}</td>
                <td className="py-3 font-bold text-slate-800">₹{Math.round(marketB.transport).toLocaleString('en-IN')}</td>
                <td className="py-3 text-right text-xs">
                  {transDiff !== 0 ? (
                    <span className={transDiff < 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {transDiff < 0 ? `A saves ₹${Math.abs(transDiff).toLocaleString('en-IN')} freight` : `B saves ₹${transDiff.toLocaleString('en-IN')} freight`}
                    </span>
                  ) : 'Equal freight'}
                </td>
              </tr>

              {/* Other APMC Deductions */}
              <tr>
                <td className="py-3 text-xs font-semibold text-slate-500">Mandi Fees & Handling</td>
                <td className="py-3 text-slate-700">₹{Math.round(marketA.otherCosts).toLocaleString('en-IN')}</td>
                <td className="py-3 text-slate-700">₹{Math.round(marketB.otherCosts).toLocaleString('en-IN')}</td>
                <td className="py-3 text-right text-xs text-slate-500">
                  {Math.round(marketA.otherCosts - marketB.otherCosts) === 0 ? 'Equal fees' : `Difference: ₹${Math.abs(Math.round(marketA.otherCosts - marketB.otherCosts))}`}
                </td>
              </tr>

              {/* Price Trend */}
              <tr>
                <td className="py-3 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>Price Trend & Confidence</span>
                </td>
                <td className="py-3 text-xs">
                  <span className="font-bold">{marketA.trend}</span> ({Math.round(marketA.confidence * 100)}% conf)
                </td>
                <td className="py-3 text-xs">
                  <span className="font-bold">{marketB.trend}</span> ({Math.round(marketB.confidence * 100)}% conf)
                </td>
                <td className="py-3 text-right text-xs text-slate-500">
                  Data Age: {marketA.dataAgeDays}d vs {marketB.dataAgeDays}d
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Economic Rationale Summary */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block mb-0.5">
              Takeaway for Farmer:
            </span>
            {netDiff > 0 ? (
              <p className="m-0">
                Choosing <strong>{marketA.market.name}</strong> over <strong>{marketB.market.name}</strong> puts an extra <strong>₹{netDiff.toLocaleString('en-IN')}</strong> directly in your pocket. {priceDiff < 0 ? `Even though ${marketB.market.name} posts a higher modal price (+₹${Math.abs(priceDiff)}/q), the ${Math.abs(distDiff)} km extra distance creates ₹${Math.abs(transDiff).toLocaleString('en-IN')} in transport expenses that negate the price advantage.` : `Superior modal prices and manageable road distance provide a distinct margin.`}
              </p>
            ) : netDiff < 0 ? (
              <p className="m-0">
                Choosing <strong>{marketB.market.name}</strong> over <strong>{marketA.market.name}</strong> puts an extra <strong>₹{Math.abs(netDiff).toLocaleString('en-IN')}</strong> directly in your pocket. {priceDiff > 0 ? `Even though ${marketA.market.name} has a higher posted price, lower logistics and fees at ${marketB.market.name} deliver higher net profit.` : `Higher modal prices easily offset the transport difference.`}
              </p>
            ) : (
              <p className="m-0">
                Both markets deliver virtually equal net profits. Consider market facilities, ease of unloading, or promptness of APMC payment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
