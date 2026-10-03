import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Calendar, Activity } from 'lucide-react';
import { translations } from '../i18n/translations';
import { analyzePriceTrend } from '../engine/trend';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function PriceTrendHistoryChart({ rankedMarkets = [], lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d'

  const top3 = rankedMarkets.slice(0, 3);
  if (top3.length === 0) return null;

  // Compute trend metrics for top 3 markets
  const marketMetrics = top3.map((m) => {
    const hist = m.history30Days && m.history30Days.length > 0 
      ? m.history30Days 
      : m.history || [m.price];
    const trendAnalysis = analyzePriceTrend(hist, {
      daysSinceLastUpdate: m.dataAgeDays || 0,
      customCurrentPrice: m.price
    });
    return {
      mandi: m,
      trend: trendAnalysis
    };
  });

  // Construct chart series
  const dataPointsCount = timeframe === '30d' ? 30 : 7;
  const chartData = [];

  for (let i = 0; i < dataPointsCount; i++) {
    const dayLabel = timeframe === '30d'
      ? (i === dataPointsCount - 1 ? 'Today' : `D-${dataPointsCount - 1 - i}`)
      : (i === dataPointsCount - 1 ? 'Today' : i === dataPointsCount - 2 ? 'Yest' : `D-${dataPointsCount - 1 - i}`);

    const point = { day: dayLabel };

    top3.forEach((m) => {
      const shortName = m.market.name.replace(' APMC', '').replace(' Mandi', '');
      const series = timeframe === '30d' 
        ? (m.history30Days && m.history30Days.length >= 30 ? m.history30Days : m.history || [])
        : (m.history && m.history.length >= 7 ? m.history : [m.price]);
      
      const val = series[series.length - dataPointsCount + i] ?? series[series.length - 1] ?? m.price;
      point[shortName] = Math.round(Number(val));
    });

    chartData.push(point);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4">
      {/* Header with Timeframe Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800 m-0">
              {t.chartTrendsTitle} (Top 3 Mandis)
            </h2>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Historical official modal prices, linear regression trajectory & confidence factors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold text-slate-600">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1 rounded-md transition ${
                timeframe === '7d' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1 rounded-md transition ${
                timeframe === '30d' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>

          <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium whitespace-nowrap">
            {t.dailyDataBadge}
          </div>
        </div>
      </div>

      {/* Top 3 Mandis Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {marketMetrics.map(({ mandi, trend }, idx) => {
          const shortName = mandi.market.name.replace(' APMC', '').replace(' Mandi', '');
          const isRank1 = mandi.rank === 1;

          return (
            <div 
              key={mandi.market.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isRank1 ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs truncate">
                  #{mandi.rank} {shortName}
                </span>
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-lg font-black text-slate-900">
                  ₹{mandi.price.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/q</span>
                </span>
                
                {/* 7d & 30d Pills */}
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    trend.change7dPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`} title="7-Day Modal Price Change">
                    7d: {trend.change7dPct >= 0 ? `+${trend.change7dPct}%` : `${trend.change7dPct}%`}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    trend.change30dPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`} title="30-Day Modal Price Change">
                    30d: {trend.change30dPct >= 0 ? `+${trend.change30dPct}%` : `${trend.change30dPct}%`}
                  </span>
                </div>
              </div>

              {/* Confidence Factors Indicator */}
              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Confidence
                  </span>
                  <span className="font-bold text-emerald-700">{trend.confidence}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-emerald-600 h-full rounded-full" 
                    style={{ width: `${trend.confidence}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>{trend.confidenceFactors?.observations || 30} days data</span>
                  <span>volatility: {trend.volatilityPct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Line Chart */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis 
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => `₹${v}`}
              domain={['dataMin - 150', 'dataMax + 150']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              formatter={(value, name) => [`₹${value}/q (Modal)`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            {top3.map((m, idx) => {
              const shortName = m.market.name.replace(' APMC', '').replace(' Mandi', '');
              return (
                <Line
                  key={m.market.id}
                  type="monotone"
                  dataKey={shortName}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={idx === 0 ? 3 : 2}
                  strokeDasharray={idx === 0 ? undefined : '3 3'}
                  dot={timeframe === '7d' ? { r: 3 } : false}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Official modal disclaimer */}
      <div className="text-center text-[11px] text-slate-400 pt-1">
        * Sourced from daily-updated official mandi records. Forecasts are conservative estimates, not guaranteed.
      </div>
    </div>
  );
}
