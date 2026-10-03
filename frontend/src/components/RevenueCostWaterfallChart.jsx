import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { translations } from '../i18n/translations';

export default function RevenueCostWaterfallChart({ rankedMarkets, lang }) {
  const t = translations[lang] || translations.en;

  // Take top 5 mandis
  const topMarkets = rankedMarkets.slice(0, 5).map((m) => ({
    name: m.market.name.replace(' APMC', '').replace(' Mandi', ''),
    fullName: m.market.name,
    netReturn: Math.round(m.netReturn),
    transport: Math.round(m.transport),
    mandiCosts: Math.round(m.otherCosts),
    grossRevenue: Math.round(m.revenue),
    rank: m.rank
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px]">
          <div className="font-bold text-emerald-400 border-b border-slate-700 pb-1">
            Rank #{data.rank} • {data.fullName}
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">{t.grossRevenueLabel}:</span>
            <span className="font-bold text-white">₹{data.grossRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400 font-semibold">{t.netReturnShort}:</span>
            <span className="font-extrabold text-emerald-300">₹{data.netReturn.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-rose-400">{t.transportFreightLabel}:</span>
            <span className="font-medium text-rose-300">-₹{data.transport.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-400">{t.handlingLabel}:</span>
            <span className="font-medium text-amber-300">-₹{data.mandiCosts.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            {t.dailyDataBadge}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 m-0">
            {t.chartWaterfallTitle}
          </h2>
          <p className="text-xs text-slate-500 m-0">
            {t.chartWaterfallSubtitle}
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {t.consistentMathNote}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topMarkets} margin={{ top: 15, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#475569' }} 
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => {
                if (value === 'netReturn') return t.legendNetReturn;
                if (value === 'transport') return t.legendTransport;
                if (value === 'mandiCosts') return t.legendMandiCosts;
                return value;
              }}
            />
            <Bar dataKey="netReturn" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="transport" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="mandiCosts" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-400">
        * {t.officialNotice}
      </div>
    </div>
  );
}
