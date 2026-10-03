import React from 'react';
import { 
  Sprout, 
  Languages, 
  Info, 
  Sparkles,
  Database
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Header({ 
  lang, 
  setLang, 
  lastUpdated, 
  dataStatus,
  onOpenDisclaimer,
  onApplyPreset 
}) {
  const t = translations[lang] || translations.en;

  // Resolve freshness details from dataStatus or lastUpdated
  const freshness = dataStatus?.freshnessStatus || (lastUpdated?.dataAgeDays <= 1 ? 'fresh' : 'aging');
  const isSample = (dataStatus?.sourceType === 'sample') || (lastUpdated?.sourceType === 'sample');

  const getFreshnessBadge = () => {
    if (freshness === 'fresh') {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm animate-pulse"></span>
          <span className="font-semibold whitespace-nowrap">Updated Today</span>
        </div>
      );
    }
    if (freshness === 'aging') {
      return (
        <div className="flex items-center gap-1.5 bg-amber-950/80 px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="font-semibold whitespace-nowrap">Aging (2-3d)</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-rose-950/80 px-2.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
        <span className="font-semibold whitespace-nowrap">Stale (&gt;3d)</span>
      </div>
    );
  };

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-xl border-b border-emerald-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md text-emerald-950 flex items-center justify-center ring-2 ring-emerald-300/30">
              <Sprout className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-white m-0 font-heading">
                  {t.appTitle} <span className="text-emerald-300 font-extrabold">AI</span>
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-700/80 text-emerald-100 rounded-full border border-emerald-500/40">
                  {t.appBadge}
                </span>
                {isSample && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/90 text-amber-950 rounded-md shadow-sm border border-amber-300/60 uppercase tracking-wide">
                    Sample Data
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/90 font-medium m-0 flex items-center gap-1.5 mt-0.5">
                <span>{t.appSubtitle}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              </p>
            </div>
          </div>

          {/* Presets, Badges & Language Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Quick Demo Scenarios */}
            <div className="hidden lg:flex items-center bg-emerald-950/60 rounded-xl p-1 border border-emerald-700/60">
              <span className="px-2 text-emerald-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {t.presetsLabel}
              </span>
              
              {/* Highlighted Task 5 Preset: 50 q wheat from Amravati */}
              <button
                onClick={() => onApplyPreset('wheat_amravati_flip')}
                className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-bold border border-amber-400/30 transition-all flex items-center gap-1"
                title="50 q Wheat from Amravati: Raising freight flips #1 between Buldhana and Amravati"
              >
                <span>50 q Wheat (Amravati)</span>
                <span className="text-[9px] px-1 bg-amber-400 text-amber-950 rounded font-black">FLIP</span>
              </button>

              <button
                onClick={() => onApplyPreset('soybean_morshi')}
                className="px-2.5 py-1 rounded-lg hover:bg-emerald-800 text-emerald-100 transition-colors"
                title="60 Qntl Soybean from Morshi"
              >
                {t.presetSoybean}
              </button>
              <button
                onClick={() => onApplyPreset('gram_karanja')}
                className="px-2.5 py-1 rounded-lg hover:bg-emerald-800 text-emerald-100 transition-colors"
                title="40 Qntl Gram from Karanja Lad"
              >
                {t.presetGram}
              </button>
            </div>

            {/* Freshness Badge from /data-status */}
            {getFreshnessBadge()}

            {/* Disclaimer & Info Button */}
            <button
              onClick={onOpenDisclaimer}
              className="flex items-center gap-1 bg-emerald-800/80 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-600/40 text-emerald-100 transition shadow-sm"
              title="View Data Methodology & Modal Price Definition"
            >
              <Info className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.methodologyBtn}</span>
            </button>

            {/* 3-Way Language Toggle (English | हिंदी | मराठी) */}
            <div className="flex items-center bg-emerald-950/90 rounded-lg p-0.5 border border-emerald-600/50">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded font-semibold text-xs transition ${
                  lang === 'en'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded font-semibold text-xs transition ${
                  lang === 'hi'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`px-2 py-1 rounded font-semibold text-xs transition ${
                  lang === 'mr'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                मराठी
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
