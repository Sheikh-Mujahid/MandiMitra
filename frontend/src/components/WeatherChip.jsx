import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  CloudSun, 
  CloudRain, 
  CloudLightning, 
  CloudDrizzle, 
  CloudFog, 
  CloudOff, 
  Wind, 
  Droplets,
  AlertTriangle,
  Info
} from 'lucide-react';
import { translations } from '../i18n/translations';

/**
 * Maps WMO weather code / icon name to Lucide Icon
 */
function getWeatherIcon(iconName, weatherCode) {
  if (weatherCode >= 95) return CloudLightning;
  if (weatherCode === 65 || weatherCode === 82) return CloudRain;
  if (weatherCode >= 51 && weatherCode <= 63) return CloudDrizzle;
  if (weatherCode === 45 || weatherCode === 48) return CloudFog;
  if (weatherCode === 1 || weatherCode === 2) return CloudSun;
  if (weatherCode === 0) return Sun;
  return Sun;
}

export default function WeatherChip({ weather, mandiName = 'Market', lang = 'en', isSampleOverride = false, updatedAt = '10:30 AM' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  const t = translations[lang] || translations.en;

  const isAvailable = Boolean(weather?.isAvailable && weather?.days && weather?.days?.length > 0);
  const day0 = weather?.day0 || weather?.days?.[0] || null;
  const level = weather?.level || 'clear';

  const WeatherIcon = isAvailable ? getWeatherIcon(day0?.icon, day0?.weatherCode) : CloudOff;

  // Level-based styling
  let badgeClasses = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
  let dotColor = 'bg-slate-400';
  let levelLabel = t.weatherClear;

  if (isAvailable) {
    if (level === 'risk') {
      badgeClasses = 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-300/60';
      dotColor = 'bg-rose-500 animate-ping';
      levelLabel = t.weatherRisk;
    } else if (level === 'caution') {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
      dotColor = 'bg-amber-500';
      levelLabel = t.weatherCaution;
    } else {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
      dotColor = 'bg-emerald-500';
      levelLabel = t.weatherClear;
    }
  }

  // Format date helper
  const formatDayName = (dateStr, idx) => {
    if (idx === 0) return lang === 'mr' ? 'आज' : lang === 'hi' ? 'आज' : 'Today';
    if (idx === 1) return lang === 'mr' ? 'उद्या' : lang === 'hi' ? 'कल' : 'Tomorrow';
    if (!dateStr) return `Day ${idx + 1}`;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all shadow-xs cursor-pointer ${badgeClasses}`}
        title="View 3-day transit weather forecast"
        aria-label={`Weather for ${mandiName}: ${level}`}
      >
        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`}></span>
        <WeatherIcon className="w-3.5 h-3.5 shrink-0" />
        {isAvailable ? (
          <>
            <span>{Math.round(day0.tempMax)}°C</span>
            <span className="text-[11px] font-semibold opacity-80 flex items-center gap-0.5">
              <Droplets className="w-3 h-3" />
              {day0.precipProb}%
            </span>
          </>
        ) : (
          <span className="text-[11px] font-normal">{t.weatherUnavailable}</span>
        )}
      </button>

      {/* Floating 3-Day Forecast Tooltip / Popover */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150 text-xs pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>{mandiName}</span>
                {isSampleOverride && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                    {t.weatherSampleData}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                {t.weatherUpdated} {updatedAt}
              </span>
            </div>

            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
              level === 'risk'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : level === 'caution'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {levelLabel}
            </span>
          </div>

          {/* Reasons if Caution / Risk */}
          {weather?.reasons && weather.reasons.length > 0 && level !== 'clear' && (
            <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-700/40 text-amber-200 text-[11px] flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{weather.reasons.join(' • ')}</span>
            </div>
          )}

          {/* 3-Day Forecast Strip */}
          {isAvailable ? (
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              {weather.days.slice(0, 3).map((d, i) => {
                const Icon = getWeatherIcon(d.icon, d.weatherCode);
                return (
                  <div
                    key={d.date || i}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-between ${
                      i === 0
                        ? 'bg-slate-800 border-slate-700 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-800'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-300 block mb-1">
                      {formatDayName(d.date, i)}
                    </span>
                    <Icon className="w-5 h-5 text-amber-300 my-1" />
                    <span className="text-[10px] text-slate-200 font-medium block truncate max-w-full">
                      {d.label}
                    </span>
                    <span className="text-xs font-black text-white mt-1">
                      {Math.round(d.tempMax)}°C
                    </span>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-300 font-semibold">
                      <Droplets className="w-2.5 h-2.5" />
                      <span>{d.precipProb}%</span>
                      {d.precipSum > 0 && <span className="text-[9px] text-cyan-400">({d.precipSum}mm)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-slate-400 text-xs">
              <CloudOff className="w-6 h-6 mx-auto text-slate-500 mb-1" />
              <p className="m-0 font-medium">{t.weatherUnavailable}</p>
              <p className="m-0 text-[10px] text-slate-500 mt-1">No transit penalty applied.</p>
            </div>
          )}

          {/* Mandatory Advisory Notice */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>{t.weatherAdvisory}</span>
            </span>
            <span className="text-slate-500">Open-Meteo</span>
          </div>

          {/* Pointer caret */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
