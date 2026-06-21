'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Star } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import {
  partnersApi,
  useCategories,
  usePartnerBookings,
  usePartners,
  useInvalidatePartners,
  type Category,
} from '@/lib/partners';
import { PartnerEditor } from './PartnerEditor';

const TABS = [
  { key: 'partners', label: 'Партнёры' },
  { key: 'categories', label: 'Категории' },
  { key: 'bookings', label: 'Записи' },
];

const BOOKING_STATUS = [
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

export default function PartnersPage() {
  const [tab, setTab] = useState('partners');
  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Партнёры" subtitle="СТО, клиники, услуги и записи" />
      <div className="px-6 pt-4 flex gap-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 py-2 text-sm rounded-lg transition-colors ${tab === t.key ? 'bg-[#151515] text-white' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <main className="flex-1 p-6">
        {tab === 'partners' && <PartnersTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'bookings' && <BookingsTab />}
      </main>
    </div>
  );
}

function PartnersTab() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [editor, setEditor] = useState<string | null | 'new'>(null);
  const { data: categories = [] } = useCategories();
  const { data: partners = [], isLoading } = usePartners(search, categoryId);
  const invalidate = useInvalidatePartners();

  const remove = async (id: string) => {
    if (!confirm('Удалить партнёра?')) return;
    await partnersApi.remove(id);
    invalidate();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl px-3 h-9 flex-1 max-w-xs">
          <Search size={14} className="text-[#9a9a9a]" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)} placeholder="Поиск..." className="flex-1 text-sm outline-none bg-transparent" />
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] outline-none">
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setEditor('new')} className="ml-auto h-9 px-3.5 bg-[#e61428] text-white rounded-xl text-sm flex items-center gap-2 hover:bg-[#c01020]">
          <Plus size={15} /> Добавить партнёра
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(20,20,40,0.06)]">
              {['Партнёр', 'Категория', 'Рейтинг', 'Услуг', 'Записей', 'Статус', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
            {isLoading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Загрузка…</td></tr>
            ) : partners.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Партнёров нет</td></tr>
            ) : partners.map((p) => (
              <tr key={p.id} className="hover:bg-[#fafafa]">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-[#151515]">{p.name}</p>
                  <p className="text-xs text-[#9a9a9a]">{p.address}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{p.category?.name ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 text-sm text-[#151515]"><Star size={12} className="text-[#f5c850] fill-[#f5c850]" /> {p.rating.toFixed(1)} <span className="text-xs text-[#9a9a9a]">({p.reviewCount})</span></span>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{p._count.services}</td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{p._count.bookings}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.active ? 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]' : 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]'}`}>{p.active ? 'активен' : 'скрыт'}</span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <button onClick={() => setEditor(p.id)} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-[#5f5e5e] hover:bg-[#f0f0f2]"><Pencil size={13} /> Изменить</button>
                  <button onClick={() => remove(p.id)} className="inline-flex items-center h-8 px-2 rounded-lg text-xs text-[#e61428] hover:bg-[rgba(230,20,40,0.08)]"><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editor !== null && <PartnerEditor partnerId={editor} onClose={() => setEditor(null)} />}
    </>
  );
}

function CategoriesTab() {
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidatePartners();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const add = async () => {
    if (!name.trim()) return;
    await partnersApi.createCategory({ name: name.trim(), icon: icon.trim() || undefined });
    setName(''); setIcon(''); invalidate();
  };
  const remove = async (id: string) => { if (confirm('Удалить категорию?')) { await partnersApi.deleteCategory(id); invalidate(); } };
  const toggle = async (c: Category) => { await partnersApi.updateCategory(c.id, { active: !c.active }); invalidate(); };

  return (
    <div className="max-w-lg flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🔧" className="w-16 h-10 px-3 text-center rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none" />
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Новая категория" className="flex-1 h-10 px-3 rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none" />
        <button onClick={add} className="h-10 px-4 rounded-xl bg-[#e61428] text-white text-sm flex items-center gap-1.5"><Plus size={15} /> Добавить</button>
      </div>
      <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] divide-y divide-[rgba(20,20,40,0.04)]">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-lg w-7 text-center">{c.icon}</span>
            <span className="flex-1 text-sm text-[#151515]">{c.name}</span>
            <button onClick={() => toggle(c)} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.active ? 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]' : 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]'}`}>{c.active ? 'активна' : 'скрыта'}</button>
            <button onClick={() => remove(c.id)} className="text-[#e61428] hover:bg-[rgba(230,20,40,0.08)] rounded p-1.5"><Trash2 size={14} /></button>
          </div>
        ))}
        {categories.length === 0 && <div className="px-4 py-6 text-center text-sm text-[#9a9a9a]">Категорий нет</div>}
      </div>
    </div>
  );
}

function BookingsTab() {
  const [status, setStatus] = useState('');
  const { data: bookings = [], isLoading } = usePartnerBookings(status);
  const invalidate = useInvalidatePartners();

  const setStatusFor = async (id: string, s: string) => { await partnersApi.setBookingStatus(id, s); invalidate(); };

  return (
    <>
      <div className="flex gap-1 mb-5">
        {BOOKING_STATUS.map((s) => (
          <button key={s.key} onClick={() => setStatus(s.key)} className={`px-3 py-1.5 text-xs rounded-lg ${status === s.key ? 'bg-[#151515] text-white' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}>{s.label}</button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(20,20,40,0.06)]">
              {['Клиент', 'Партнёр', 'Услуги', 'Время', 'Статус', 'Действие'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Загрузка…</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">Записей нет</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} className="hover:bg-[#fafafa]">
                <td className="px-5 py-3.5"><p className="text-sm text-[#151515]">{b.userName}</p><p className="text-xs text-[#9a9a9a]">{b.userPhone}</p></td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{b.partnerName}</td>
                <td className="px-5 py-3.5 text-xs text-[#5f5e5e]">{b.services.join(', ') || '—'}</td>
                <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{formatDate(b.scheduledAt)}</td>
                <td className="px-5 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[b.status]}`}>{STATUS_LABEL[b.status]}</span></td>
                <td className="px-5 py-3.5">
                  <select value="" onChange={(e) => e.target.value && setStatusFor(b.id, e.target.value)} className="h-8 px-2 rounded-lg bg-[#f5f5f7] text-xs outline-none">
                    <option value="">Сменить…</option>
                    <option value="CONFIRMED">Подтвердить</option>
                    <option value="COMPLETED">Выполнено</option>
                    <option value="CANCELLED">Отменить</option>
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
