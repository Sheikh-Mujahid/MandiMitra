import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Truck, 
  MapPin, 
  Sparkles
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function TopRecommendationBanner({ topMandi, runnerUp, lang, cropName, onOpenWhy }) {
  if (!topMandi) return null;

  const t = translations[lang] || translations.en;
  const profitAdvantage = runnerUp ? Math.round(topMandi.netReturn - runnerUp.netReturn) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white shadow-xl border border-emerald-500/30 p-6 md:p-7">
      
      {/* Background glow & accents */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider rounded-full shadow-md ring-2 ring-amber-300/30">
              <Trophy className="w-3.5 h-3.5 fill-amber-950" />
              {t.rank1Badge}
            </span>
            <span className="text-xs px-2.5 py-1 bg-emerald-700/60 text-emerald-200 border border-emerald-500/30 rounded-full font-medium">
              {topMandi.market.state} • {topMandi.market.district}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-900/60 border border-emerald-500/30 rounded-lg text-emerald-300 font-medium">
              {t.dailyDataBadge}
            </span>
          </div>
        </div>

        {/* Mandi Name & Core Value Proposition */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-emerald-700/50">
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-heading m-0">
                Sell at {topMandi.market.name}
              </h2>
              {topMandi.market.specialty && (
                <span className="text-xs text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/30 hidden sm:inline">
                  {topMandi.market.specialty}
                </span>
              )}
            </div>

            {/* Why Chosen Explanation Box with "Why?" Button */}
            <div className="mt-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3.5 max-w-3xl flex items-start justify-between gap-3 shadow-inner">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                    {t.whyChosenTitle}
                  </span>
                  <p className="text-sm font-medium text-emerald-50 leading-relaxed m-0">
                    {topMandi.whyChosen}
                  </p>
                </div>
              </div>

              {onOpenWhy && (
                <button
                  type="button"
                  onClick={onOpenWhy}
                  className="shrink-0 self-center px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow-md transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1"
                >
                  <span>Why?</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>


          {/* Big Profit Hero Stat */}
          <div className="lg:text-right shrink-0 bg-emerald-950/80 lg:bg-transparent p-4 lg:p-0 rounded-xl border lg:border-0 border-emerald-700/60">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
              {t.netReturnLabel}
            </span>
            <div className="text-3xl md:text-4xl font-black text-emerald-300 tracking-tight flex items-baseline lg:justify-end gap-1">
              <span className="text-xl md:text-2xl text-emerald-400">₹</span>
              <span>{Math.round(topMandi.netReturn).toLocaleString('en-IN')}</span>
            </div>
            {profitAdvantage > 0 && (
              <div className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                <span>+{Math.round(profitAdvantage).toLocaleString('en-IN')}</span>
                <span>{t.moreProfitThan2}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Key Pillar Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          
          {/* 1. Modal & Expected Price */}
          <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-xl p-3">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              {t.modalPriceLabel}
            </span>
            <div className="text-lg font-bold text-white mt-1">
              ₹{topMandi.price.toLocaleString('en-IN')}<span className="text-xs font-normal text-emerald-200">/q</span>
            </div>
            <div className="text-[11px] text-emerald-300/90 mt-0.5">
              <span>{t.expectedPriceLabel}: </span>
              <span className="font-semibold text-white">₹{topMandi.expectedPrice.toLocaleString('en-IN')}/q</span>
              <span className="block text-[10px] text-emerald-400/80">({t.estimateDisclaimer})</span>
            </div>
          </div>

          {/* 2. Road Distance */}
          <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-xl p-3">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {t.roadDistanceLabel}
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {topMandi.distanceKm} <span className="text-xs font-normal text-emerald-200">km</span>
            </div>
            <div className="text-[11px] text-emerald-200 mt-0.5">
              {topMandi.distanceKm <= 30 ? (
                <span className="text-emerald-300 font-medium">✓ {t.localMandiBadge}</span>
              ) : (
                <span className="text-teal-200">⚡ {t.highwayBadge}</span>
              )}
            </div>
          </div>

          {/* 3. Transport Cost */}
          <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-xl p-3">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-400" />
              {t.totalTransportLabel}
            </span>
            <div className="text-lg font-bold text-white mt-1">
              ₹{Math.round(topMandi.transport).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-200 mt-0.5">
              {topMandi.vehiclesNeeded} {t.vehiclesLabel} ({topMandi.vehicleType})
            </div>
          </div>

          {/* 4. Trend & Confidence */}
          <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-xl p-3">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              {t.trendLabel}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {topMandi.trend === 'UP' ? (
                <span className="inline-flex items-center gap-1 text-emerald-300 font-bold text-base">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {t.trendBullish}
                </span>
              ) : topMandi.trend === 'DOWN' ? (
                <span className="inline-flex items-center gap-1 text-rose-300 font-bold text-base">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  {t.trendBearish}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-300 font-bold text-base">
                  <Minus className="w-4 h-4 text-slate-400" />
                  {t.trendStable}
                </span>
              )}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-0.5">
              <span>{t.confidenceLabel} </span>
              <span className="font-semibold text-white">
                {Math.round(typeof topMandi.confidence === 'number' && topMandi.confidence <= 1 ? topMandi.confidence * 100 : topMandi.confidence)}%
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
