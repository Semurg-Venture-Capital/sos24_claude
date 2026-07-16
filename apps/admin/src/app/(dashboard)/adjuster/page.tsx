'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Map, Phone, TableIcon, MapPin } from 'lucide-react';
import { useAdjusterStats, useAdjusterRequests, useUpdateAdjusterStatus } from '@/lib/admin-hooks';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { AdjusterDetailDrawer } from './AdjusterDetailDrawer';
import { AcceptModal } from './AcceptModal';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

type AdjusterStatus = 'NEW' | 'ACCEPTED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';
type IncidentType = 'ACCIDENT' | 'DAMAGE' | 'THEFT';

const INCIDENT_LABELS: Record<IncidentType, string> = {
  ACCIDENT: 'ДТП', DAMAGE: 'Повреждение', THEFT: 'Угон',
};
const STATUS_LABELS: Record<AdjusterStatus, string> = {
  NEW: 'Новая', ACCEPTED: 'Принята', EN_ROUTE: 'В пути', COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};
const STATUS_STYLES: Record<AdjusterStatus, string> = {
  NEW: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  ACCEPTED: 'bg-[rgba(245,200,80,0.15)] text-[#b07d00]',
  EN_ROUTE: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  COMPLETED: 'bg-[rgba(52,211,153,0.1)] text-[#0a9466]',
  CANCELLED: 'bg-[rgba(230,20,40,0.08)] text-[#c01020]',
};
const NEXT_STATUSES: Record<AdjusterStatus, AdjusterStatus[]> = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], CANCELLED: [],
};
const INCIDENT_DOT: Record<IncidentType, string> = {
  ACCIDENT: 'bg-[#e61428]', DAMAGE: 'bg-[#f5c850]', THEFT: 'bg-[#564aff]',
};
const POLICY_TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО', KASKO: 'КАСКО', HEALTH: 'Здоровье', HOME: 'Дом', FINANCE: 'Финансы',
};

function formatTimeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}с`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}ч`;
  return `${Math.floor(h / 24)}д`;
}

type KpiCard = { label: string; value: number | undefined; color: string };

