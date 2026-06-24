'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useProducts, useProductMutations, type Product, type Plan } from '@/lib/cabinet';
import { PageHeader, Card, Button, Field, Input, Textarea, Badge, EmptyState, Modal } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

const PRODUCT_TYPES = ['OSAGO', 'KASKO', 'HEALTH', 'HOME', 'FINANCE', 'LIFE', 'TRAVEL', 'OTHER'] as const;
const TYPE_LABELS: Record<string, string> = {
  OSAGO: 'ОСАГО', KASKO: 'КАСКО', HEALTH: 'Здоровье', HOME: 'Имущество',
  FINANCE: 'Финансы', LIFE: 'Жизнь', TRAVEL: 'Путешествия', OTHER: 'Другое',
};

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { create, update } = useProductMutations();
  const [form, setForm] = useState({
    type: product?.type ?? 'OSAGO',
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    shortDescription: product?.shortDescription ?? '',
    longDescription: product?.longDescription ?? '',
    pricingMode: product?.pricingMode ?? 'PLANS',
    baseRate: product?.baseRate?.toString() ?? '',
    active: product?.active ?? true,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const dto: Record<string, unknown> = {
      type: form.type,
      name: form.name,
      slug: form.slug,
      shortDescription: form.shortDescription || undefined,
      longDescription: form.longDescription || undefined,
      pricingMode: form.pricingMode,
      active: form.active,
    };
    if (form.pricingMode === 'COEFFICIENT' && form.baseRate) dto.baseRate = Number(form.baseRate);
    if (product) await update.mutateAsync({ id: product.id, dto });
    else await create.mutateAsync(dto);
    onClose();
  };

  const busy = create.isPending || update.isPending;
  return (
    <Modal open onClose={onClose} title={product ? 'Редактировать продукт' : 'Новый продукт'}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Тип">
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className="h-10 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm outline-none focus:border-[#e61428]">
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Тарификация">
            <select value={form.pricingMode} onChange={(e) => set('pricingMode', e.target.value)} className="h-10 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm outline-none focus:border-[#e61428]">
              <option value="PLANS">Тарифные планы</option>
              <option value="COEFFICIENT">Коэффициент (ОСАГО/КАСКО)</option>
            </select>
          </Field>
        </div>
        <Field label="Название"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Slug (латиница, уникальный в компании)"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="osago" /></Field>
        {form.pricingMode === 'COEFFICIENT' && (
          <Field label="Базовая ставка, сум"><Input type="number" value={form.baseRate} onChange={(e) => set('baseRate', e.target.value)} /></Field>
        )}
        <Field label="Краткое описание"><Input value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} maxLength={300} /></Field>
        <Field label="Полное описание"><Textarea value={form.longDescription} onChange={(e) => set('longDescription', e.target.value)} maxLength={2000} /></Field>
        <label className="flex items-center gap-2 text-sm text-[#5f5e5e]">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Активен (виден в каталоге)
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} disabled={busy || !form.name || !form.slug}>{busy ? 'Сохраняем…' : 'Сохранить'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PlanModal({ productId, plan, onClose }: { productId: string; plan: Plan | null; onClose: () => void }) {
  const { createPlan, updatePlan } = useProductMutations();
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    price: plan?.price?.toString() ?? '',
    coverageAmount: plan?.coverageAmount?.toString() ?? '',
    features: (plan?.features ?? []).join('\n'),
    active: plan?.active ?? true,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const dto: Record<string, unknown> = {
      name: form.name,
      price: Number(form.price),
      active: form.active,
      features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    if (form.coverageAmount) dto.coverageAmount = Number(form.coverageAmount);
    if (plan) await updatePlan.mutateAsync({ id: plan.id, dto });
    else await createPlan.mutateAsync({ ...dto, productId });
    onClose();
  };

  const busy = createPlan.isPending || updatePlan.isPending;
  return (
    <Modal open onClose={onClose} title={plan ? 'Редактировать тариф' : 'Новый тариф'}>
      <div className="flex flex-col gap-4">
        <Field label="Название тарифа"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Базовый" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Цена, сум"><Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
          <Field label="Покрытие, сум"><Input type="number" value={form.coverageAmount} onChange={(e) => set('coverageAmount', e.target.value)} /></Field>
        </div>
        <Field label="Что входит (по строке на пункт)"><Textarea value={form.features} onChange={(e) => set('features', e.target.value)} placeholder={'Выплата до 40 млн\nЭвакуатор\nАджастер 24/7'} /></Field>
        <label className="flex items-center gap-2 text-sm text-[#5f5e5e]">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Активен
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} disabled={busy || !form.name || !form.price}>{busy ? 'Сохраняем…' : 'Сохранить'}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { remove, removePlan } = useProductMutations();
  const [productModal, setProductModal] = useState<{ product: Product | null } | null>(null);
  const [planModal, setPlanModal] = useState<{ productId: string; plan: Plan | null } | null>(null);

  return (
    <>
      <PageHeader title="Продукты и тарифы" action={<Button onClick={() => setProductModal({ product: null })}><Plus size={15} /> Продукт</Button>} />
      <div className="p-8 flex flex-col gap-4">
        {isLoading ? (
          <div className="text-sm text-[#9a9a9a]">Загрузка…</div>
        ) : !products || products.length === 0 ? (
          <Card><EmptyState title="Продуктов пока нет" hint="Добавьте первый страховой продукт — он появится в каталоге приложения." /></Card>
        ) : (
          products.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-semibold text-[#151515]">{p.name}</h3>
                    <Badge tone="blue">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                    {!p.active && <Badge tone="gray">скрыт</Badge>}
                  </div>
                  {p.shortDescription && <p className="text-xs text-[#9a9a9a]">{p.shortDescription}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setProductModal({ product: p })} className="p-2 rounded-lg hover:bg-[#f0f0f2] text-[#5f5e5e] cursor-pointer"><Pencil size={15} /></button>
                  <button onClick={() => { if (confirm('Удалить продукт?')) remove.mutate(p.id); }} className="p-2 rounded-lg hover:bg-[rgba(230,20,40,0.08)] text-[#e61428] cursor-pointer"><Trash2 size={15} /></button>
                </div>
              </div>

              {p.pricingMode === 'PLANS' && (
                <div className="mt-4 border-t border-[var(--color-hairline)] pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#5f5e5e]">Тарифы ({p.plans.length})</span>
                    <button onClick={() => setPlanModal({ productId: p.id, plan: null })} className="text-xs text-[#e61428] font-medium hover:underline cursor-pointer inline-flex items-center gap-1"><Plus size={13} /> тариф</button>
                  </div>
                  {p.plans.length === 0 ? (
                    <p className="text-xs text-[#9a9a9a]">Нет тарифов.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {p.plans.map((pl) => (
                        <div key={pl.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#f7f7f8]">
                          <div className="min-w-0">
                            <span className="text-sm text-[#151515]">{pl.name}</span>
                            {!pl.active && <span className="ml-2 text-[11px] text-[#9a9a9a]">(скрыт)</span>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-medium text-[#151515]">{formatMoney(pl.price)}</span>
                            <button onClick={() => setPlanModal({ productId: p.id, plan: pl })} className="p-1.5 rounded-md hover:bg-white text-[#5f5e5e] cursor-pointer"><Pencil size={13} /></button>
                            <button onClick={() => { if (confirm('Удалить тариф?')) removePlan.mutate(pl.id); }} className="p-1.5 rounded-md hover:bg-white text-[#e61428] cursor-pointer"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {p.pricingMode === 'COEFFICIENT' && (
                <p className="mt-3 text-xs text-[#9a9a9a]">Тарификация по коэффициенту{p.baseRate ? ` · базовая ставка ${formatMoney(p.baseRate)}` : ''}.</p>
              )}
            </Card>
          ))
        )}
      </div>

      {productModal && <ProductModal product={productModal.product} onClose={() => setProductModal(null)} />}
      {planModal && <PlanModal productId={planModal.productId} plan={planModal.plan} onClose={() => setPlanModal(null)} />}
    </>
  );
}
