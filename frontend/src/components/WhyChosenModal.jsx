import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  IndianRupee, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Scale,
  CloudRain,
  Droplets,
  Wind,
  Info
} from 'lucide-react';
import { explainRecommendation } from '../engine/explain';
import { translations } from '../i18n/translations';

export default function WhyChosenModal({
  isOpen,
  onClose,
  topMandi,
  runnerUp,
  nearestMandi,
  highestPriceMandi,
  cropName = 'Crop',
  quantity = 50,
  lang = 'en'
}) {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  if (!isOpen || !topMandi) return null;

  const explanation = explainRecommendation({
    top: topMandi,
    runnerUp,
    nearest: nearestMandi,
    highestPriceMarket: highestPriceMandi,
    cropName,
    lang
  });

  const structured = explanation.structured;
  const cb = topMandi.costBreakdown || {};

  const isHighestPriceNotHighestProfit = Boolean(
    highestPriceMandi &&
    (highestPriceMandi.market?.id || highestPriceMandi.marketId) !== (topMandi.market?.id || topMandi.marketId) &&
    (highestPriceMandi.price || highestPriceMandi.modalPrice) > (topMandi.price || topMandi.modalPrice)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">
                Why was {topMandi.market.name} chosen as #1?
              </h2>
              <p className="text-xs text-emerald-100/90">
                Transparent mathematical rationale & deductions waterfall
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Highest Price is not Highest Profit Banner */}
          {isHighestPriceNotHighestProfit && highestPriceMandi && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 block mb-0.5">
                  Core Insight: Highest Price is NOT Highest Profit
                </span>
                <p className="text-xs text-amber-950 leading-relaxed m-0 font-medium">
                  <strong>{highestPriceMandi.market.name}</strong> offers the highest posted modal price of 
                  <strong> ₹{Math.round(highestPriceMandi.price || highestPriceMandi.modalPrice)}/q</strong>, but is 
                  <strong> {highestPriceMandi.distanceKm} km</strong> away. The extra transport freight completely consumes the price premium. 
                  Selling at <strong>{topMandi.market.name}</strong> saves logistics and leaves you with the highest net in-pocket return!
                </p>
              </div>
            </div>
          )}

          {/* Plain-Language Explanation */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Decision Summary
            </span>
            <p className="text-sm font-medium text-slate-800 leading-relaxed m-0">
              {explanation.summary}
            </p>
          </div>

          {/* Mini 3-Day Forecast Strip for Selected Market */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {translations[lang]?.weather3DayForecast || '3-Day Weather Forecast'} • {topMandi.market.name}
                </span>
                {topMandi.weather?.isSampleOverride && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                    {translations[lang]?.weatherSampleData || 'Sample Data'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>{translations[lang]?.weatherUpdated || 'Forecast updated'} {topMandi.weather?.updatedAt || '10:30 AM'}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                  topMandi.weather?.level === 'risk'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : topMandi.weather?.level === 'caution'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {topMandi.weather?.level === 'risk' 
                    ? (translations[lang]?.weatherRisk || 'Risk') 
                    : topMandi.weather?.level === 'caution' 
                    ? (translations[lang]?.weatherCaution || 'Caution') 
                    : (translations[lang]?.weatherClear || 'Clear')}
                </span>
              </div>
            </div>

            {/* 3-day cards strip */}
            {topMandi.weather?.days && topMandi.weather.days.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {topMandi.weather.days.slice(0, 3).map((d, i) => {
                  const dayTitle = i === 0 
                    ? (lang === 'mr' ? 'आज' : lang === 'hi' ? 'आज' : 'Today') 
                    : i === 1 
                    ? (lang === 'mr' ? 'उद्या' : lang === 'hi' ? 'कल' : 'Tomorrow') 
                    : (lang === 'mr' ? 'परवा' : lang === 'hi' ? 'परसों' : 'Day 3');
                  return (
                    <div key={d.date || i} className={`p-2.5 rounded-xl border text-center ${
                      i === 0 ? 'bg-white border-emerald-300 ring-1 ring-emerald-200 shadow-xs' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>{dayTitle}</span>
                        <span className="text-[10px] font-medium text-slate-400">{d.date?.slice(5)}</span>
                      </div>
                      <div className="text-base font-black text-slate-800 my-0.5">
                        {Math.round(d.tempMax)}°C
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 truncate">
                        {d.label}
                      </div>
                      <div className="mt-1 text-[10px] text-cyan-700 font-semibold flex items-center justify-center gap-1">
                        <Droplets className="w-3 h-3" />
                        <span>{d.precipProb}% rain</span>
                        {d.precipSum > 0 && <span>({d.precipSum}mm)</span>}
                      </div>
                      {d.windSpeed > 0 && (
                        <div className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                          <Wind className="w-2.5 h-2.5" />
                          <span>{Math.round(d.windSpeed)} km/h</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                <span className="font-semibold block">{translations[lang]?.weatherUnavailable || 'Weather unavailable'}</span>
                <span className="text-[11px] text-slate-400">Transit weather service offline. No penalty applied.</span>
              </div>
            )}

            {/* Advisory Notice */}
            <p className="text-[10px] text-slate-500 italic m-0 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>{translations[lang]?.weatherAdvisory || 'Forecasts are estimates and may change.'}</span>
            </p>
          </div>

          {/* Margin Over Runner-Up Card */}
          {runnerUp && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">
                  Advantage over #2 ({runnerUp.market.name})
                </span>
                <div className="text-xl font-black text-emerald-700">
                  +₹{Math.round(structured.marginOverRunnerUpRs).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  (+{structured.marginOverRunnerUpPct}% more in-pocket net profit)
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase block mb-0.5">
                  Price Premium
                </span>
                <div className="text-xl font-black text-slate-800">
                  ₹{Math.round(topMandi.expectedPrice)}/q
                </div>
                <span className="text-[11px] text-slate-500">
                  vs ₹{Math.round(runnerUp.expectedPrice)}/q at runner-up
                </span>
              </div>
            </div>
          )}

          {/* Profit Breakdown Waterfall List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Net Profit Deductions Breakdown ({quantity} Quintals)
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs font-medium">
              
              {/* Gross Revenue */}
              <div className="px-4 py-2.5 flex items-center justify-between bg-emerald-50/60 font-bold text-emerald-950">
                <span>(+) Gross Crop Revenue ({quantity} q × ₹{Math.round(topMandi.expectedPrice)})</span>
                <span className="text-sm text-emerald-700">+₹{Math.round(topMandi.revenue).toLocaleString('en-IN')}</span>
              </div>

              {/* Transport */}
              <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  (-) Road Transport Freight ({topMandi.distanceKm} km, {topMandi.vehiclesNeeded} veh.)
                </span>
                <span className="font-bold text-rose-600">-₹{Math.round(topMandi.transport).toLocaleString('en-IN')}</span>
              </div>

              {/* Loading & Unloading */}
              <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                <span>(-) Hamali & Loading Charges</span>
                <span className="font-semibold text-rose-600">-₹{Math.round(cb.loading || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* APMC Market Fee */}
              <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                <span>(-) APMC Cess & Market Fee</span>
                <span className="font-semibold text-rose-600">-₹{Math.round(cb.marketFee || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Commission (if applicable) */}
              {(cb.commission || 0) > 0 && (
                <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                  <span>(-) Commission & Brokerage</span>
                  <span className="font-semibold text-rose-600">-₹{Math.round(cb.commission).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Weighment / Tolai */}
              <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                <span>(-) Weighment (Tolai) Charges</span>
                <span className="font-semibold text-rose-600">-₹{Math.round(cb.weighment || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Transit Spoilage / Wastage */}
              <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                <span>(-) Transit Spoilage & Handling Loss</span>
                <span className="font-semibold text-rose-600">-₹{Math.round(cb.wastage || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Storage (if applicable) */}
              {(cb.storage || 0) > 0 && (
                <div className="px-4 py-2 flex items-center justify-between text-slate-700">
                  <span>(-) Storage & Holding Cost</span>
                  <span className="font-semibold text-rose-600">-₹{Math.round(cb.storage).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Total Deductions Reconciliation Bar */}
              <div className="px-4 py-2 flex items-center justify-between bg-slate-50 text-slate-500 text-[11px] font-semibold border-t border-slate-200">
                <span>Total Costs & Deductions (Transport + Other Costs)</span>
                <span className="text-rose-700 font-bold">-₹{Math.round((topMandi.transport || 0) + (topMandi.otherCosts || 0)).toLocaleString('en-IN')}</span>
              </div>

              {/* Final Net In-Pocket Return */}
              <div className="px-4 py-3 flex items-center justify-between bg-emerald-100/60 font-black text-emerald-950 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  (=) In-Pocket Net Return (Farmer Take-Home)
                </span>
                <span className="text-base text-emerald-800">
                  ₹{Math.round(topMandi.netReturn).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Mathematical Formula */}
          <div className="border-t border-slate-100 pt-2">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1"
            >
              <span>View Underlying Formula & Constants</span>
              {showFormulaDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFormulaDetails && (
              <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed space-y-1">
                <div>expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)</div>
                <div>revenue = expectedPrice * quantity</div>
                <div>transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)</div>
                <div>otherCosts = loading + marketFee + commission + weighment + wastage</div>
                <div className="text-emerald-400 font-bold">netReturn = revenue - transport - otherCosts</div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
