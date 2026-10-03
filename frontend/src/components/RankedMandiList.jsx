import React, { useState } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  Layers
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function RankedMandiList({ rankedMarkets, lang }) {
  const t = translations[lang] || translations.en;
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const topNetReturn = rankedMarkets[0]?.netReturn || 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 m-0">
            {t.listHeaderTitle}
          </h2>
          <p className="text-xs text-slate-500 m-0">
            {t.listHeaderSubtitle}
          </p>
        </div>

        <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
          {rankedMarkets.length} {t.marketsCompared}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {rankedMarkets.map((item) => {
          const isTop = item.rank === 1;
          const isExpanded = expandedId === item.market.id;
          const diffFromTop = Math.round(topNetReturn - item.netReturn);

          return (
            <div
              key={item.market.id}
              className={`p-4 sm:p-5 transition-colors ${
                isTop ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Rank & Mandi Info */}
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-sm ${
                      isTop
                        ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                        : item.rank === 2
                        ? 'bg-slate-200 text-slate-700'
                        : item.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{item.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 m-0">
                        {item.market.name}
                      </h3>
                      {isTop && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-md">
                          {t.bestChoiceBadge}
                        </span>
                      )}
                      {item.market.enam && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          e-NAM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.market.district}, {item.market.state}
                      </span>
                      <span>•</span>
                      <span>{item.distanceKm} km {t.legendDistance}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">
                        {t.modalPrefix}₹{item.price.toLocaleString('en-IN')}/q
                      </span>
                    </div>

                    {/* Trend & Data freshness */}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] flex-wrap">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        item.trend === 'UP' ? 'text-emerald-700' : item.trend === 'DOWN' ? 'text-rose-700' : 'text-slate-600'
                      }`}>
                        {item.trend === 'UP' ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : item.trend === 'DOWN' ? <TrendingDown className="w-3 h-3 text-rose-600" /> : <Minus className="w-3 h-3 text-slate-400" />}
                        {item.trend} ({item.trendAdjustment > 0 ? `+${(item.trendAdjustment * 100).toFixed(1)}%` : `${(item.trendAdjustment * 100).toFixed(1)}%`})
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        {t.expectedPrefix}
                        <strong className="text-slate-800">₹{item.expectedPrice.toLocaleString('en-IN')}/q</strong>
                        <span className="text-[10px] text-slate-400 ml-1">({t.estimateDisclaimer})</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-medium">
                        {t.dailyDataBadge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Net Return & Cost Stats */}
                <div className="flex items-center justify-between lg:justify-end gap-5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t.netReturnShort}
                    </span>
                    <div className="text-xl font-black text-slate-900 flex items-baseline justify-end gap-0.5">
                      <span className="text-base text-emerald-700">₹</span>
                      <span>{Math.round(item.netReturn).toLocaleString('en-IN')}</span>
                    </div>
                    {item.rank > 1 && (
                      <span className="text-[11px] font-semibold text-rose-700 block">
                        -₹{diffFromTop.toLocaleString('en-IN')} {t.vsRank1}
                      </span>
                    )}
                  </div>

                  {/* Expand button */}
                  <button
                    onClick={() => toggleExpand(item.market.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 text-xs font-semibold"
                    title="View breakdown"
                  >
                    <span>{isExpanded ? t.hideBtn : t.costsBtn}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {/* Rationale Snippet */}
              <div className="mt-2.5 text-xs text-slate-600 bg-slate-50/90 rounded-lg px-3 py-1.5 border border-slate-200/80">
                <span className="font-semibold text-slate-700">
                  {t.analysisLabel}
                </span>{' '}
                {item.whyChosen}
              </div>

              {/* Expanded Cost Breakdown Drawer */}
              {isExpanded && (
                <div className="mt-3.5 bg-slate-50 rounded-xl p-4 border border-slate-200/90 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      {t.costBreakdownTitle}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t.consistentMathNote}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">
                        {t.grossRevenueLabel}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        ₹{Math.round(item.revenue).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.expectedPrice} × Qntl
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">
                        {t.transportFreightLabel}
                      </span>
                      <span className="text-sm font-bold text-rose-700">
                        -₹{Math.round(item.transport).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.distanceKm} km ({item.vehiclesNeeded} veh)
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">
                        {t.handlingLabel}
                      </span>
                      <span className="text-sm font-bold text-rose-700">
                        -₹{Math.round(item.costBreakdown.loading + item.costBreakdown.weighment).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Mandi labor standard
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">
                        {t.cessWasteLabel}
                      </span>
                      <span className="text-sm font-bold text-rose-700">
                        -₹{Math.round(item.costBreakdown.marketFee + item.costBreakdown.wastage).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.market.marketFeePercent}% cess + transit
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-600">
                      {t.formulaBar}
                    </span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      ₹{Math.round(item.revenue).toLocaleString('en-IN')} - ₹{Math.round(item.costBreakdown.totalDeductions).toLocaleString('en-IN')} = ₹{Math.round(item.netReturn).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
