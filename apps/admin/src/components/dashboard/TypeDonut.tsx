'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const TYPE_COLOR: Record<string, string> = {
  OSAGO: '#e61428', KASKO: '#568cff', HEALTH: '#34d399', HOME: '#f5c850', FINANCE: '#9a9a9a',
};
const TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО', KASKO: 'КАСКО', HEALTH: 'Здоровье', HOME: 'Дом', FINANCE: 'Финансы',
};

interface TypeDist { type: string; count: number }
interface Props { data?: TypeDist[] }

export function TypeDonut({ data = [] }: Props) {
  const DATA = data.map((d) => ({
    name: TYPE_LABEL[d.type] ?? d.type,
    value: d.count,
    color: TYPE_COLOR[d.type] ?? '#9a9a9a',
  }));
  const total = DATA.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(20,20,40,0.06)] flex flex-col">
      <p className="text-sm font-semibold text-[#151515] mb-0.5">По типам</p>
      <p className="text-xs text-[#9a9a9a] mb-4">Всего активных полисов</p>

      <div className="flex items-center gap-4 flex-1">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={54}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {DATA.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v} (${Math.round(Number(v) / total * 100)}%)`, '']}
              contentStyle={{
                background: '#fff',
                border: '1px solid rgba(20,20,40,0.08)',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col gap-2 flex-1">
          {DATA.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-[#5f5e5e] flex-1">{d.name}</span>
              <span className="text-xs font-semibold text-[#151515]">{d.value}</span>
              <span className="text-xs text-[#9a9a9a] w-8 text-right">{Math.round(d.value / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
