import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  Plus, 
  IndianRupee,
  Edit2
} from 'lucide-react';
import { translations } from '../i18n/translations';

const STORAGE_KEY = 'mandimitra_price_alert';

export default function PriceAlertBanner({
  rankedMarkets = [],
  currentCrop = 'soybean',
  cropName = 'Crop',
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  const [alertConfig, setAlertConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [targetMarketId, setTargetMarketId] = useState('');

  // Sync to localStorage
  useEffect(() => {
    if (alertConfig) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alertConfig));
      } catch {}
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [alertConfig]);

  // Set default market when opening edit mode
  const openEditor = () => {
    setTargetMarketId(alertConfig?.marketId || rankedMarkets[0]?.market?.id || '');
    setTargetPriceInput(alertConfig?.targetPrice ? String(alertConfig.targetPrice) : String(Math.round((rankedMarkets[0]?.price || 3000) * 1.05)));
    setIsEditing(true);
  };

  const handleSaveAlert = (e) => {
    e.preventDefault();
    const targetPrice = Number(targetPriceInput);
    if (!targetPrice || targetPrice <= 0) return;

    setAlertConfig({
      crop: currentCrop,
      marketId: targetMarketId,
      targetPrice,
      createdAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleClearAlert = () => {
    setAlertConfig(null);
    setIsEditing(false);
  };

  // Find target market in currently ranked markets
  const targetMarket = alertConfig 
    ? rankedMarkets.find((m) => m.market?.id === alertConfig.marketId)
    : null;

  const currentPrice = targetMarket ? targetMarket.price : null;
  const isTriggered = alertConfig && currentPrice && currentPrice >= alertConfig.targetPrice;
  const priceGap = alertConfig && currentPrice ? alertConfig.targetPrice - currentPrice : null;

  return (
    <div className="rounded-2xl overflow-hidden transition-all shadow-sm">
      {isEditing ? (
        /* Alert Setup Form */
        <div className="bg-slate-900 text-white p-4 sm:p-5 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white m-0">
                Set In-App Target Price Alert ({cropName})
              </h4>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveAlert} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Select Mandi
              </label>
              <select
                value={targetMarketId}
                onChange={(e) => setTargetMarketId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {rankedMarkets.map((m) => (
                  <option key={m.market.id} value={m.market.id}>
                    {m.market.name} (Current: ₹{m.price}/q)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Target Modal Price (₹/quintal)
              </label>
              <input
                type="number"
                min="500"
                max="25000"
                value={targetPriceInput}
                onChange={(e) => setTargetPriceInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 3100"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition shadow-sm text-center"
              >
                Save Price Alert
              </button>
              {alertConfig && (
                <button
                  type="button"
                  onClick={handleClearAlert}
                  className="bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold px-3 py-2 rounded-xl transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      ) : alertConfig ? (
        /* Active Alert Display Banner */
        <div className={`p-4 rounded-2xl border transition-all ${
          isTriggered 
            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md ring-2 ring-emerald-300' 
            : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                isTriggered ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-amber-400'
              }`}>
                {isTriggered ? <CheckCircle2 className="w-5 h-5" /> : <BellRing className="w-5 h-5 animate-bounce" />}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isTriggered ? 'bg-slate-950 text-white' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {isTriggered ? 'Target Price Reached!' : 'Target Price Watch'}
                  </span>
                  <span className="font-bold text-sm">
                    {targetMarket?.market?.name || 'Mandi'}: Target ₹{alertConfig.targetPrice.toLocaleString('en-IN')}/q
                  </span>
                </div>

                <p className={`mt-0.5 m-0 font-medium ${isTriggered ? 'text-slate-900 font-bold' : 'text-slate-300'}`}>
                  {isTriggered ? (
                    `Current official modal price has hit ₹${currentPrice.toLocaleString('en-IN')}/q! Optimal time to load harvest and lock in premium.`
                  ) : priceGap !== null && priceGap > 0 ? (
                    `Current price is ₹${currentPrice.toLocaleString('en-IN')}/q (₹${priceGap.toLocaleString('en-IN')}/q away from your target).`
                  ) : (
                    `Monitoring ${targetMarket?.market?.name || 'target mandi'} daily updates.`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={openEditor}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  isTriggered 
                    ? 'bg-slate-950 text-white hover:bg-slate-800' 
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Alert</span>
              </button>
              <button
                onClick={handleClearAlert}
                className="p-1.5 rounded-lg hover:bg-black/10 text-slate-400 hover:text-slate-600"
                title="Remove Price Alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Promo State to Set Alert */
        <div className="bg-slate-100 hover:bg-slate-200/80 border border-dashed border-slate-300 rounded-2xl p-3 flex items-center justify-between transition cursor-pointer"
          onClick={openEditor}
        >
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <div className="p-1.5 bg-white text-emerald-700 rounded-lg shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <span>
              <strong>Set In-App Price Alert:</strong> Get notified when a mandi reaches your target modal price for {cropName}.
            </span>
          </div>
          <button 
            type="button" 
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Alert</span>
          </button>
        </div>
      )}
    </div>
  );
}
