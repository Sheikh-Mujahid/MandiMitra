import React from 'react';
import { X, ShieldCheck, Calculator, AlertCircle, Info, Database } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function DataDisclaimerModal({ isOpen, onClose, lang, lastUpdated }) {
  if (!isOpen) return null;
  const t = translations[lang] || translations.en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading m-0 text-white">
                {t.modalHeaderTitle}
              </h3>
              <p className="text-xs text-emerald-200 m-0">
                {t.modalHeaderSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
          
          {/* Rule 1: Modal Prices */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <strong className="text-amber-900 text-sm">
                {t.modalRule1Title}
              </strong>
            </div>
            <p className="m-0 leading-relaxed text-amber-950">
              {t.modalRule1Text}
            </p>
          </div>

          {/* Rule 2: Forecast Disclaimer */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-700" />
              <strong className="text-blue-900 text-sm">
                {t.modalRule2Title}
              </strong>
            </div>
            <p className="m-0 leading-relaxed text-blue-950">
              {t.modalRule2Text}
            </p>
          </div>

          {/* Rule 3: Data Freshness */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-emerald-700" />
              <strong className="text-emerald-900 text-sm">
                {t.modalRule3Title}
              </strong>
            </div>
            <p className="m-0 leading-relaxed text-emerald-950">
              {t.modalRule3Text}
              <br />
              <span className="mt-1 inline-block">
                <strong>{t.dailyDataBadge}:</strong> {lastUpdated?.formattedDate || 'Daily Official Update'}
              </span>
            </p>
          </div>

          {/* Rule 4: Mathematical Formula */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-slate-700" />
              <strong className="text-slate-800 text-sm">
                {t.modalRule4Title}
              </strong>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] bg-slate-900 text-emerald-300 p-3 rounded-lg overflow-x-auto">
              <div>expectedPrice = modalPrice * (1 + trendAdjustment + userPriceChange)</div>
              <div>revenue = expectedPrice * quantity</div>
              <div>transport = vehiclesNeeded * roadDistanceKm * costPerKm * (roundTrip ? 2 : 1)</div>
              <div>netReturn = revenue - transport - loading - marketFee - commission - wastage</div>
            </div>
            <p className="mt-2 text-slate-500 m-0">
              {t.consistentMathNote}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition"
          >
            {t.acknowledgeBtn}
          </button>
        </div>

      </div>
    </div>
  );
}
