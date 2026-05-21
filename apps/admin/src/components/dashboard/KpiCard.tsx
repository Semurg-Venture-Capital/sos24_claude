import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  icon: LucideIcon;
  accent?: 'red' | 'green' | 'blue' | 'yellow';
}

const ACCENT = {
  red:    { bg: 'bg-[rgba(230,20,40,0.08)]',    icon: 'text-[#e61428]' },
  green:  { bg: 'bg-[rgba(52,211,153,0.1)]',    icon: 'text-[#34d399]' },
  blue:   { bg: 'bg-[rgba(86,140,255,0.1)]',    icon: 'text-[#568cff]' },
  yellow: { bg: 'bg-[rgba(245,200,80,0.12)]',   icon: 'text-[#d4a800]' },
};

export function KpiCard({ label, value, delta, deltaUp, icon: Icon, accent = 'red' }: KpiCardProps) {
  const a = ACCENT[accent];
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(20,20,40,0.06)] flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#9a9a9a] leading-none">{label}</p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', a.bg)}>
          <Icon size={15} className={a.icon} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#151515] tracking-tight leading-none">{value}</p>
        {delta && (
          <p className={cn('text-xs mt-1.5', deltaUp ? 'text-[#34d399]' : 'text-[#e61428]')}>
            {deltaUp ? '↑' : '↓'} {delta} vs прошлый месяц
          </p>
        )}
      </div>
    </div>
  );
}
