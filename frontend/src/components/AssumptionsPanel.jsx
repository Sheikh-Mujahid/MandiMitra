import React, { useState } from 'react';
import { 
  Sliders, 
  MapPin, 
  Truck, 
  Scale, 
  TrendingUp, 
  ArrowLeftRight, 
  Settings2, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Compass,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { VEHICLE_CONFIGS } from '../engine/engine';
import { translations } from '../i18n/translations';

export default function AssumptionsPanel({
  assumptions,
  setAssumptions,
  crops,
  origins,
  lang,
  onReset,
  onApplyPreset
}) {
  const t = translations[lang] || translations.en;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState(null);

  const snapToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGeoLocating(true);
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        let nearest = origins[0];
        let minDist = Infinity;
        for (const o of origins) {
          const lat = o.lat || o.latitude;
          const lon = o.lon || o.longitude;
          const d = Math.hypot(userLat - lat, userLon - lon);
          if (d < minDist) {
            minDist = d;
            nearest = o;
          }
        }
        if (nearest) {
          setAssumptions(prev => ({ ...prev, location: nearest.id || nearest.location_id }));
          setGeoMsg({ type: 'success', text: `Snapped to nearest town: ${nearest.name}` });
        }
        setGeoLocating(false);
      },
      (err) => {
        setGeoLocating(false);
        setGeoMsg({ type: 'error', text: `GPS error: ${err.message}` });
      },
      { timeout: 7000 }
    );
  };

  const currentCropObj = crops.find(c => c.id === assumptions.crop) || crops[0] || {};

  const handleCropChange = (cropId) => {
    const cropMeta = crops.find(c => c.id === cropId);
    setAssumptions(prev => ({
      ...prev,
      crop: cropId,
      ratePerKm: cropMeta?.defaultRatePerKm || prev.ratePerKm
    }));
  };

  const getCropDisplayName = (c) => {
    if (lang === 'mr') return c.nameMr || c.name;
    if (lang === 'hi') return c.nameHi || c.name;
    return c.name;
  };

  const getVehicleDisplayName = (v) => {
    if (lang === 'mr') return v.nameMr || v.name;
    if (lang === 'hi') return v.nameHi || v.name;
    return v.name;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* Panel Header */}
      <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 m-0">
              {t.panelTitle}
            </h2>
            <p className="text-xs text-slate-500 m-0">
              {t.panelSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1.5 rounded-md transition"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.resetBtn}</span>
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Quick Demo Scenario Bar */}
        {onApplyPreset && (
          <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-400 text-amber-950 rounded-lg text-xs font-black">
                DEMO
              </span>
              <span className="text-xs font-bold text-amber-950">
                {lang === 'mr' ? 'डेमो परिस्थिती:' : lang === 'hi' ? 'डेमो परिदृश्य:' : 'Demo Scenario:'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onApplyPreset('wheat_amravati_flip')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              title="50 q Wheat from Amravati: Raising freight flips #1 between Buldhana and Amravati"
            >
              <span>50 q Wheat from Amravati</span>
              <span className="text-[10px] bg-amber-950 text-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                Flip #1
              </span>
            </button>
          </div>
        )}

        {/* 1. Crop Selection Chips */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t.step1Crop}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {crops.map((c) => {
              const isSelected = assumptions.crop === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCropChange(c.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300/40'
                      : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="truncate">{getCropDisplayName(c)}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 ml-1"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Geolocation feedback notification */}
        {geoMsg && (
          <div className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-medium ${
            geoMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {geoMsg.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span>{geoMsg.text}</span>
          </div>
        )}

        {/* 2. Farm Location & Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.step2Location}</span>
              </label>
              <button
                type="button"
                onClick={snapToCurrentLocation}
                disabled={geoLocating}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                title="Use browser geolocation to snap to the nearest farmer origin town"
              >
                {geoLocating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3 text-emerald-600" />
                    <span>Use My Location</span>
                  </>
                )}
              </button>
            </div>
            <select
              value={assumptions.location}
              onChange={(e) => setAssumptions(prev => ({ ...prev, location: e.target.value }))}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {origins.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {origins.find(o => o.id === assumptions.location)?.description || 'Actual road distance calculated to all mandis'}
            </p>
          </div>

          {/* Quantity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.step3Quantity}</span>
              </label>
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800 font-bold text-xs">
                <span>{assumptions.quantity} {t.qntlUnit}</span>
                <span className="text-[11px] font-normal text-emerald-600">
                  ({(assumptions.quantity / 10).toFixed(1)} {t.tonnesUnit})
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={assumptions.quantity}
                onChange={(e) => setAssumptions(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-emerald-600"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={assumptions.quantity}
                  onChange={(e) => setAssumptions(prev => ({ ...prev, quantity: Math.max(0.1, Number(e.target.value) || 0) }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t.qntlUnit}</span>
              </div>
            </div>
            {assumptions.quantity <= 0 && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Quantity must be greater than 0 quintals.
              </p>
            )}
          </div>
        </div>


        {/* 3. Transport Vehicle & Rate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 border-t border-slate-100">
          {/* Vehicle Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.step4Vehicle}</span>
            </label>
            <select
              value={assumptions.vehicle}
              onChange={(e) => {
                const newVeh = e.target.value;
                setAssumptions(prev => ({
                  ...prev,
                  vehicle: newVeh,
                  ratePerKm: VEHICLE_CONFIGS[newVeh]?.defaultRatePerKm || prev.ratePerKm
                }));
              }}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="auto">
                {lang === 'mr' ? '✨ ऑटो-निवड (कमाल फायदा)' : lang === 'hi' ? '✨ ऑटो-चयन (सर्वश्रेष्ठ)' : '✨ Auto-Select (Optimal)'}
              </option>
              {Object.values(VEHICLE_CONFIGS).map(v => (
                <option key={v.id} value={v.id}>
                  {getVehicleDisplayName(v)} ({v.capacityQntl}q cap)
                </option>
              ))}
            </select>
          </div>

          {/* Rate per km */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.step5Rate}
              </label>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ₹{assumptions.ratePerKm}/km
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="65"
              step="1"
              value={assumptions.ratePerKm}
              onChange={(e) => setAssumptions(prev => ({ ...prev, ratePerKm: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹15</span>
              <span>₹35</span>
              <span>₹65</span>
            </div>
          </div>

          {/* Round Trip Toggle */}
          <div className="flex flex-col justify-end">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.step6Trip}</span>
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setAssumptions(prev => ({ ...prev, roundTrip: false }))}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  !assumptions.roundTrip
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.oneWay}
              </button>
              <button
                type="button"
                onClick={() => setAssumptions(prev => ({ ...prev, roundTrip: true }))}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  assumptions.roundTrip
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.roundTrip}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Scenario Stress Testing: Price Adjustment */}
        <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <label className="text-xs font-bold text-amber-900">
                {t.stressTestTitle}
              </label>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
              assumptions.priceAdjust > 0
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : assumptions.priceAdjust < 0
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {assumptions.priceAdjust > 0 ? `+${assumptions.priceAdjust}%` : `${assumptions.priceAdjust}%`}
            </span>
          </div>

          <p className="text-[11px] text-amber-800/80 mb-2">
            {t.stressTestDesc}
          </p>

          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={assumptions.priceAdjust}
            onChange={(e) => setAssumptions(prev => ({ ...prev, priceAdjust: Number(e.target.value) }))}
            className="w-full h-2 bg-amber-200 rounded-lg cursor-pointer accent-amber-600"
          />
          <div className="flex justify-between text-[10px] text-amber-800/70 mt-1">
            <span>{t.stressTestCrash}</span>
            <button
              onClick={() => setAssumptions(prev => ({ ...prev, priceAdjust: 0 }))}
              className="underline hover:text-amber-950 font-semibold"
            >
              {t.stressTestBaseline}
            </button>
            <span>{t.stressTestSurge}</span>
          </div>
        </div>

        {/* 5. Advanced Mandi Fees Accordion */}
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              {t.advancedToggle}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">
                  {t.loadingLabel}
                </span>
                <input
                  type="number"
                  value={assumptions.extraCosts.loadingPerQntl ?? 12}
                  onChange={(e) => setAssumptions(prev => ({
                    ...prev,
                    extraCosts: { ...prev.extraCosts, loadingPerQntl: Number(e.target.value) }
                  }))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">
                  {t.cessLabel}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={assumptions.extraCosts.marketFeePercent ?? 1.0}
                  onChange={(e) => setAssumptions(prev => ({
                    ...prev,
                    extraCosts: { ...prev.extraCosts, marketFeePercent: Number(e.target.value) }
                  }))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">
                  {t.weighmentLabel}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={assumptions.extraCosts.weighmentPerQntl ?? 6}
                  onChange={(e) => setAssumptions(prev => ({
                    ...prev,
                    extraCosts: { ...prev.extraCosts, weighmentPerQntl: Number(e.target.value) }
                  }))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">
                  {t.spoilageLabel}
                </span>
                <select
                  value={assumptions.extraCosts.spoilageFactor ? 'standard' : 'zero'}
                  onChange={(e) => setAssumptions(prev => ({
                    ...prev,
                    extraCosts: {
                      ...prev.extraCosts,
                      spoilageFactor: e.target.value === 'zero' ? 0.0 : currentCropObj.spoilageFactor
                    }
                  }))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-semibold"
                >
                  <option value="standard">{t.spoilageDistance}</option>
                  <option value="zero">{t.spoilageZero}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Visible note under prices */}
        <div className="pt-2 border-t border-slate-100">
          <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-900 leading-relaxed">
              Modal prices from official mandi data; actual price depends on quality and grade.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

