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
  Scale
} from 'lucide-react';
import { explainRecommendation } from '../engine/explain';

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
