'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import {
  partnersApi,
  uploadPartnerImage,
  useCategories,
  useInvalidatePartners,
  type PartnerFull,
  type PartnerService,
} from '@/lib/partners';

const DAYS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' },
];

type WH = Record<string, { open: string; close: string } | null>;

const EMPTY = {
  name: '', categoryId: '', address: '', city: 'Ташкент', phone: '', email: '', website: '',
  description: '', lat: '', lng: '', active: true,
};

export function PartnerEditor({ partnerId, onClose }: { partnerId: string | null | 'new'; onClose: () => void }) {
  const isNew = partnerId === 'new';
  const { data: categories = [] } = useCategories();
  const invalidate = useInvalidatePartners();
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [wh, setWh] = useState<WH>({});
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [services, setServices] = useState<PartnerService[]>([]);
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : partnerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!partnerId || partnerId === 'new') return;
    partnersApi.get(partnerId).then((p: PartnerFull) => {
      setForm({
        name: p.name, categoryId: p.categoryId ?? '', address: p.address, city: p.city,
        phone: p.phone ?? '', email: p.email ?? '', website: p.website ?? '', description: p.description ?? '',
        lat: p.lat?.toString() ?? '', lng: p.lng?.toString() ?? '', active: p.active,
      });
      setWh((p.workingHours as WH) ?? {});
      setLogoKey(p.logoKey); setCoverKey(p.coverKey); setLogoUrl(p.logoUrl); setCoverUrl(p.coverUrl);
      setServices(p.services);
      setSavedId(p.id);
    });
  }, [partnerId]);

  const set = (k: keyof typeof EMPTY, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const setDay = (key: string, val: { open: string; close: string } | null) => setWh((w) => ({ ...w, [key]: val }));

  const upload = async (file: File, kind: 'logo' | 'cover') => {
    try {
      const key = await uploadPartnerImage(file);
      const url = URL.createObjectURL(file);
      if (kind === 'logo') { setLogoKey(key); setLogoUrl(url); } else { setCoverKey(key); setCoverUrl(url); }
    } catch { alert('Не удалось загрузить'); }
  };

  const body = () => ({
    name: form.name, categoryId: form.categoryId || undefined, address: form.address, city: form.city,
    phone: form.phone || undefined, email: form.email || undefined, website: form.website || undefined,
    description: form.description || undefined,
    lat: form.lat ? Number(form.lat) : undefined, lng: form.lng ? Number(form.lng) : undefined,
    logoKey: logoKey ?? undefined, coverKey: coverKey ?? undefined,
    workingHours: wh, active: form.active,
  });

  const save = async () => {
    setError('');
    if (!form.name.trim() || !form.address.trim()) { setError('Название и адрес обязательны'); return; }
    setSaving(true);
    try {
      if (savedId) {
        await partnersApi.update(savedId, body());
      } else {
        const created = await partnersApi.create(body());
        setSavedId(created.id);
      }
      invalidate();
      if (savedId) onClose();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[rgba(20,20,40,0.08)]">
          <h2 className="text-sm font-semibold text-[#151515]">{isNew && !savedId ? 'Новый партнёр' : 'Редактирование партнёра'}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f0f2]"><X size={16} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Images */}
          <div className="flex gap-3">
            <ImageUpload label="Логотип" url={logoUrl} onFile={(f) => upload(f, 'logo')} />
            <ImageUpload label="Баннер" url={coverUrl} onFile={(f) => upload(f, 'cover')} wide />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Название"><input value={form.name} onChange={(e) => set('name', e.target.value)} className={inp} /></Field>
            <Field label="Категория">
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inp}>
                <option value="">— без категории —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Адрес"><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inp} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Город"><input value={form.city} onChange={(e) => set('city', e.target.value)} className={inp} /></Field>
            <Field label="Телефон"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inp} /></Field>
            <Field label="Email"><input value={form.email} onChange={(e) => set('email', e.target.value)} className={inp} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Сайт"><input value={form.website} onChange={(e) => set('website', e.target.value)} className={inp} /></Field>
            <Field label="Широта (lat)"><input value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="41.31" className={inp} /></Field>
            <Field label="Долгота (lng)"><input value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="69.28" className={inp} /></Field>
          </div>
          <Field label="Описание"><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={inp} /></Field>

          {/* Working hours */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#9a9a9a]">График работы</span>
            <div className="flex flex-col gap-1.5">
              {DAYS.map((d) => {
                const h = wh[d.key];
                const off = !h;
                return (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-8 text-xs text-[#5f5e5e]">{d.label}</span>
                    <button
                      onClick={() => setDay(d.key, off ? { open: '09:00', close: '18:00' } : null)}
                      className={`text-[11px] px-2 py-1 rounded-md ${off ? 'bg-[#f0f0f2] text-[#9a9a9a]' : 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]'}`}
                    >
                      {off ? 'выходной' : 'работает'}
                    </button>
                    {!off && (
                      <>
                        <input value={h!.open} onChange={(e) => setDay(d.key, { ...h!, open: e.target.value })} className="w-20 h-8 px-2 rounded-lg bg-[#f5f5f7] text-sm outline-none" />
                        <span className="text-[#9a9a9a]">—</span>
                        <input value={h!.close} onChange={(e) => setDay(d.key, { ...h!, close: e.target.value })} className="w-20 h-8 px-2 rounded-lg bg-[#f5f5f7] text-sm outline-none" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#151515]">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Активен (виден в приложении)
          </label>

          {error && <p className="text-xs text-[#e61428]">{error}</p>}

          {/* Services — только после сохранения партнёра */}
          {savedId ? (
            <ServicesSection partnerId={savedId} services={services} onChange={setServices} />
          ) : (
            <p className="text-xs text-[#9a9a9a]">Сохраните партнёра, чтобы добавить услуги.</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white flex items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(20,20,40,0.08)]">
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm text-[#5f5e5e] hover:bg-[#f0f0f2]">Закрыть</button>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-xl text-sm bg-[#e61428] text-white hover:bg-[#c01020] disabled:opacity-50">
            {saving ? 'Сохранение…' : savedId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = 'w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium text-[#9a9a9a]">{label}</span>{children}</label>;
}

function ImageUpload({ label, url, onFile, wide }: { label: string; url: string | null; onFile: (f: File) => void; wide?: boolean }) {
  return (
    <label className={`${wide ? 'flex-1' : 'w-24'} h-24 rounded-xl border-2 border-dashed border-[rgba(20,20,40,0.12)] flex items-center justify-center cursor-pointer overflow-hidden bg-[#fafafa] relative`}>
      {url ? <img src={url} alt={label} className="w-full h-full object-cover" /> : (
        <div className="flex flex-col items-center gap-1 text-[#9a9a9a]"><Upload size={16} /><span className="text-[10px]">{label}</span></div>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}

function ServicesSection({ partnerId, services, onChange }: { partnerId: string; services: PartnerService[]; onChange: (s: PartnerService[]) => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const add = async () => {
    if (!name.trim()) return;
    const created = await partnersApi.createService(partnerId, {
      name: name.trim(),
      priceFrom: price ? Number(price) : undefined,
      durationMin: duration ? Number(duration) : undefined,
    });
    onChange([...services, created as PartnerService]);
    setName(''); setPrice(''); setDuration('');
  };
  const remove = async (id: string) => { await partnersApi.deleteService(id); onChange(services.filter((s) => s.id !== id)); };

  return (
    <div className="flex flex-col gap-2 border-t border-[rgba(20,20,40,0.08)] pt-4">
      <span className="text-xs font-medium text-[#9a9a9a]">Услуги</span>
      {services.map((s) => (
        <div key={s.id} className="flex items-center gap-2 bg-[#fafafa] rounded-lg px-3 py-2">
          <span className="flex-1 text-sm text-[#151515]">{s.name}</span>
          {s.priceFrom != null && <span className="text-xs text-[#5f5e5e]">от {s.priceFrom.toLocaleString('ru-RU')} сум</span>}
          {s.durationMin != null && <span className="text-xs text-[#9a9a9a]">{s.durationMin} мин</span>}
          <button onClick={() => remove(s.id)} className="text-[#e61428] hover:bg-[rgba(230,20,40,0.08)] rounded p-1"><Trash2 size={14} /></button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название услуги" className="flex-1 h-9 px-3 rounded-lg bg-[#f5f5f7] text-sm outline-none" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Цена от" className="w-24 h-9 px-3 rounded-lg bg-[#f5f5f7] text-sm outline-none" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="мин" className="w-16 h-9 px-3 rounded-lg bg-[#f5f5f7] text-sm outline-none" />
        <button onClick={add} className="h-9 w-9 rounded-lg bg-[#151515] text-white flex items-center justify-center"><Plus size={16} /></button>
      </div>
    </div>
  );
}
