'use client';

import { useEffect, useRef, useState } from 'react';
import { useCompany, useUpdateCompany } from '@/lib/cabinet';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, Button, Field, Input, Textarea } from '@/components/ui';

export default function CompanyPage() {
  const { data: company, isLoading } = useCompany();
  const update = useUpdateCompany();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDescription(company.description ?? '');
    }
  }, [company]);

  if (isLoading || !company) return <><PageHeader title="Компания" /><div className="p-8 text-sm text-[#9a9a9a]">Загрузка…</div></>;

  const onSave = async () => {
    await update.mutateAsync({ name, description });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/cabinet/company/logo', fd);
      qc.invalidateQueries({ queryKey: ['cabinet', 'company'] });
      qc.invalidateQueries({ queryKey: ['cabinet', 'me'] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <PageHeader
        title="Компания"
        subtitle={`Маркетплейс-slug: ${company.slug}`}
        action={<Button onClick={onSave} disabled={update.isPending}>{saved ? 'Сохранено ✓' : update.isPending ? 'Сохраняем…' : 'Сохранить'}</Button>}
      />
      <div className="p-8 max-w-2xl flex flex-col gap-6">
        <Card className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#f0f0f2] flex items-center justify-center overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {company.logoUrl ? <img src={company.logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-2xl font-semibold text-[#c0c0c0]">{company.name[0]}</span>}
          </div>
          <div>
            <p className="text-sm font-medium text-[#151515] mb-1">Логотип</p>
            <p className="text-xs text-[#9a9a9a] mb-3">PNG, JPG, WEBP или SVG, до 5 МБ.</p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onUpload} className="hidden" />
            <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Загрузка…' : 'Загрузить логотип'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <Field label="Название компании">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Описание">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={5} placeholder="Коротко о компании — увидят клиенты в каталоге." />
          </Field>
          <p className="text-xs text-[#9a9a9a]">Видимость в каталоге и slug управляются администратором SOS24.</p>
        </Card>
      </div>
    </>
  );
}
