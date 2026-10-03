import React from 'react';
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
import { TrendingUp } from 'lucide-react';
import { translations } from '../i18n/translations';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function PriceTrendHistoryChart({ rankedMarkets, lang }) {
  const t = translations[lang] || translations.en;

  // Take top 4 mandis
  const top4 = rankedMarkets.slice(0, 4);
  const daysEn = ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'];
  const daysHi = ['6 दिन पूर्व', '5 दिन पूर्व', '4 दिन पूर्व', '3 दिन पूर्व', '2 दिन पूर्व', 'कल', 'आज'];
  const daysMr = ['६ दिवस आधी', '५ दिवस आधी', '४ दिवस आधी', '३ दिवस आधी', '२ दिवस आधी', 'काल', 'आज'];

  const days = lang === 'mr' ? daysMr : lang === 'hi' ? daysHi : daysEn;

  const chartData = days.map((dayLabel, dIdx) => {
    const point = { day: dayLabel };
    top4.forEach((m) => {
      const hist = m.history && m.history.length === 7 ? m.history : [m.price, m.price, m.price, m.price, m.price, m.price, m.price];
      const shortName = m.market.name.replace(' APMC', '').replace(' Mandi', '');
      point[shortName] = hist[dIdx];
    });
    return point;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800 m-0">
              {t.chartTrendsTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 m-0">
            {t.chartTrendsSubtitle}
          </p>
        </div>

        <div className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
          {t.dailyDataBadge}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `₹${v}`}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              formatter={(value, name) => [`₹${value}/q (Modal)`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            {top4.map((m, idx) => {
              const shortName = m.market.name.replace(' APMC', '').replace(' Mandi', '');
              return (
                <Line
                  key={m.market.id}
                  type="monotone"
                  dataKey={shortName}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={idx === 0 ? 3 : 2}
                  strokeDasharray={idx === 0 ? undefined : '4 4'}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-400">
        * {t.officialNotice}
      </div>
    </div>
  );
}
