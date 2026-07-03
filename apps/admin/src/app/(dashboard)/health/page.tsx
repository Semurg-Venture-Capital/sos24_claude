'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Star, BadgeCheck, MapPin, Siren, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import {
  healthApi,
  useAppointments,
  useDoctors,
  useInvalidateHealth,
  useSosAlerts,
  type DoctorAdmin,
} from '@/lib/health';
import { DoctorEditor } from './DoctorEditor';

const TABS = [
  { key: 'doctors', label: 'Врачи' },
  { key: 'appointments', label: 'Записи' },
  { key: 'sos', label: 'SOS / ЧП' },
];

const STATUS = [
  { key: '', label: 'Все' },
  { key: 'PENDING', label: 'Ожидают' },
  { key: 'CONFIRMED', label: 'Подтверждены' },
  { key: 'COMPLETED', label: 'Выполнены' },
  { key: 'CANCELLED', label: 'Отменены' },
];
const STATUS_LABEL: Record<string, string> = { PENDING: 'Ожидает', CONFIRMED: 'Подтверждена', COMPLETED: 'Выполнена', CANCELLED: 'Отменена' };
const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-[rgba(245,200,80,0.18)] text-[#8a6300]',
  CONFIRMED: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  COMPLETED: 'bg-[rgba(52,211,153,0.14)] text-[#0a9466]',
  CANCELLED: 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]',
};

const money = (n: number | null) => (n != null ? `${n.toLocaleString('ru-RU')}` : '—');

export default function HealthPage() {
  const [tab, setTab] = useState('doctors');
  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Здоровье" subtitle="Врачи, клиники и записи на приём" />
      <div className="px-6 pt-4 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-sm rounded-lg transition-colors ${tab === t.key ? 'bg-[#151515] text-white' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <main className="flex-1 p-6">
        {tab === 'doctors' && <DoctorsTab />}
        {tab === 'appointments' && <AppointmentsTab />}
        {tab === 'sos' && <SosTab />}
      </main>
    </div>
  );
}