function KpiChip({ label, value, color }: KpiCard) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${color}`}>
      <span className="text-lg font-bold leading-none tabular-nums">
        {value ?? '—'}
      </span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

export default function AdjusterPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'table' | 'map'>('table');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [acceptItem, setAcceptItem] = useState<any | null>(null);

  const { data: stats } = useAdjusterStats();
  const { data, isLoading } = useAdjusterRequests(statusFilter, page);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAdjusterStatus();

  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleStatusChange = (id: string, status: AdjusterStatus, extra?: {
    adjusterNote?: string; assignedAdjusterId?: string; adjusterName?: string; adjusterPhone?: string;
  }) => {
    updateStatus({ id, status, ...extra }, {
      onSuccess: (updated) => {
        setSelectedItem(updated);
        setAcceptItem(null);
      },
    });
  };

  const handleRowStatusChange = (item: any, next: AdjusterStatus) => {
    if (next === 'ACCEPTED') {
      setAcceptItem(item);
    } else {
      handleStatusChange(item.id, next);
    }
  };

  // For map view — load all active without pagination
  const { data: allData } = useAdjusterRequests('', 1, 200);
  const allItems: any[] = allData?.items ?? [];
  const mapItems = allItems.filter((i: any) => i.status !== 'COMPLETED' && i.status !== 'CANCELLED');

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Аджастер"
        subtitle={isLoading ? 'Загрузка...' : `${total} заявок`}
      />

      <main className="flex-1 p-6 flex flex-col gap-5">
        {/* KPI row */}
        <div className="flex items-center gap-2 flex-wrap">
          <KpiChip
            label="ожидают"
            value={stats?.new}
            color="border-[rgba(86,140,255,0.25)] text-[#3670d4] bg-[rgba(86,140,255,0.06)]"
          />
          <KpiChip
            label="в работе"
            value={stats?.inProgress}
            color="border-[rgba(245,200,80,0.35)] text-[#b07d00] bg-[rgba(245,200,80,0.08)]"
          />
          <KpiChip
            label="завершено сегодня"
            value={stats?.completedToday}
            color="border-[rgba(52,211,153,0.3)] text-[#0a9466] bg-[rgba(52,211,153,0.06)]"
          />
          <KpiChip
            label="отменено сегодня"
            value={stats?.cancelledToday}
            color="border-[rgba(230,20,40,0.15)] text-[#c01020] bg-[rgba(230,20,40,0.04)]"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] outline-none"
          >
            <option value="">Все статусы</option>
            {(Object.keys(STATUS_LABELS) as AdjusterStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 ml-auto bg-[#f4f4f6] rounded-xl p-1">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                view === 'table' ? 'bg-white text-[#151515] shadow-sm' : 'text-[#9a9a9a] hover:text-[#5f5e5e]'
              }`}
            >
              <TableIcon size={12} />
              Таблица
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                view === 'map' ? 'bg-white text-[#151515] shadow-sm' : 'text-[#9a9a9a] hover:text-[#5f5e5e]'
              }`}
            >
              <Map size={12} />
              Карта
            </button>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-[#9a9a9a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
            Live
          </div>
        </div>

        {/* Map view */}
        {view === 'map' && (
          <div className="relative">
            <MapView
              items={mapItems}
              onSelect={(item: any) => { setSelectedItem(item); }}
            />
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
              {[
                { color: '#568cff', label: 'Новая' },
                { color: '#f5c850', label: 'Принята' },
                { color: '#e61428', label: 'В пути' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table view */}
        {view === 'table' && (
          <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(20,20,40,0.06)]">
                  {['Клиент', 'Инцидент', 'Адрес', 'Полис', 'Статус', 'Аджастер', 'Действие', 'Дата'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-4 bg-[#f0f0f2] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#9a9a9a]">
                      Заявок нет
                    </td>
                  </tr>
                ) : items.map((item) => {
                  const user = item.user;
                  const fullName = [user?.surname, user?.name].filter(Boolean).join(' ') || '—';
                  const incidentType = item.incidentType as IncidentType;
                  const status = item.status as AdjusterStatus;
                  const nextStatuses = NEXT_STATUSES[status];
                  const isNew = status === 'NEW';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`hover:bg-[#fafafa] transition-colors cursor-pointer ${
                        isNew ? 'border-l-2 border-l-[#568cff]' : ''
                      } ${selectedItem?.id === item.id ? 'bg-[#fafafa]' : ''}`}
                    >
                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#f0f0f2] flex items-center justify-center text-xs font-semibold text-[#5f5e5e] shrink-0">
                            {fullName[0] ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#151515]">{fullName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-[#9a9a9a]">{user?.phone ?? '—'}</p>
                              {user?.phone && (
                                <a
                                  href={`tel:${user.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#0a9466] hover:text-[#076b48]"
                                  title="Позвонить"
                                >
                                  <Phone size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Incident */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${INCIDENT_DOT[incidentType] ?? 'bg-gray-400'}`} />
                          <span className="text-sm font-medium text-[#151515]">
                            {INCIDENT_LABELS[incidentType] ?? incidentType}
                          </span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <div className="flex items-start gap-1.5">
                          <p className="text-sm text-[#5f5e5e] truncate flex-1">{item.address}</p>
                          {item.lat && item.lng && (
                            <a
                              href={`https://maps.google.com/?q=${item.lat},${item.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 mt-0.5 text-[#3670d4] hover:text-[#1a4fa0]"
                              title="Открыть на карте"
                            >
                              <MapPin size={12} />
                            </a>
                          )}
                        </div>
                        {item.comment && (
                          <p className="text-xs text-[#9a9a9a] truncate mt-0.5">{item.comment}</p>
                        )}
                      </td>

                      {/* Policy */}
                      <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">
                        {item.policy ? (
                          <span>
                            <span className="font-medium">{POLICY_TYPE_LABEL[item.policy.type] ?? item.policy.type}</span>
                            {item.policy.vehicle?.plate && (
                              <span className="text-[#9a9a9a] text-xs ml-1">· {item.policy.vehicle.plate}</span>
                            )}
                          </span>
                        ) : item.policyId ? (
                          <span className="font-mono text-xs">{item.policyId.slice(0, 8)}…</span>
                        ) : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </td>

                      {/* Assigned adjuster */}
                      <td className="px-5 py-3.5 max-w-[160px]">
                        {item.adjusterDisplayName ? (
                          <div>
                            <p className="text-sm font-medium text-[#151515] truncate">{item.adjusterDisplayName}</p>
                            {item.adjusterDisplayPhone && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-xs text-[#9a9a9a]">{item.adjusterDisplayPhone}</p>
                                <a
                                  href={`tel:${item.adjusterDisplayPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#0a9466] hover:text-[#076b48]"
                                  title="Позвонить аджастеру"
                                >
                                  <Phone size={11} />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#c0c0c0]">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {nextStatuses.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {nextStatuses.map((next) => (
                              <button
                                key={next}
                                disabled={isUpdating}
                                onClick={() => handleRowStatusChange(item, next)}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
                                  next === 'CANCELLED'
                                    ? 'border-[rgba(230,20,40,0.2)] text-[#e61428] hover:bg-[rgba(230,20,40,0.06)]'
                                    : 'border-[rgba(20,20,40,0.12)] text-[#151515] hover:bg-[#f4f4f6]'
                                }`}
                              >
                                {STATUS_LABELS[next]}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#c0c0c0]">—</span>
                        )}
                      </td>

                      {/* Date + elapsed */}
                      <td className="px-5 py-3.5 text-sm text-[#9a9a9a] whitespace-nowrap">
                        <p>{formatDate(item.createdAt)}</p>
                        <p className={`text-xs mt-0.5 ${
                          status === 'NEW' ? 'text-[#e61428] font-medium' : 'text-[#c0c0c0]'
                        }`}>
                          {formatTimeAgo(item.createdAt)} назад
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(20,20,40,0.06)]">
                <p className="text-xs text-[#9a9a9a]">Страница {page} из {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 rounded-lg border border-[rgba(20,20,40,0.1)] flex items-center justify-center disabled:opacity-40 hover:bg-[#f8f8f8] transition-colors text-sm"
                  >‹</button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="w-7 h-7 rounded-lg border border-[rgba(20,20,40,0.1)] flex items-center justify-center disabled:opacity-40 hover:bg-[#f8f8f8] transition-colors text-sm"
                  >›</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail drawer */}
      {selectedItem && (
        <AdjusterDetailDrawer
          item={selectedItem}
          isUpdating={isUpdating}
          onClose={() => setSelectedItem(null)}
          onStatusChange={(id, status) => handleRowStatusChange(selectedItem, status)}
        />
      )}

      {/* Assign modal (ACCEPTED) */}
      {acceptItem && (
        <AcceptModal
          isPending={isUpdating}
          onConfirm={(data) => handleStatusChange(acceptItem.id, 'ACCEPTED', data)}
          onCancel={() => setAcceptItem(null)}
        />
      )}
    </div>
  );
}
