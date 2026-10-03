import React, { useState } from 'react';
import { useFarmer } from '../context/FarmerContext';
import { VEHICLE_PRESETS } from '../engine/engine';
import { translations } from '../i18n/translations';
import { 
  Wheat, 
  MapPin, 
  Truck, 
  IndianRupee, 
  ArrowLeftRight, 
  TrendingUp, 
  Compass, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info,
  ChevronDown
} from 'lucide-react';

export default function FarmerInputForm() {
  const {
    lang,
    loading,
    apiData,
    formState,
    updateField,
    errors,
    geoLocating,
    geoMessage,
    snapToCurrentLocation
  } = useFarmer();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const t = translations[lang] || translations.en;

  const crops = apiData.crops || [];
  const origins = apiData.distances?.farmerOrigins || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition-all hover:shadow-md">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <Wheat className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading leading-tight">
                {lang === 'mr' ? 'शेतकरी इनपुट व परिस्थिती' : lang === 'hi' ? 'किसान इनपुट व परिदृश्य' : 'Farmer Farm Inputs & Logistics'}
              </h2>
              <p className="text-xs text-emerald-100/90">
                {lang === 'mr' 
                  ? 'आपली पीक माहिती व वाहनाचे पर्याय भरा' 
                  : lang === 'hi' 
                  ? 'अपनी फसल व परिवहन विवरण दर्ज करें' 
                  : 'Customize crop, location, haulage vehicle, and price outlook'}
              </p>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium backdrop-blur-sm animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing</span>
            </div>
          )}
        </div>
      </div>

      {/* Geolocation feedback notification */}
      {geoMessage && (
        <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
          geoMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {geoMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{geoMessage.text}</span>
        </div>
      )}

      {/* Form Controls Body */}
      <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-5">
        
        {/* 1. Crop Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wheat className="w-3.5 h-3.5 text-emerald-600" />
              {t.cropSelect}
            </span>
            <span className="text-[11px] font-normal text-slate-400 capitalize">
              {crops.length} crops available
            </span>
          </label>
          <div className="relative">
            <select
              value={formState.crop}
              onChange={(e) => updateField('crop', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all cursor-pointer"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'mr' ? c.nameMr : lang === 'hi' ? c.nameHi : c.name} ({c.name})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Quantity (Quintals) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.quantityLabel}
            </label>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
              {formState.quantity} {t.quintals} ({(formState.quantity / 10).toFixed(1)} {t.tonnes})
            </span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="5"
              max="250"
              step="5"
              value={formState.quantity}
              onChange={(e) => updateField('quantity', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="2000"
                value={formState.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                className={`w-full bg-slate-50 border ${
                  errors.quantity ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                } focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 transition-all`}
                placeholder="Enter quantity in quintals"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">{t.quintals}</span>
            </div>
            {errors.quantity && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.quantity}
              </p>
            )}
          </div>
        </div>

        {/* 3. Farmer Origin Location */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {t.locationLabel}
            </label>
            <button
              type="button"
              onClick={snapToCurrentLocation}
              disabled={geoLocating}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/80 transition-colors"
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
          <div className="relative">
            <select
              value={formState.location}
              onChange={(e) => updateField('location', e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all cursor-pointer"
            >
              {origins.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. Vehicle Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            {t.vehicleType}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pickup', label: 'Pickup', cap: '20q' },
              { id: 'tractor', label: 'Tractor', cap: '40q' },
              { id: 'truck', label: 'Truck', cap: '100q' }
            ].map((v) => {
              const isSelected = formState.vehicle === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => updateField('vehicle', v.id)}
                  className={`px-3 py-2 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{v.label}</div>
                  <div className="text-[10px] text-slate-500">{v.cap} cap</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Freight Rate (₹/km) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              {t.ratePerKmLabel}
            </label>
            <span className="text-xs font-bold text-slate-700">
              ₹{formState.ratePerKm} / km
            </span>
          </div>
          <div className="space-y-1.5">
            <input
              type="range"
              min="10"
              max="70"
              step="1"
              value={formState.ratePerKm}
              onChange={(e) => updateField('ratePerKm', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            {errors.ratePerKm && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.ratePerKm}
              </p>
            )}
          </div>
        </div>

        {/* 6. Round-trip haulage toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-slate-800">{t.roundTripLabel}</div>
              <div className="text-[11px] text-slate-500">
                {formState.roundTrip ? 'Driver charges round-trip haulage (x2 distance)' : 'One-way freight only (x1 distance)'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('roundTrip', !formState.roundTrip)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              formState.roundTrip ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formState.roundTrip ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 7. Optional expected price change */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              {t.priceStressTest}
            </label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              formState.priceAdjust > 0 
                ? 'bg-emerald-100 text-emerald-800' 
                : formState.priceAdjust < 0 
                ? 'bg-rose-100 text-rose-800' 
                : 'bg-slate-100 text-slate-700'
            }`}>
              {formState.priceAdjust > 0 ? `+${formState.priceAdjust}%` : `${formState.priceAdjust}%`}
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={formState.priceAdjust}
            onChange={(e) => updateField('priceAdjust', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>-20% Crash</span>
            <span>0% (As Posted)</span>
            <span>+20% Surge</span>
          </div>
        </div>

        {/* Prominent Official Data Note */}
        <div className="pt-2 border-t border-slate-100">
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-900 leading-relaxed">
              Modal prices from official mandi data; actual price depends on quality and grade.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
