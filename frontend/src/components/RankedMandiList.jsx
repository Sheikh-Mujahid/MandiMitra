import React, { useState } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  Table,
  LayoutGrid,
  AlertCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import WeatherChip from './WeatherChip';
import { translations } from '../i18n/translations';

export default function RankedMandiList({ rankedMarkets = [], lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const topNetReturn = rankedMarkets[0]?.netReturn || 1;
  const excludedMarkets = rankedMarkets.excluded || [];

  const getFreshnessDot = (age) => {
    if (age === undefined || age === null || age === 0) {
      return (
        <span className="inline-flex items-center gap-1" title="Fresh: Updated today">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-700 font-semibold">Today</span>
        </span>
      );
    }
    if (age <= 2) {
      return (
        <span className="inline-flex items-center gap-1" title={`Aging: ${age} days old`}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-[10px] text-amber-700 font-semibold">{age}d ago</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1" title={`Stale: ${age} days old`}>
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
        <span className="text-[10px] text-rose-700 font-semibold">{age}d ago</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      
      {/* Header with View Mode Toggle */}
      <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 m-0">
            {t.listHeaderTitle}
          </h2>
          <p className="text-xs text-slate-500 m-0">
            {t.listHeaderSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition ${
                viewMode === 'table' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition ${
                viewMode === 'cards' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
            {rankedMarkets.length} {t.marketsCompared}
          </div>
        </div>
      </div>

      {/* 1. Comparison Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-3">Market</th>
                <th className="py-3 px-3 text-right">Distance</th>
                <th className="py-3 px-3 text-right">Price/q</th>
                <th className="py-3 px-3 text-center">Trend</th>
                <th className="py-3 px-3 text-center">{t.weatherLabel}</th>
                <th className="py-3 px-3 text-right">Transport</th>
                <th className="py-3 px-3 text-right">Other Costs</th>
                <th className="py-3 px-4 text-right font-black text-emerald-800">Net Return</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-3 text-center">Freshness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {rankedMarkets.map((item) => {
                const isTop = item.rank === 1;
                const trendPct = Math.round((item.trendAdjustment || 0) * 1000) / 10;

                return (
                  <tr
                    key={item.market.id}
                    className={`transition-all duration-300 hover:bg-slate-50 ${
                      isTop ? 'bg-emerald-50/40 font-semibold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-sm ${
                        isTop 
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300' 
                          : item.rank === 2 
                          ? 'bg-slate-200 text-slate-700' 
                          : item.rank === 3 
                          ? 'bg-amber-700 text-amber-100' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        #{item.rank}
                      </span>
                    </td>

                    {/* Market Name & District */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 text-sm">{item.market.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span>{item.market.district}</span>
                        {item.market.enam && (
                          <span className="ml-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded border border-blue-200">
                            e-NAM
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Distance */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-slate-800">{item.distanceKm}</span>
                      <span className="text-slate-400 text-[10px] ml-0.5">km</span>
                    </td>

                    {/* Modal Price */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-slate-900">₹{item.price.toLocaleString('en-IN')}</span>
                      <span className="text-slate-400 text-[10px]">/q</span>
                    </td>

                    {/* Trend Arrow and % */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                        item.trend === 'UP' || item.trend === 'Rising'
                          ? 'text-emerald-700 bg-emerald-50'
                          : item.trend === 'DOWN' || item.trend === 'Falling'
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-slate-600 bg-slate-100'
                      }`}>
                        {item.trend === 'UP' || item.trend === 'Rising' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : item.trend === 'DOWN' || item.trend === 'Falling' ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>{trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`}</span>
                      </span>
                    </td>

                    {/* Weather Chip with Tooltip */}
                    <td className="py-3.5 px-3 text-center">
                      <WeatherChip 
                        weather={item.weather} 
                        mandiName={item.market.name} 
                        lang={lang} 
                        isSampleOverride={item.market.id === 'akola_apmc' && item.weather?.day0?.weatherCode === 95}
                      />
                    </td>

                    {/* Transport */}
                    <td className="py-3.5 px-3 text-right font-semibold text-rose-700">
                      -₹{Math.round(item.transport).toLocaleString('en-IN')}
                    </td>

                    {/* Other Costs */}
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      -₹{Math.round(item.otherCosts).toLocaleString('en-IN')}
                    </td>

                    {/* Net Return */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-black text-sm text-emerald-800">
                        ₹{Math.round(item.netReturn).toLocaleString('en-IN')}
                      </div>
                      {item.marginOverNextRs > 0 && (
                        <div className="text-[10px] text-emerald-600 font-bold">
                          +₹{Math.round(item.marginOverNextRs).toLocaleString('en-IN')} ({item.marginOverNextPct}%)
                        </div>
                      )}
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-slate-800">
                        {Math.round(typeof item.confidence === 'number' && item.confidence <= 1 ? item.confidence * 100 : item.confidence)}%
                      </div>
                      <div className="w-12 bg-slate-200 h-1.5 rounded-full mx-auto mt-0.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full" 
                          style={{ width: `${Math.round(typeof item.confidence === 'number' && item.confidence <= 1 ? item.confidence * 100 : item.confidence)}%` }}
                        />
                      </div>
                    </td>

                    {/* Freshness Dot */}
                    <td className="py-3.5 px-3 text-center">
                      {getFreshnessDot(item.dataAgeDays)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 2. Detailed Card View */
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
                        <WeatherChip 
                          weather={item.weather} 
                          mandiName={item.market.name} 
                          lang={lang} 
                          isSampleOverride={item.market.id === 'akola_apmc' && item.weather?.day0?.weatherCode === 95}
                        />
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
                        <span>•</span>
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          item.trend === 'UP' || item.trend === 'Rising'
                            ? 'text-emerald-700 bg-emerald-50'
                            : item.trend === 'DOWN' || item.trend === 'Falling'
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-slate-600 bg-slate-100'
                        }`}>
                          {item.trend === 'UP' || item.trend === 'Rising' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : item.trend === 'DOWN' || item.trend === 'Falling' ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span>Trend {item.trendAdjustment >= 0 ? `+${Math.round((item.trendAdjustment || 0) * 1000) / 10}%` : `${Math.round((item.trendAdjustment || 0) * 1000) / 10}%`}</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold text-[11px]">
                          Confidence: {Math.round(typeof item.confidence === 'number' && item.confidence <= 1 ? item.confidence * 100 : item.confidence)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Net Return & Quick Math */}
                  <div className="flex items-center justify-between lg:justify-end space-x-6">
                    <div className="text-left lg:text-right">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t.netReturnLabel}
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
                        ₹{Math.round(item.netReturn).toLocaleString('en-IN')}
                      </div>
                      {isTop ? (
                        <div className="text-[11px] text-emerald-600 font-bold">
                          ✓ {t.highestPocketProfit}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          -₹{diffFromTop.toLocaleString('en-IN')} {t.vsRank1}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(item.market.id)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title={isExpanded ? 'Collapse cost details' : 'Expand full cost deductions'}
                    >
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
                          ₹{item.expectedPrice} × Qntl
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
                          -₹{Math.round((item.costBreakdown?.loading || 0) + (item.costBreakdown?.weighment || 0)).toLocaleString('en-IN')}
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
                          -₹{Math.round((item.costBreakdown?.marketFee || 0) + (item.costBreakdown?.wastage || 0)).toLocaleString('en-IN')}
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
                        ₹{Math.round(item.revenue).toLocaleString('en-IN')} - ₹{Math.round(item.costBreakdown?.totalDeductions || 0).toLocaleString('en-IN')} = ₹{Math.round(item.netReturn).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* 3. Excluded Markets Section (Stage 1 Filter) */}
      {excludedMarkets.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 m-0">
              Excluded Mandis (Did not qualify Stage 1 Filter)
            </h3>
          </div>
          <div className="space-y-2">
            {excludedMarkets.map((ex, idx) => (
              <div 
                key={`ex_${idx}`} 
                className="bg-white p-3 rounded-xl border border-slate-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="font-bold text-slate-800">{ex.market?.name || ex.marketId}</span>
                  {ex.distanceKm !== undefined && (
                    <span className="text-slate-400">({ex.distanceKm} km away)</span>
                  )}
                </div>
                <div className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-medium text-[11px] self-start sm:self-auto">
                  Reason: {ex.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
