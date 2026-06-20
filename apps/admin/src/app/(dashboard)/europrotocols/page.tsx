'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { useEuroProtocols, useEuroStats } from '@/lib/admin-hooks';
import { ALL_STATUSES, euroFullName, STATUS_LABEL, STATUS_STYLE, type EuroStatus } from '@/lib/euro';

interface EuroRow {
  id: string;
  number: string;
  status: EuroStatus;
  incidentDate: string;
  incidentTime: string;
  place: string;
  createdAt: string;
  vehicle?: { plate: string; brand: string; model: string } | null;
  user?: { name?: string; surname?: string; phone?: string } | null;
}

export default function EuroprotocolsPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const { data: stats } = useEuroStats();
  const { data, isLoading } = useEuroProtocols(status, 1, 50);
  const items: EuroRow[] = data?.items ?? [];

  return (
    <>
      <Header title="Европротоколы" subtitle="Оформленные извещения о ДТП" />

      <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-16 space-y-5">
        {/* KPI */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <Kpi label="Подано" value={stats?.submitted} active={status === 'SUBMITTED'} onClick={() => setStatus('SUBMITTED')} />
          <Kpi label="На рассм." value={stats?.review} active={status === 'REVIEW'} onClick={() => setStatus('REVIEW')} />
          <Kpi label="Треб. инфо" value={stats?.needInfo} active={status === 'NEED_INFO'} onClick={() => setStatus('NEED_INFO')} />
          <Kpi label="Одобрено" value={stats?.approved} active={status === 'APPROVED'} onClick={() => setStatus('APPROVED')} />
          <Kpi label="Выплачено" value={stats?.paid} active={status === 'PAID'} onClick={() => setStatus('PAID')} />
          <Kpi label="Отклонено" value={stats?.rejected} active={status === 'REJECTED'} onClick={() => setStatus('REJECTED')} />
        </div>

        {/* Фильтр */}
        <div className="flex gap-2 flex-wrap">
          <FilterBtn active={status === ''} onClick={() => setStatus('')}>Все</FilterBtn>
          {ALL_STATUSES.map((s) => (
            <FilterBtn key={s} active={status === s} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </FilterBtn>
          ))}
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-2xl border border-[#ececec] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#9a9a9a] text-xs border-b border-[#ececec]">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Заявитель</th>
                <th className="px-4 py-3 font-medium">Авто</th>
                <th className="px-4 py-3 font-medium">ДТП</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Подано</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#9a9a9a]">Загрузка…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#9a9a9a]">Нет европротоколов</td></tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/europrotocols/${p.id}`)}
                    className="border-b border-[#f4f4f4] hover:bg-[#fafafa] cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-[#151515]">{p.number}</td>
                    <td className="px-4 py-3 text-[#555]">
                      {euroFullName(p.user)}
                      <br />
                      <span className="text-xs text-[#9a9a9a]">{p.user?.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-[#555]">
                      {p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model}` : '—'}
                      <br />
                      <span className="text-xs text-[#9a9a9a]">{p.vehicle?.plate}</span>
                    </td>
                    <td className="px-4 py-3 text-[#555]">{formatDate(p.incidentDate)} · {p.incidentTime}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9a9a9a] text-xs">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-[#c4c4c4] text-right">→</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, active, onClick }: { label: string; value?: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border px-4 py-3 transition hover:border-[#d4d4d4] ${
        active ? 'border-[#151515]' : 'border-[#ececec]'
      }`}
    >
      <div className="text-2xl font-semibold text-[#151515]">{value ?? '—'}</div>
      <div className="text-xs text-[#9a9a9a] mt-0.5">{label}</div>
    </button>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
        active ? 'bg-[#151515] text-white' : 'bg-white border border-[#ececec] text-[#555] hover:bg-[#fafafa]'
      }`}
    >
      {children}
    </button>
  );
}
