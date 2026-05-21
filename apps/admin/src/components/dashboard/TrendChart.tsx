'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendPoint { date: string; osago: number; kasko: number }
interface Props { data?: TrendPoint[] }

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[rgba(20,20,40,0.08)] rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="text-[#9a9a9a] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#5f5e5e] capitalize">{p.name === 'osago' ? 'ОСАГО' : 'КАСКО'}</span>
          <span className="font-semibold text-[#151515] ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data = [] }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(20,20,40,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#151515]">Динамика полисов</p>
          <p className="text-xs text-[#9a9a9a] mt-0.5">За последние 30 дней</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e61428]" />
            <span className="text-xs text-[#9a9a9a]">ОСАГО</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#568cff]" />
            <span className="text-xs text-[#9a9a9a]">КАСКО</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e61428" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#e61428" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#568cff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#568cff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,20,40,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9a9a9a' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="osago" stroke="#e61428" strokeWidth={2} fill="url(#gradRed)" dot={false} />
          <Area type="monotone" dataKey="kasko" stroke="#568cff" strokeWidth={2} fill="url(#gradBlue)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
