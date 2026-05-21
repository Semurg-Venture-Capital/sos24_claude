'use client';

import { useStats } from '@/lib/admin-hooks';
import { Header } from '@/components/layout/Header';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { TypeDonut } from '@/components/dashboard/TypeDonut';
import { ShieldCheck, Users, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatPhone } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ACTIVE:          { label: 'Активен',        cls: 'bg-[rgba(52,211,153,0.1)] text-[#0a9466]' },
  PENDING_PAYMENT: { label: 'Ожидает оплаты', cls: 'bg-[rgba(245,200,80,0.15)] text-[#a07800]' },
  EXPIRED:         { label: 'Истёк',           cls: 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]' },
  CANCELLED:       { label: 'Отменён',         cls: 'bg-[rgba(230,20,40,0.08)] text-[#e61428]' },
};

const TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО', KASKO: 'КАСКО', HEALTH: 'Здоровье', HOME: 'Дом', FINANCE: 'Финансы',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0f0f2] rounded-xl ${className}`} />;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats();

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Дашборд" subtitle={new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />

      <main className="flex-1 p-6 flex flex-col gap-6">
        {/* KPI grid */}
        <div className="grid grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <KpiCard label="Всего полисов" value={stats?.totalPolicies?.toLocaleString('ru-RU') ?? '0'} icon={ShieldCheck} accent="red" />
              <KpiCard label="Активных" value={stats?.activePolicies?.toLocaleString('ru-RU') ?? '0'} icon={TrendingUp} accent="green" />
              <KpiCard label="Пользователей" value={stats?.totalUsers?.toLocaleString('ru-RU') ?? '0'} icon={Users} accent="blue" />
              <KpiCard label="Ожидают оплаты" value={stats?.pendingPolicies?.toLocaleString('ru-RU') ?? '0'} icon={AlertCircle} accent="yellow" />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-[1fr_280px] gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </>
          ) : (
            <>
              <TrendChart data={stats?.trend} />
              <TypeDonut data={stats?.typeDistribution} />
            </>
          )}
        </div>

        {/* Recent tables */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent policies */}
          <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(20,20,40,0.06)]">
              <p className="text-sm font-semibold text-[#151515]">Последние полисы</p>
              <Link href="/policies" className="text-xs text-[#e61428] hover:underline">Все →</Link>
            </div>
            {isLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (stats?.recentPolicies ?? []).map((p: any) => {
              const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.EXPIRED;
              const holder = [p.user?.surname, p.user?.name].filter(Boolean).join(' ') || p.user?.phone || '—';
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(20,20,40,0.04)] last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(230,20,40,0.07)] flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-[#e61428]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#151515] truncate">
                      {TYPE_LABEL[p.type] ?? p.type} · {p.policyNumber ?? 'Черновик'}
                    </p>
                    <p className="text-xs text-[#9a9a9a] truncate">{holder} · {p.vehicle?.plate ?? '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-[#151515]">{p.totalPrice?.toLocaleString('ru-RU')}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(20,20,40,0.06)]">
              <p className="text-sm font-semibold text-[#151515]">Новые пользователи</p>
              <Link href="/users" className="text-xs text-[#e61428] hover:underline">Все →</Link>
            </div>
            {isLoading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (stats?.recentUsers ?? []).map((u: any) => {
              const name = [u.surname, u.name].filter(Boolean).join(' ');
              const verified = u.verificationStatus === 'MYID_VERIFIED';
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(20,20,40,0.04)] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#f0f0f2] flex items-center justify-center text-xs font-semibold text-[#5f5e5e] shrink-0">
                    {name ? name[0] : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#151515] truncate">{name || 'Не заполнено'}</p>
                    <p className="text-xs text-[#9a9a9a]">{formatPhone(u.phone)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${verified ? 'bg-[rgba(52,211,153,0.1)] text-[#0a9466]' : 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]'}`}>
                      {verified ? 'MyID ✓' : 'Не верифицирован'}
                    </span>
                    <p className="text-[10px] text-[#c0c0c0] mt-0.5">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
