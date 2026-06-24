'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useServices, useServiceMutations, type Service } from '@/lib/cabinet';
import { PageHeader, Card, Button, Field, Input, Textarea, Badge, EmptyState, Modal } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

function priceLabel(s: Service): string {
  if (s.priceFrom && s.priceTo) return `${formatMoney(s.priceFrom)} – ${formatMoney(s.priceTo)}`;
  if (s.priceFrom) return `от ${formatMoney(s.priceFrom)}`;
  return 'цена по запросу';
}

function ServiceModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const { create, update } = useServiceMutations();
  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    priceFrom: service?.priceFrom?.toString() ?? '',
    priceTo: service?.priceTo?.toString() ?? '',
    durationMin: service?.durationMin?.toString() ?? '',
    active: service?.active ?? true,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const dto: Record<string, unknown> = { name: form.name, description: form.description || undefined, active: form.active };
    if (form.priceFrom) dto.priceFrom = Number(form.priceFrom);
    if (form.priceTo) dto.priceTo = Number(form.priceTo);
    if (form.durationMin) dto.durationMin = Number(form.durationMin);
    if (service) await update.mutateAsync({ id: service.id, dto });
    else await create.mutateAsync(dto);
    onClose();
  };

  const busy = create.isPending || update.isPending;
  return (
    <Modal open onClose={onClose} title={service ? 'Редактировать услугу' : 'Новая услуга'}>
      <div className="flex flex-col gap-4">
        <Field label="Название"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Замена масла" /></Field>
        <Field label="Описание"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Цена от, сум"><Input type="number" value={form.priceFrom} onChange={(e) => set('priceFrom', e.target.value)} /></Field>
          <Field label="Цена до, сум"><Input type="number" value={form.priceTo} onChange={(e) => set('priceTo', e.target.value)} /></Field>
          <Field label="Длит., мин"><Input type="number" value={form.durationMin} onChange={(e) => set('durationMin', e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#5f5e5e]">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Активна
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} disabled={busy || !form.name}>{busy ? 'Сохраняем…' : 'Сохранить'}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const { remove } = useServiceMutations();
  const [modal, setModal] = useState<{ service: Service | null } | null>(null);

  return (
    <>
      <PageHeader title="Услуги" action={<Button onClick={() => setModal({ service: null })}><Plus size={15} /> Услуга</Button>} />
      <div className="p-8 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-sm text-[#9a9a9a]">Загрузка…</div>
        ) : !services || services.length === 0 ? (
          <Card><EmptyState title="Услуг пока нет" hint="Добавьте услуги с ценами — клиенты увидят их при записи." /></Card>
        ) : (
          services.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#151515]">{s.name}</h3>
                  {!s.active && <Badge tone="gray">скрыта</Badge>}
                </div>
                {s.description && <p className="text-xs text-[#9a9a9a] mt-0.5 truncate">{s.description}</p>}
                <p className="text-xs text-[#5f5e5e] mt-1">{priceLabel(s)}{s.durationMin ? ` · ${s.durationMin} мин` : ''}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setModal({ service: s })} className="p-2 rounded-lg hover:bg-[#f0f0f2] text-[#5f5e5e] cursor-pointer"><Pencil size={15} /></button>
                <button onClick={() => { if (confirm('Удалить услугу?')) remove.mutate(s.id); }} className="p-2 rounded-lg hover:bg-[rgba(230,20,40,0.08)] text-[#e61428] cursor-pointer"><Trash2 size={15} /></button>
              </div>
            </Card>
          ))
        )}
      </div>
      {modal && <ServiceModal service={modal.service} onClose={() => setModal(null)} />}
    </>
  );
}
