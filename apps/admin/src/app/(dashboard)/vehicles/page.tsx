'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Car, ChevronDown, ChevronRight, Building2, Eye } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VehicleListItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  ownerName: string | null;
  ownerInn: string | null;
  vehicleTypeId: number | null;
  nappSyncedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; surname: string | null; phone: string };
}
interface VehicleListResp {
  items: VehicleListItem[];
  total: number;
  page: number;
  pages: number;
}

interface OrgRaw {
  name?: string;
  gdFullName?: string;
  oked?: string;
  okedTitle?: string;
  bankName?: string;
  bankMfo?: string;
  account?: string;
  address?: string;
  regCertificate?: string;
  regCertificateIssueDate?: string;
  phone?: string;
  fund?: number;
  [k: string]: unknown;
}
interface VehicleDetail extends VehicleListItem {
  engine: string | null;
  power: string | null;
  vin: string | null;
  techPassportSeria: string | null;
  techPassportNumber: string | null;
  techPassportDate: string | null;
  bodyNumber: string | null;
  engineNumber: string | null;
  fuelType: string | null;
  seats: number | null;
  stands: number | null;
  fullWeight: string | null;
  emptyWeight: string | null;
  division: string | null;
  pVehicleId: string | null;
  ownerPinfl: string | null;
  nappRaw: Record<string, unknown> | null;
  nappOrgRaw: OrgRaw | null;
  decoded: { vehicleType: string | null };
  user: { id: string; name: string | null; surname: string | null; phone: string; pinfl?: string | null };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useVehicles(search: string) {
  return useQuery<VehicleListResp>({
    queryKey: ['admin', 'vehicles', search],
    queryFn: () => api.get('/admin/vehicles', { params: { limit: 50, search: search || undefined } }).then((r) => r.data),
  });
}
function useVehicle(id: string | null) {
  return useQuery<VehicleDetail>({
    queryKey: ['admin', 'vehicle', id],
    queryFn: () => api.get(`/admin/vehicles/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div className="grid grid-cols-[190px_1fr] gap-x-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-5">{label}</span>
      <span className="text-sm text-gray-900 font-mono break-all leading-5">
        {isEmpty ? <span className="text-gray-300 italic">—</span> : value}
      </span>
    </div>
  );
}

function RawJsonBlock({ data, label }: { data: Record<string, unknown> | null; label: string }) {
  const [open, setOpen] = useState(false);
  if (!data) return <span className="text-gray-300 italic text-sm">—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {open ? 'Скрыть' : `Показать ${label}`}
      </button>
      {open && (
        <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-96 text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function VehicleDetailPanel({ id }: { id: string }) {
  const { data: v, isLoading } = useVehicle(id);
  if (isLoading) return <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Загрузка...</div>;
  if (!v) return null;

  const owner = v.user;
  const ownerName = [owner.surname, owner.name].filter(Boolean).join(' ') || owner.phone;
  const synced = v.nappSyncedAt ? 'из НАПП' : 'вручную';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <Car size={18} className="text-red-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">
            {v.brand} {v.model} · {v.plate}
          </div>
          <div className="text-sm text-gray-400">
            владелец аккаунта: {ownerName} · данные {synced}
          </div>
        </div>
      </div>

      {/* В приложении */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Данные для приложения</h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          <Field label="Гос. номер" value={v.plate} />
          <Field label="Марка / модель" value={`${v.brand} ${v.model}`} />
          <Field label="Год выпуска" value={v.year} />
          <Field label="Цвет" value={v.color} />
          <Field label="Двигатель (объём)" value={v.engine} />
          <Field label="Мощность" value={v.power} />
          <Field label="VIN" value={v.vin} />
        </div>
      </section>

      {/* НАПП — тех.данные */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Данные НАПП — техпаспорт
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          <Field label="Серия / номер ТП" value={[v.techPassportSeria, v.techPassportNumber].filter(Boolean).join(' ')} />
          <Field label="Дата выдачи ТП" value={v.techPassportDate?.slice(0, 10)} />
          <Field label="Тип ТС" value={v.decoded?.vehicleType ?? (v.vehicleTypeId != null ? `код ${v.vehicleTypeId}` : null)} />
          <Field label="Номер кузова" value={v.bodyNumber} />
          <Field label="Номер двигателя" value={v.engineNumber} />
          <Field label="Тип топлива" value={v.fuelType ? `код ${v.fuelType}` : null} />
          <Field label="Мест (сид. / стоя)" value={v.seats != null ? `${v.seats} / ${v.stands ?? 0}` : null} />
          <Field label="Масса полная / снаряж." value={v.fullWeight ? `${v.fullWeight} / ${v.emptyWeight ?? '—'} кг` : null} />
          <Field label="Отдел регистрации" value={v.division} />
          <Field label="ID в гос. реестре" value={v.pVehicleId} />
        </div>
      </section>

      {/* НАПП — владелец */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Данные НАПП — владелец ТС</h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          <Field label="Владелец (НАПП)" value={v.ownerName} />
          <Field label="ИНН" value={v.ownerInn} />
          <Field label="ПИНФЛ" value={v.ownerPinfl} />
        </div>
      </section>

      {/* Организация (если юрлицо) */}
      {v.nappOrgRaw && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Building2 size={14} /> Организация-владелец (по ИНН)
          </h3>
          <div className="bg-white border border-gray-100 rounded-2xl px-4">
            <Field label="Название" value={v.nappOrgRaw.name} />
            <Field label="Директор" value={v.nappOrgRaw.gdFullName} />
            <Field label="ОКЭД" value={v.nappOrgRaw.oked ? `${v.nappOrgRaw.oked} — ${v.nappOrgRaw.okedTitle ?? ''}` : null} />
            <Field label="Уставный фонд" value={v.nappOrgRaw.fund != null ? `${v.nappOrgRaw.fund.toLocaleString('ru')} сум` : null} />
            <Field label="Банк / МФО" value={v.nappOrgRaw.bankName ? `${v.nappOrgRaw.bankName} · ${v.nappOrgRaw.bankMfo ?? ''}` : null} />
            <Field label="Расчётный счёт" value={v.nappOrgRaw.account} />
            <Field label="Рег. №/дата" value={v.nappOrgRaw.regCertificate ? `${v.nappOrgRaw.regCertificate} · ${v.nappOrgRaw.regCertificateIssueDate ?? ''}` : null} />
            <Field label="Телефон" value={v.nappOrgRaw.phone} />
            <Field label="Адрес" value={v.nappOrgRaw.address} />
          </div>
        </section>
      )}

      {/* Raw */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Сырые ответы НАПП</h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 space-y-3">
          <RawJsonBlock data={v.nappRaw} label="nappRaw (ТС)" />
          <RawJsonBlock data={v.nappOrgRaw as Record<string, unknown> | null} label="nappOrgRaw (организация)" />
        </div>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useVehicles(search);

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
          <div className="flex items-center gap-2">
            <Car size={16} className="text-red-600" />
            <h1 className="font-semibold text-gray-900 text-sm">Автомобили</h1>
            {data && <span className="text-xs text-gray-400">({data.total})</span>}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск: номер, марка, владелец, ИНН"
            className="mt-3 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
          />
        </div>

        {isLoading && <div className="px-5 py-8 text-sm text-gray-400 text-center">Загрузка...</div>}
        {!isLoading && data?.items.length === 0 && (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">Ничего не найдено</div>
        )}

        <div className="py-2">
          {data?.items.map((v) => {
            const active = selectedId === v.id;
            const acc = [v.user.surname, v.user.name].filter(Boolean).join(' ') || v.user.phone;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${
                  active ? 'bg-red-50' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Car size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {v.plate} · {v.brand} {v.model}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {v.ownerName ? `влад: ${v.ownerName}` : `аккаунт: ${acc}`}
                  </div>
                </div>
                {v.nappSyncedAt && (
                  <span className="text-[10px] text-green-600 bg-green-50 rounded px-1.5 py-0.5 shrink-0">НАПП</span>
                )}
                {active && <Eye size={14} className="text-red-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
            <Car size={40} strokeWidth={1.2} />
            <span className="text-sm">Выберите автомобиль слева</span>
          </div>
        ) : (
          <VehicleDetailPanel id={selectedId} />
        )}
      </div>
    </div>
  );
}
