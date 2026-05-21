'use client';

import { useState } from 'react';
import { usePolicies } from '@/lib/admin-hooks';
import { Header } from '@/components/layout/Header';
import { Search, Download, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:          { label: 'Активен',        cls: 'bg-[rgba(52,211,153,0.1)] text-[#0a9466]' },
  PENDING_PAYMENT: { label: 'Ожидает оплаты', cls: 'bg-[rgba(245,200,80,0.15)] text-[#a07800]' },
  EXPIRED:         { label: 'Истёк',           cls: 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]' },
  CANCELLED:       { label: 'Отменён',         cls: 'bg-[rgba(230,20,40,0.08)] text-[#e61428]' },
  DRAFT:           { label: 'Черновик',        cls: 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]' },
};

const TYPE_COLOR: Record<string, string> = {
  OSAGO: '#e61428', KASKO: '#568cff', HEALTH: '#34d399', HOME: '#f5c850', FINANCE: '#9a9a9a',
};

const TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО', KASKO: 'КАСКО', HEALTH: 'Здоровье', HOME: 'Дом', FINANCE: 'Финансы',
};

export default function PoliciesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = usePolicies(page, 20, search, type, status);
  const total: number = data?.total ?? 0;
  const policies: any[] = data?.policies ?? [];
  const totalPages = Math.ceil(total / 20);

  const applySearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Полисы" subtitle={isLoading ? 'Загрузка...' : `${total} записей`} />

      <main className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl px-3 h-9 flex-1 min-w-48 max-w-xs">
            <Search size={14} className="text-[#9a9a9a] shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Номер, страхователь, номер авто..."
              className="flex-1 text-sm outline-none bg-transparent text-[#151515] placeholder:text-[#c0c0c0]"
            />
          </div>

          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] outline-none">
            <option value="">Все типы</option>
            <option value="OSAGO">ОСАГО</option>
            <option value="KASKO">КАСКО</option>
            <option value="HEALTH">Здоровье</option>
            <option value="HOME">Дом</option>
            <option value="FINANCE">Финансы</option>
          </select>

          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] outline-none">
            <option value="">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="PENDING_PAYMENT">Ожидают оплаты</option>
            <option value="EXPIRED">Истёкшие</option>
            <option value="CANCELLED">Отменённые</option>
          </select>

          <button className="ml-auto h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] flex items-center gap-2 hover:bg-[#f8f8f8] transition-colors">
            <Download size={14} /> Экспорт
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(20,20,40,0.06)]">
                {['Полис', 'Страхователь', 'Авто / Номер', 'Период', 'Премия', 'Статус'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-[#f0f0f2] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : policies.map((p) => {
                const st = STATUS_CFG[p.status] ?? STATUS_CFG.EXPIRED;
                const typeColor = TYPE_COLOR[p.type] ?? '#9a9a9a';
                const typeLabel = TYPE_LABEL[p.type] ?? p.type;
                const holder = [p.user?.surname, p.user?.name].filter(Boolean).join(' ') || p.user?.phone || '—';
                return (
                  <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor}14` }}>
                          <ShieldCheck size={14} style={{ color: typeColor }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#151515]">
                            {p.policyNumber ? `№ ${p.policyNumber}` : 'Черновик'}
                          </p>
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold text-white mt-0.5" style={{ background: typeColor }}>
                            {typeLabel}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{holder}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-[#151515]">{p.vehicle?.plate ?? '—'}</p>
                      {p.vehicle && <p className="text-xs text-[#9a9a9a]">{p.vehicle.brand} {p.vehicle.model}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#9a9a9a] whitespace-nowrap">
                      {formatDate(p.startDate)} — {formatDate(p.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#151515] whitespace-nowrap">
                      {p.totalPrice?.toLocaleString('ru-RU')} сум
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(20,20,40,0.06)]">
              <p className="text-xs text-[#9a9a9a]">Страница {page} из {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg border border-[rgba(20,20,40,0.1)] flex items-center justify-center disabled:opacity-40 hover:bg-[#f8f8f8] transition-colors">
                  <ChevronLeft size={14} className="text-[#5f5e5e]" />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-lg border border-[rgba(20,20,40,0.1)] flex items-center justify-center disabled:opacity-40 hover:bg-[#f8f8f8] transition-colors">
                  <ChevronRight size={14} className="text-[#5f5e5e]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
