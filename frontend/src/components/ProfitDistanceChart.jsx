import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function ProfitDistanceChart({ rankedMarkets, lang }) {
  const t = translations[lang] || translations.en;

  const chartData = rankedMarkets.map((m) => ({
    name: m.market.name.replace(' APMC', '').replace(' Mandi', ''),
    fullName: m.market.name,
    netReturn: Math.round(m.netReturn),
    modalPrice: m.price,
    expectedPrice: Math.round(m.expectedPrice),
    distanceKm: m.distanceKm,
    transport: Math.round(m.transport),
    rank: m.rank
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-emerald-400">Rank #{data.rank} • {data.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.netReturnShort}:</span>
            <span className="font-extrabold text-emerald-300">₹{data.netReturn.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.modalPriceLabel}:</span>
            <span className="font-semibold text-white">₹{data.modalPrice}/q</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.roadDistanceLabel}:</span>
            <span className="font-semibold text-white">{data.distanceKm} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t.totalTransportLabel}:</span>
            <span className="font-semibold text-rose-300">-₹{data.transport.toLocaleString('en-IN')}</span>
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
            {t.chartTradeoffTitle}
          </h2>
          <p className="text-xs text-slate-500 m-0">
            {t.chartTradeoffSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-medium">
            {t.chartTradeoffAlert}
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#475569' }} 
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            {/* Left Axis: Net Return (₹) */}
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              tick={{ fontSize: 11, fill: '#059669' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            {/* Right Axis: Road Distance (km) */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}km`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => {
                if (value === 'netReturn') return t.legendNetReturn;
                if (value === 'distanceKm') return t.legendDistance;
                return value;
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="netReturn" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]} 
              barSize={32}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="distanceKm" 
              stroke="#f59e0b" 
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-400">
        * {t.officialNotice}
      </div>
    </div>
  );
}
