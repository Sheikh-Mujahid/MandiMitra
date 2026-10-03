import React from 'react';
import { 
  Sprout, 
  Languages, 
  Info, 
  Sparkles
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Header({ 
  lang, 
  setLang, 
  lastUpdated, 
  onOpenDisclaimer,
  onApplyPreset 
}) {
  const t = translations[lang] || translations.en;

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
            <div className="hidden lg:flex items-center bg-emerald-950/60 rounded-lg p-1 border border-emerald-700/60">
              <span className="px-2 text-emerald-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {t.presetsLabel}
              </span>
              <button
                onClick={() => onApplyPreset('onion_nashik')}
                className="px-2.5 py-1 rounded hover:bg-emerald-800 text-emerald-100 transition-colors"
                title="50 Qntl Onion from Niphad"
              >
                {t.presetOnion}
              </button>
              <button
                onClick={() => onApplyPreset('tomato_dindori')}
                className="px-2.5 py-1 rounded hover:bg-emerald-800 text-emerald-100 transition-colors"
                title="30 Qntl Tomato from Dindori"
              >
                {t.presetTomato}
              </button>
              <button
                onClick={() => onApplyPreset('soybean_indore')}
                className="px-2.5 py-1 rounded hover:bg-emerald-800 text-emerald-100 transition-colors"
                title="60 Qntl Soybean from Sanwer"
              >
                {t.presetSoybean}
              </button>
            </div>

            {/* Daily Data Badge */}
            <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-600/40 text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm animate-pulse"></span>
              <span className="font-medium whitespace-nowrap">
                {t.dailyDataBadge}
              </span>
            </div>

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
