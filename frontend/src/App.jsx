import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import AssumptionsPanel from './components/AssumptionsPanel';
import TopRecommendationBanner from './components/TopRecommendationBanner';
import RankedMandiList from './components/RankedMandiList';
import ProfitDistanceChart from './components/ProfitDistanceChart';
import RevenueCostWaterfallChart from './components/RevenueCostWaterfallChart';
import PriceTrendHistoryChart from './components/PriceTrendHistoryChart';
import MandiMap from './components/MandiMap';
import DataDisclaimerModal from './components/DataDisclaimerModal';

import { rankMarkets } from './engine/engine';
import { translations } from './i18n/translations';
import pricesData from '../../data/prices.json';
import distancesData from '../../data/distances.json';
import lastUpdatedData from '../../data/last_updated.json';

import { 
  BarChart3, 
  Map, 
  Layers, 
  TrendingUp, 
  ListOrdered, 
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState('en'); // 'en' | 'hi' | 'mr'
  const [activeTab, setActiveTab] = useState('rankings'); // 'rankings' | 'tradeoff' | 'waterfall' | 'trends' | 'map'
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  const t = translations[lang] || translations.en;

  const defaultAssumptions = {
    crop: 'onion',
    quantity: 50,
    location: 'niphad_farm',
    vehicle: 'auto',
    ratePerKm: 32,
    priceAdjust: 0,
    roundTrip: false,
    extraCosts: {
      loadingPerQntl: 12.0,
      marketFeePercent: 1.0,
      commissionPercent: 0.0,
      weighmentPerQntl: 6.0,
      spoilageFactor: 0.00015
    }
  };

  const [assumptions, setAssumptions] = useState(defaultAssumptions);

  // Pure reactive calculation: recalculates instantly on assumption change
  const rankedMarkets = useMemo(() => {
    return rankMarkets({
      crop: assumptions.crop,
      quantity: assumptions.quantity,
      location: assumptions.location,
      vehicle: assumptions.vehicle,
      ratePerKm: assumptions.ratePerKm,
      priceAdjust: assumptions.priceAdjust,
      roundTrip: assumptions.roundTrip,
      extraCosts: assumptions.extraCosts,
      lang
    });
  }, [assumptions, lang]);

  const topMandi = rankedMarkets[0];
  const runnerUp = rankedMarkets[1] || null;

  const currentCropObj = pricesData.crops.find(c => c.id === assumptions.crop) || pricesData.crops[0];
  const cropDisplayName = lang === 'mr' ? currentCropObj.nameMr : lang === 'hi' ? currentCropObj.nameHi : currentCropObj.name;

  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'onion_nashik') {
      setAssumptions({
        crop: 'onion',
        quantity: 50,
        location: 'niphad_farm',
        vehicle: 'auto',
        ratePerKm: 32,
        priceAdjust: 0,
        roundTrip: false,
        extraCosts: {
          loadingPerQntl: 12.0,
          marketFeePercent: 1.05,
          commissionPercent: 0.0,
          weighmentPerQntl: 6.0,
          spoilageFactor: 0.00015
        }
      });
    } else if (presetKey === 'tomato_dindori') {
      setAssumptions({
        crop: 'tomato',
        quantity: 30,
        location: 'dindori_farm',
        vehicle: 'tata407',
        ratePerKm: 30,
        priceAdjust: 0,
        roundTrip: false,
        extraCosts: {
          loadingPerQntl: 10.0,
          marketFeePercent: 1.0,
          commissionPercent: 0.0,
          weighmentPerQntl: 5.0,
          spoilageFactor: 0.00045
        }
      });
    } else if (presetKey === 'soybean_indore') {
      setAssumptions({
        crop: 'soybean',
        quantity: 60,
        location: 'sanwer_farm',
        vehicle: 'truck14ft',
        ratePerKm: 35,
        priceAdjust: 0,
        roundTrip: false,
        extraCosts: {
          loadingPerQntl: 13.0,
          marketFeePercent: 1.5,
          commissionPercent: 0.0,
          weighmentPerQntl: 6.5,
          spoilageFactor: 0.00002
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header with 3-way Language Selector */}
      <Header
        lang={lang}
        setLang={setLang}
        lastUpdated={lastUpdatedData}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onApplyPreset={handleApplyPreset}
      />

      {/* Mandatory Official Notice Bar */}
      <div className="bg-amber-500/10 border-b border-amber-300/40 text-amber-950 py-2 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">
              {lang === 'mr' ? 'सूचना' : lang === 'hi' ? 'सूचना' : 'Official Notice'}
            </span>
            <span className="font-medium">
              {t.officialNotice}
            </span>
          </div>

          <button
            onClick={() => setIsDisclaimerOpen(true)}
            className="text-amber-900 underline font-semibold hover:text-amber-950 whitespace-nowrap ml-auto"
          >
            {t.viewStandards}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Top Section: Assumptions & Hero Recommendation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Farm Assumptions Inputs (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-4">
            <AssumptionsPanel
              assumptions={assumptions}
              setAssumptions={setAssumptions}
              crops={pricesData.crops}
              origins={distancesData.farmerOrigins}
              lang={lang}
              onReset={() => setAssumptions(defaultAssumptions)}
            />
          </div>

          {/* Right Column: Hero Recommendation (7 cols on large screens) */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            <TopRecommendationBanner
              topMandi={topMandi}
              runnerUp={runnerUp}
              lang={lang}
              cropName={cropDisplayName}
            />

            {/* Quick Insights Strip below Hero */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {t.statHighestModal}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    ₹{Math.max(...rankedMarkets.map(m => m.price))}/q
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {t.statNearest}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {Math.min(...rankedMarkets.map(m => m.distanceKm))} km
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {t.statMaxSpread}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    +₹{Math.round(rankedMarkets[0]?.netReturn - rankedMarkets[rankedMarkets.length - 1]?.netReturn).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for In-Depth Views */}
        <div className="border-b border-slate-200 pt-2">
          <div className="flex space-x-1 sm:space-x-3 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => setActiveTab('rankings')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${
                activeTab === 'rankings'
                  ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>{t.tabRankings}</span>
            </button>

            <button
              onClick={() => setActiveTab('tradeoff')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${
                activeTab === 'tradeoff'
                  ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t.tabTradeoff}</span>
            </button>

            <button
              onClick={() => setActiveTab('waterfall')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${
                activeTab === 'waterfall'
                  ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.tabWaterfall}</span>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${
                activeTab === 'trends'
                  ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t.tabTrends}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-b-2 transition whitespace-nowrap ${
                activeTab === 'map'
                  ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>{t.tabMap}</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === 'rankings' && (
            <RankedMandiList
              rankedMarkets={rankedMarkets}
              lang={lang}
            />
          )}

          {activeTab === 'tradeoff' && (
            <ProfitDistanceChart
              rankedMarkets={rankedMarkets}
              lang={lang}
            />
          )}

          {activeTab === 'waterfall' && (
            <RevenueCostWaterfallChart
              rankedMarkets={rankedMarkets}
              lang={lang}
            />
          )}

          {activeTab === 'trends' && (
            <PriceTrendHistoryChart
              rankedMarkets={rankedMarkets}
              lang={lang}
            />
          )}

          {activeTab === 'map' && (
            <MandiMap
              rankedMarkets={rankedMarkets}
              origins={distancesData.farmerOrigins}
              selectedOriginId={assumptions.location}
              lang={lang}
            />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">{t.appTitle} AI</span> • {t.appSubtitle}
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t.footerDisclaimer}
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsDisclaimerOpen(true)}
              className="hover:text-emerald-400 transition"
            >
              {t.methodologyBtn}
            </button>
            <span>•</span>
            <span>Agmarknet & APMC Data</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Daily Sync: {lastUpdatedData.formattedDate}</span>
          </div>
        </div>
      </footer>

      {/* Disclaimer Modal */}
      <DataDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        lang={lang}
        lastUpdated={lastUpdatedData}
      />
    </div>
  );
}
