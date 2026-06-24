'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePartnerProfile, useUpdatePartner } from '@/lib/cabinet';
import { api } from '@/lib/api';
import { PageHeader, Card, Button, Field, Input, Textarea } from '@/components/ui';

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Пн' }, { key: 'tue', label: 'Вт' }, { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' }, { key: 'fri', label: 'Пт' }, { key: 'sat', label: 'Сб' }, { key: 'sun', label: 'Вс' },
];

type Hours = Record<string, { open: string; close: string } | null>;

function ImageUpload({ label, url, endpoint, hint }: { label: string; url: string | null; endpoint: string; hint: string }) {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(endpoint, fd);
      qc.invalidateQueries({ queryKey: ['cabinet', 'partner'] });
      qc.invalidateQueries({ queryKey: ['cabinet', 'me'] });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-[#f0f0f2] flex items-center justify-center overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-[#c0c0c0]">нет</span>}
      </div>
      <div>
        <p className="text-sm font-medium text-[#151515] mb-1">{label}</p>
        <p className="text-xs text-[#9a9a9a] mb-3">{hint}</p>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload} className="hidden" />
        <Button variant="ghost" onClick={() => ref.current?.click()} disabled={busy}>{busy ? 'Загрузка…' : 'Загрузить'}</Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: partner, isLoading } = usePartnerProfile();
  const update = useUpdatePartner();
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '', website: '', description: '' });
  const [hours, setHours] = useState<Hours>({});
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name, address: partner.address, city: partner.city ?? '',
        phone: partner.phone ?? '', email: partner.email ?? '', website: partner.website ?? '',
        description: partner.description ?? '',
      });
      setHours((partner.workingHours as Hours) ?? {});
    }
  }, [partner]);

  if (isLoading || !partner) return <><PageHeader title="Профиль точки" /><div className="p-8 text-sm text-[#9a9a9a]">Загрузка…</div></>;

  const setDay = (key: string, patch: Partial<{ open: string; close: string }> | null) => {
    setHours((h) => ({ ...h, [key]: patch === null ? null : { open: '09:00', close: '18:00', ...h[key], ...patch } }));
  };

  const save = async () => {
    await update.mutateAsync({ ...form, workingHours: hours });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <PageHeader
        title="Профиль точки"
        subtitle={partner.category?.name ?? undefined}
        action={<Button onClick={save} disabled={update.isPending}>{saved ? 'Сохранено ✓' : update.isPending ? 'Сохраняем…' : 'Сохранить'}</Button>}
      />
      <div className="p-8 max-w-2xl flex flex-col gap-6">
        <Card className="p-6 flex flex-col gap-5">
          <ImageUpload label="Логотип" url={partner.logoUrl} endpoint="/cabinet/partner/logo" hint="PNG/JPG/WEBP/SVG, до 5 МБ." />
          <div className="border-t border-[var(--color-hairline)]" />
          <ImageUpload label="Обложка" url={partner.coverUrl} endpoint="/cabinet/partner/cover" hint="Широкое фото для карточки точки." />
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <Field label="Название"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Адрес"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Город"><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="Телефон"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="E-mail"><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Сайт"><Input value={form.website} onChange={(e) => set('website', e.target.value)} /></Field>
          </div>
          <Field label="Описание"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} /></Field>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-[#151515] mb-4">Часы работы</h2>
          <div className="flex flex-col gap-2">
            {DAYS.map(({ key, label }) => {
              const day = hours[key];
              const closed = !day;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-[#5f5e5e]">{label}</span>
                  <label className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
                    <input type="checkbox" checked={!closed} onChange={(e) => setDay(key, e.target.checked ? {} : null)} /> открыто
                  </label>
                  {!closed && (
                    <>
                      <input type="time" value={day!.open} onChange={(e) => setDay(key, { open: e.target.value })} className="h-9 px-2 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm outline-none focus:border-[#e61428]" />
                      <span className="text-[#9a9a9a]">—</span>
                      <input type="time" value={day!.close} onChange={(e) => setDay(key, { close: e.target.value })} className="h-9 px-2 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm outline-none focus:border-[#e61428]" />
                    </>
                  )}
                  {closed && <span className="text-xs text-[#c0c0c0]">выходной</span>}
                </div>
              );
            })}
          </div>
        </Card>
        <p className="text-xs text-[#9a9a9a]">Категория и видимость точки управляются администратором SOS24.</p>
      </div>
    </>
  );
}
