'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { useEuroProtocols, useEuroProtocol, useEuroStats, useUpdateEuroStatus } from '@/lib/admin-hooks';

type EuroStatus = 'SUBMITTED' | 'REVIEW' | 'NEED_INFO' | 'APPROVED' | 'REJECTED' | 'PAID';

const STATUS_LABEL: Record<EuroStatus, string> = {
  SUBMITTED: 'Подано',
  REVIEW: 'На рассмотрении',
  NEED_INFO: 'Требуется информация',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  PAID: 'Выплачено',
};
const STATUS_STYLE: Record<EuroStatus, string> = {
  SUBMITTED: 'bg-[rgba(20,20,20,0.06)] text-[#151515]',
  REVIEW: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  NEED_INFO: 'bg-[rgba(245,200,80,0.18)] text-[#b07d00]',
  APPROVED: 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]',
  REJECTED: 'bg-[rgba(230,20,40,0.08)] text-[#c01020]',
  PAID: 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]',
};
const SCHEME_LABEL: Record<string, string> = { rear: 'Наезд сзади', front: 'Лобовое', side: 'Боковое' };
const ALL_STATUSES: EuroStatus[] = ['SUBMITTED', 'REVIEW', 'NEED_INFO', 'APPROVED', 'REJECTED', 'PAID'];

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

function fullName(u?: { name?: string; surname?: string } | null) {
  if (!u) return '—';
  return [u.surname, u.name].filter(Boolean).join(' ') || '—';
}

export default function EuroprotocolsPage() {
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: stats } = useEuroStats();
  const { data, isLoading } = useEuroProtocols(status, 1, 50);
  const items: EuroRow[] = data?.items ?? [];

  return (
    <>
      <Header title="Европротоколы" subtitle="Оформленные извещения о ДТП" />

      <div className="p-6 space-y-5">
        {/* KPI */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <Kpi label="Подано" value={stats?.submitted} />
          <Kpi label="На рассм." value={stats?.review} />
          <Kpi label="Треб. инфо" value={stats?.needInfo} />
          <Kpi label="Одобрено" value={stats?.approved} />
          <Kpi label="Выплачено" value={stats?.paid} />
          <Kpi label="Отклонено" value={stats?.rejected} />
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#9a9a9a]">Загрузка…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#9a9a9a]">Нет европротоколов</td></tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="border-b border-[#f4f4f4] hover:bg-[#fafafa] cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#151515]">{p.number}</td>
                    <td className="px-4 py-3 text-[#555]">{fullName(p.user)}<br /><span className="text-xs text-[#9a9a9a]">{p.user?.phone}</span></td>
                    <td className="px-4 py-3 text-[#555]">{p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model}` : '—'}<br /><span className="text-xs text-[#9a9a9a]">{p.vehicle?.plate}</span></td>
                    <td className="px-4 py-3 text-[#555]">{formatDate(p.incidentDate)} · {p.incidentTime}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                    <td className="px-4 py-3 text-[#9a9a9a] text-xs">{formatDate(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && <EuroDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

function Kpi({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#ececec] px-4 py-3">
      <div className="text-2xl font-semibold text-[#151515]">{value ?? '—'}</div>
      <div className="text-xs text-[#9a9a9a] mt-0.5">{label}</div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${active ? 'bg-[#151515] text-white' : 'bg-white border border-[#ececec] text-[#555] hover:bg-[#fafafa]'}`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#f4f4f4] last:border-0">
      <span className="text-xs text-[#9a9a9a]">{label}</span>
      <span className="text-sm text-[#151515] text-right">{value || '—'}</span>
    </div>
  );
}

function EuroDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: p, isLoading } = useEuroProtocol(id);
  const update = useUpdateEuroStatus();
  const [status, setStatusVal] = useState<EuroStatus | ''>('');
  const [note, setNote] = useState('');

  const otherVehicle = (p?.otherVehicleRaw as { modelName?: string } | null) ?? null;
  const curStatus = (status || (p?.status as EuroStatus)) as EuroStatus;

  const save = () => {
    update.mutate(
      { id, status: curStatus, adminNote: note || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#f7f7f7] h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#ececec] px-5 py-4 flex items-center justify-between">
          <span className="font-semibold text-[#151515]">{p?.number ?? 'Европротокол'}</span>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#151515]">✕</button>
        </div>

        {isLoading || !p ? (
          <div className="p-10 text-center text-[#9a9a9a]">Загрузка…</div>
        ) : (
          <div className="p-5 space-y-4">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status as EuroStatus]}`}>
              {STATUS_LABEL[p.status as EuroStatus]}
            </span>

            <Section title="Обстоятельства">
              <Row label="Дата · время" value={`${formatDate(p.incidentDate)} · ${p.incidentTime}`} />
              <Row label="Место" value={p.place} />
              <Row label="Схема" value={p.schemeType ? SCHEME_LABEL[p.schemeType] ?? p.schemeType : '—'} />
              <Row label="Описание" value={p.description} />
            </Section>

            <Section title="Сторона A · Заявитель">
              <Row label="ФИО" value={fullName(p.user)} />
              <Row label="Телефон" value={p.user?.phone} />
              <Row label="Авто" value={p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model} · ${p.vehicle.plate}` : '—'} />
              <Row label="MyID" value={p.selfVerified ? 'Подтверждён' : '—'} />
            </Section>

            <Section title="Сторона B · Второй участник">
              <Row label="Участник" value={p.participant ? [p.participant.surname, p.participant.name, p.participant.patronymic].filter(Boolean).join(' ') : '—'} />
              <Row label="ПИНФЛ" value={p.participant?.pinfl} />
              <Row label="Госномер" value={p.otherGov} />
              <Row label="Авто (НАПП)" value={otherVehicle?.modelName} />
              <Row label="Телефон" value={p.otherPhone} />
              <Row label="Полис" value={p.otherPolicySeria && p.otherPolicyNumber ? `${p.otherPolicySeria} ${p.otherPolicyNumber}${p.otherPolicyValid ? ' ✓' : ''}` : '—'} />
            </Section>

            {/* Управление статусом */}
            <div className="bg-white rounded-2xl border border-[#ececec] p-4 space-y-3">
              <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">Управление</div>
              <select
                value={curStatus}
                onChange={(e) => setStatusVal(e.target.value as EuroStatus)}
                className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={p.adminNote || 'Примечание оператора (необязательно)'}
                rows={3}
                className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white resize-none"
              />
              <button
                onClick={save}
                disabled={update.isPending}
                className="w-full bg-[#e61428] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {update.isPending ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#ececec] p-4">
      <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}