function DoctorsTab() {
  const { data: doctors = [], isLoading } = useDoctors();
  const invalidate = useInvalidateHealth();
  const [editor, setEditor] = useState<DoctorAdmin | null | 'new'>(null);

  const remove = async (d: DoctorAdmin) => {
    if (!confirm(`Удалить врача «${d.fullName}»?`)) return;
    await healthApi.deleteDoctor(d.id);
    invalidate();
  };

  return (
    <>
      <div className="flex items-center mb-5">
        <button onClick={() => setEditor('new')} className="ml-auto h-9 px-3.5 bg-[#e61428] text-white rounded-xl text-sm flex items-center gap-2 hover:bg-[#c01020]">
          <Plus size={15} /> Добавить врача
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(20,20,40,0.06)]">
              {['Врач', 'Специальность', 'Клиника', 'Рейтинг', 'Приём, сум', 'Записей', 'Статус', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
            {isLoading ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Загрузка…</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Врачей нет</td></tr>
            ) : doctors.map((d) => (
              <tr key={d.id} className="hover:bg-[#fafafa]">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-[#151515] flex items-center gap-1.5">
                    {d.fullName}
                    {d.verified && <BadgeCheck size={13} className="text-[#3670d4]" />}
                  </p>
                  {d.experienceY != null && <p className="text-xs text-[#9a9a9a]">стаж {d.experienceY} лет</p>}
                </td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{d.specialty}</td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{d.clinicName ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 text-sm text-[#151515]">
                    <Star size={12} className="text-[#f5c850] fill-[#f5c850]" /> {d.rating.toFixed(1)} <span className="text-xs text-[#9a9a9a]">({d.reviewCount})</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{money(d.pricePrimary)}</td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{d.bookingsCount}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${d.active ? 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]' : 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]'}`}>{d.active ? 'активен' : 'скрыт'}</span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <button onClick={() => setEditor(d)} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-[#5f5e5e] hover:bg-[#f0f0f2]"><Pencil size={13} /> Изменить</button>
                  <button onClick={() => remove(d)} className="inline-flex items-center h-8 px-2 rounded-lg text-xs text-[#e61428] hover:bg-[rgba(230,20,40,0.08)]"><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editor !== null && <DoctorEditor doctor={editor === 'new' ? null : editor} onClose={() => setEditor(null)} />}
    </>
  );
}

function AppointmentsTab() {
  const [status, setStatus] = useState('');
  const { data: appointments = [], isLoading } = useAppointments(status);
  const invalidate = useInvalidateHealth();

  const setStatusFor = async (id: string, s: string) => {
    await healthApi.setAppointmentStatus(id, s);
    invalidate();
  };

  return (
    <>
      <div className="flex gap-1 mb-5">
        {STATUS.map((s) => (
          <button key={s.key} onClick={() => setStatus(s.key)} className={`px-3 py-1.5 text-xs rounded-lg ${status === s.key ? 'bg-[#151515] text-white' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}>{s.label}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(20,20,40,0.06)]">
              {['Пациент', 'Врач', 'Клиника', 'Время', 'Статус', 'Действие'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Загрузка…</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Записей нет</td></tr>
            ) : appointments.map((a) => (
              <tr key={a.id} className="hover:bg-[#fafafa]">
                <td className="px-5 py-3.5"><p className="text-sm text-[#151515]">{a.patientName}</p><p className="text-xs text-[#9a9a9a]">{a.patientPhone}</p></td>
                <td className="px-5 py-3.5"><p className="text-sm text-[#151515]">{a.doctorName ?? '—'}</p><p className="text-xs text-[#9a9a9a]">{a.specialty}</p></td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{a.clinicName ?? '—'}</td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e] whitespace-nowrap">{formatDate(a.scheduledAt)}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[a.status] ?? ''}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  <select
                    value={a.status}
                    onChange={(e) => setStatusFor(a.id, e.target.value)}
                    className="h-8 px-2 bg-white border border-[rgba(20,20,40,0.1)] rounded-lg text-xs text-[#5f5e5e] outline-none"
                  >
                    {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const SOS_STATUS = [
  { key: 'ACTIVE', label: 'Активные' },
  { key: '', label: 'Все' },
  { key: 'RESOLVED', label: 'Закрытые' },
  { key: 'CANCELLED', label: 'Отменённые' },
];
const SOS_LABEL: Record<string, string> = { ACTIVE: 'Активна', RESOLVED: 'Закрыта', CANCELLED: 'Отменена' };
const SOS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-[rgba(230,20,40,0.12)] text-[#e61428]',
  RESOLVED: 'bg-[rgba(52,211,153,0.14)] text-[#0a9466]',
  CANCELLED: 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]',
};

function SosTab() {
  const [status, setStatus] = useState('ACTIVE');
  const { data: alerts = [], isLoading } = useSosAlerts(status);
  const invalidate = useInvalidateHealth();

  const act = async (id: string, action: 'acknowledge' | 'resolve') => {
    if (action === 'resolve' && !confirm('Закрыть тревогу?')) return;
    await healthApi.updateSos(id, action);
    invalidate();
  };

  return (
    <>
      <div className="flex items-center gap-1 mb-5">
        {SOS_STATUS.map((s) => (
          <button key={s.key} onClick={() => setStatus(s.key)} className={`px-3 py-1.5 text-xs rounded-lg ${status === s.key ? 'bg-[#151515] text-white' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}>{s.label}</button>
        ))}
        <span className="ml-auto text-xs text-[#9a9a9a] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#e61428] animate-pulse" /> обновляется автоматически</span>
      </div>
      <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(20,20,40,0.06)]">
              {['Пациент', 'Геолокация', 'Оповещено', 'Время', 'Статус', 'Действие'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Загрузка…</td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Тревог нет</td></tr>
            ) : alerts.map((a) => (
              <tr key={a.id} className={a.status === 'ACTIVE' ? 'bg-[rgba(230,20,40,0.03)]' : 'hover:bg-[#fafafa]'}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-[#151515] flex items-center gap-1.5"><Siren size={13} className="text-[#e61428]" /> {a.patientName}</p>
                  <p className="text-xs text-[#9a9a9a]">{a.patientPhone}</p>
                </td>
                <td className="px-5 py-3.5 text-sm">
                  {a.address && <p className="text-[#151515]">{a.address}</p>}
                  {a.lat != null && a.lng != null ? (
                    <a href={`https://maps.google.com/?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#3670d4] hover:underline">
                      <MapPin size={11} /> {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                    </a>
                  ) : (
                    <span className="text-xs text-[#9a9a9a]">гео нет</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm text-[#151515]">{a.notified} из {a.contacts.length}</p>
                  <p className="text-xs text-[#9a9a9a]">{a.contacts.map((c) => c.name).join(', ') || '—'}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e] whitespace-nowrap">{formatDate(a.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SOS_STYLE[a.status] ?? ''}`}>{SOS_LABEL[a.status] ?? a.status}</span>
                  {a.dispatcherName && <p className="text-[10px] text-[#9a9a9a] mt-1">принял: {a.dispatcherName}</p>}
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {a.status === 'ACTIVE' ? (
                    <>
                      {!a.acknowledgedAt && (
                        <button onClick={() => act(a.id, 'acknowledge')} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-[#3670d4] hover:bg-[rgba(86,140,255,0.1)]"><Check size={13} /> Принять</button>
                      )}
                      <button onClick={() => act(a.id, 'resolve')} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-[#0a9466] hover:bg-[rgba(52,211,153,0.12)]">Закрыть</button>
                    </>
                  ) : (
                    <span className="text-xs text-[#9a9a9a]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
