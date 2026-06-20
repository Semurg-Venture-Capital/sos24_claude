'use client';

import { useState } from 'react';
import {
  useCreateProduct,
  useUpdateProduct,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
} from '@/lib/admin-hooks';
import {
  apiErrorMessage,
  emptyContent,
  fmtSum,
  normalizeContent,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABEL,
  PRICING_MODES,
  PRICING_MODE_LABEL,
  type InsuranceProduct,
  type InsurancePlan,
  type PricingMode,
  type ProductContent,
  type ProductInput,
  type ProductType,
} from '@/lib/insurance';
import { Plus, Trash2, X } from 'lucide-react';
import { Modal, ModalFooter, FormField, Input, Toggle } from '../page';

export function ProductModal({
  companyId,
  product,
  onClose,
}: {
  companyId: string;
  product: InsuranceProduct | null;
  onClose: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [type, setType] = useState<ProductType>(product?.type ?? 'OSAGO');
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [longDescription, setLongDescription] = useState(product?.longDescription ?? '');
  const [pricingMode, setPricingMode] = useState<PricingMode>(product?.pricingMode ?? 'COEFFICIENT');
  const [baseRate, setBaseRate] = useState<string>(
    product?.baseRate !== null && product?.baseRate !== undefined ? String(product.baseRate) : '',
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [sortOrder, setSortOrder] = useState(product?.sortOrder ?? 0);
  const [content, setContent] = useState<ProductContent>(
    product?.content ? normalizeContent(product.content) : emptyContent(),
  );
  const [error, setError] = useState('');

  const pending = create.isPending || update.isPending;

  const save = () => {
    setError('');
    if (!name.trim() || !slug.trim()) {
      setError('Название и slug обязательны');
      return;
    }
    const body: ProductInput = {
      companyId,
      type,
      name: name.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim() || undefined,
      longDescription: longDescription.trim() || undefined,
      pricingMode,
      baseRate: pricingMode === 'COEFFICIENT' ? (baseRate === '' ? null : Number(baseRate)) : null,
      content,
      active,
      sortOrder,
    };
    if (product) {
      update.mutate(
        { id: product.id, ...body },
        { onSuccess: onClose, onError: (err) => setError(apiErrorMessage(err)) },
      );
    } else {
      create.mutate(body, { onSuccess: onClose, onError: (err) => setError(apiErrorMessage(err)) });
    }
  };

  return (
    <Modal title={product ? 'Редактирование продукта' : 'Новый продукт'} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 -mr-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Тип продукта">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PRODUCT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Режим цены">
            <select
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value as PricingMode)}
              className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
            >
              {PRICING_MODES.map((m) => (
                <option key={m} value={m}>
                  {PRICING_MODE_LABEL[m]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Название">
          <Input value={name} onChange={setName} placeholder="Например, ОСАГО Базовый" />
        </FormField>
        <FormField label="Slug">
          <Input value={slug} onChange={setSlug} placeholder="osago-base" />
        </FormField>
        <FormField label="Короткое описание">
          <Input value={shortDescription} onChange={setShortDescription} />
        </FormField>
        <FormField label="Полное описание">
          <textarea
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            rows={3}
            className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white resize-none outline-none focus:border-[#151515]"
          />
        </FormField>

        {pricingMode === 'COEFFICIENT' ? (
          <FormField label="Базовый тариф (baseRate), сум">
            <input
              type="number"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              placeholder="Например, 165000"
              className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
            />
            <p className="text-xs text-[#9a9a9a] mt-1">
              Итоговая цена = baseRate × коэффициенты. Тарифные планы не нужны.
            </p>
          </FormField>
        ) : product ? (
          <PlansEditor productId={product.id} plans={product.plans ?? []} />
        ) : (
          <div className="rounded-xl bg-[#fafafa] border border-[#ececec] p-3 text-xs text-[#9a9a9a]">
            Тарифные планы можно добавить после создания продукта.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Порядок">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
            />
          </FormField>
          <FormField label="Статус">
            <Toggle value={active} onChange={setActive} label="Активен" />
          </FormField>
        </div>

        {/* Редактор content */}
        <ContentEditor value={content} onChange={setContent} />

        {error && <p className="text-sm text-[#e61428]">{error}</p>}
      </div>

      <ModalFooter onClose={onClose} onSave={save} pending={pending} />
    </Modal>
  );
}

// ── Тарифные планы (только для существующего продукта в режиме PLANS) ──
function PlansEditor({ productId, plans }: { productId: string; plans: InsurancePlan[] }) {
  const createPlan = useCreatePlan();
  const [adding, setAdding] = useState(false);

  return (
    <div className="rounded-xl border border-[#ececec] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">Тарифные планы</span>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs font-medium text-[#151515] hover:text-[#e61428] transition"
        >
          <Plus size={14} /> Добавить план
        </button>
      </div>

      {plans.length === 0 && !adding ? (
        <p className="text-sm text-[#c4c4c4]">Планов пока нет</p>
      ) : (
        <div className="space-y-2">
          {plans.map((pl) => (
            <PlanRow key={pl.id} plan={pl} />
          ))}
        </div>
      )}

      {adding && (
        <PlanForm
          onCancel={() => setAdding(false)}
          pending={createPlan.isPending}
          onSubmit={(data) =>
            createPlan.mutate(
              { productId, ...data },
              {
                onSuccess: () => setAdding(false),
                onError: (err) => alert(apiErrorMessage(err, 'Не удалось создать план')),
              },
            )
          }
        />
      )}
    </div>
  );
}

function PlanRow({ plan }: { plan: InsurancePlan }) {
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PlanForm
        plan={plan}
        pending={updatePlan.isPending}
        onCancel={() => setEditing(false)}
        onSubmit={(data) =>
          updatePlan.mutate(
            { id: plan.id, ...data },
            {
              onSuccess: () => setEditing(false),
              onError: (err) => alert(apiErrorMessage(err, 'Не удалось обновить план')),
            },
          )
        }
      />
    );
  }

  const onDelete = () => {
    if (!confirm(`Удалить план «${plan.name}»?`)) return;
    deletePlan.mutate(plan.id, {
      onError: (err) => alert(apiErrorMessage(err, 'Не удалось удалить план')),
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#fafafa] border border-[#ececec] px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#151515]">{plan.name}</span>
          {!plan.active && <span className="text-[10px] text-[#9a9a9a]">(скрыт)</span>}
        </div>
        <div className="text-xs text-[#9a9a9a]">
          {fmtSum(plan.price)}
          {plan.coverageAmount ? ` · покрытие ${fmtSum(plan.coverageAmount)}` : ''}
          {plan.features && plan.features.length > 0 ? ` · ${plan.features.length} опций` : ''}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-[#5f5e5e] hover:text-[#151515] px-2"
      >
        Изменить
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deletePlan.isPending}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#e61428] hover:bg-[rgba(230,20,40,0.08)] transition disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

interface PlanFormData {
  name: string;
  price: number;
  coverageAmount?: number | null;
  features?: string[];
  active?: boolean;
}

function PlanForm({
  plan,
  onSubmit,
  onCancel,
  pending,
}: {
  plan?: InsurancePlan;
  onSubmit: (data: PlanFormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState<string>(plan ? String(plan.price) : '');
  const [coverage, setCoverage] = useState<string>(
    plan?.coverageAmount !== null && plan?.coverageAmount !== undefined ? String(plan.coverageAmount) : '',
  );
  const [features, setFeatures] = useState<string[]>(plan?.features ?? []);
  const [active, setActive] = useState(plan?.active ?? true);

  const submit = () => {
    if (!name.trim() || price === '') {
      alert('Название и цена обязательны');
      return;
    }
    onSubmit({
      name: name.trim(),
      price: Number(price),
      coverageAmount: coverage === '' ? null : Number(coverage),
      features: features.map((f) => f.trim()).filter(Boolean),
      active,
    });
  };

  return (
    <div className="rounded-lg border border-[#dcdcdc] bg-white p-3 space-y-2">
      <Input value={name} onChange={setName} placeholder="Название плана" />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Цена, сум"
          className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
        />
        <input
          type="number"
          value={coverage}
          onChange={(e) => setCoverage(e.target.value)}
          placeholder="Покрытие, сум"
          className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
        />
      </div>
      <StringListEditor label="Что входит (features)" items={features} onChange={setFeatures} placeholder="Например, выезд врача" />
      <Toggle value={active} onChange={setActive} label="Активен" />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-[#9a9a9a] hover:text-[#151515] px-3 py-1.5">
          Отмена
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="text-xs font-semibold text-white bg-[#151515] hover:bg-black rounded-lg px-4 py-1.5 disabled:opacity-50"
        >
          {pending ? 'Сохранение…' : 'Сохранить план'}
        </button>
      </div>
    </div>
  );
}

// ── Редактор content (covers / exceptions / steps / faqs) ──
function ContentEditor({ value, onChange }: { value: ProductContent; onChange: (v: ProductContent) => void }) {
  return (
    <div className="rounded-xl border border-[#ececec] p-4 space-y-5">
      <span className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">Контент продукта</span>

      {/* covers */}
      <PairListEditor
        label="Что покрывает (covers)"
        items={value.covers}
        fields={['title', 'body']}
        placeholders={['Заголовок', 'Описание']}
        onChange={(covers) => onChange({ ...value, covers })}
        makeEmpty={() => ({ title: '', body: '' })}
      />

      {/* exceptions */}
      <StringListEditor
        label="Исключения (exceptions)"
        items={value.exceptions}
        placeholder="Например, умышленный вред"
        onChange={(exceptions) => onChange({ ...value, exceptions })}
      />

      {/* steps */}
      <PairListEditor
        label="Как оформить (steps)"
        items={value.steps}
        fields={['title', 'body']}
        placeholders={['Шаг', 'Описание шага']}
        onChange={(steps) => onChange({ ...value, steps })}
        makeEmpty={() => ({ title: '', body: '' })}
      />

      {/* faqs */}
      <PairListEditor
        label="FAQ"
        items={value.faqs}
        fields={['question', 'answer']}
        placeholders={['Вопрос', 'Ответ']}
        onChange={(faqs) => onChange({ ...value, faqs })}
        makeEmpty={() => ({ question: '', answer: '' })}
      />
    </div>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#5f5e5e]">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="flex items-center gap-1 text-xs text-[#151515] hover:text-[#e61428] transition"
        >
          <Plus size={13} /> Добавить
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="flex-1 border border-[#ececec] rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-[#151515]"
          />
          <RemoveBtn onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
    </div>
  );
}

function PairListEditor<T extends Record<string, string>>({
  label,
  items,
  fields,
  placeholders,
  onChange,
  makeEmpty,
}: {
  label: string;
  items: T[];
  fields: [keyof T & string, keyof T & string];
  placeholders: [string, string];
  onChange: (items: T[]) => void;
  makeEmpty: () => T;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#5f5e5e]">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, makeEmpty()])}
          className="flex items-center gap-1 text-xs text-[#151515] hover:text-[#e61428] transition"
        >
          <Plus size={13} /> Добавить
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <input
              value={item[fields[0]]}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], [fields[0]]: e.target.value };
                onChange(next);
              }}
              placeholder={placeholders[0]}
              className="w-full border border-[#ececec] rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-[#151515]"
            />
            <textarea
              value={item[fields[1]]}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], [fields[1]]: e.target.value };
                onChange(next);
              }}
              placeholder={placeholders[1]}
              rows={2}
              className="w-full border border-[#ececec] rounded-lg px-3 py-1.5 text-sm bg-white resize-none outline-none focus:border-[#151515]"
            />
          </div>
          <RemoveBtn onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9a9a9a] hover:text-[#e61428] hover:bg-[rgba(230,20,40,0.08)] transition shrink-0 mt-0.5"
    >
      <X size={14} />
    </button>
  );
}
