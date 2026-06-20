'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import {
  useInsuranceCompanies,
  useCompanyProducts,
  useDeleteProduct,
} from '@/lib/admin-hooks';
import {
  apiErrorMessage,
  fmtSum,
  minPlanPrice,
  PRODUCT_TYPE_COLOR,
  PRODUCT_TYPE_LABEL,
  PRICING_MODE_LABEL,
  type InsuranceProduct,
  type ProductType,
} from '@/lib/insurance';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { ProductModal } from './ProductModal';

export default function CompanyProductsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: companies } = useInsuranceCompanies();
  const company = companies?.find((c) => c.id === companyId);
  const { data, isLoading } = useCompanyProducts(companyId);
  const products = data ?? [];
  const [editing, setEditing] = useState<InsuranceProduct | null | 'new'>(null);

  return (
    <>
      <Header title={company?.name ?? 'Компания'} subtitle="Продукты и тарифы" />

      <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-16 space-y-5 max-w-5xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/insurance" className="text-sm text-[#9a9a9a] hover:text-[#151515]">
            ← К списку компаний
          </Link>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#151515] hover:bg-black transition"
          >
            <Plus size={16} /> Добавить продукт
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#ececec] p-10 text-center text-[#9a9a9a]">Загрузка…</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#ececec] p-10 text-center text-[#9a9a9a]">
            У этой компании пока нет продуктов
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onEdit={() => setEditing(p)} />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ProductModal
          companyId={companyId}
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ProductCard({ product, onEdit }: { product: InsuranceProduct; onEdit: () => void }) {
  const del = useDeleteProduct();
  const type = product.type as ProductType;
  const color = PRODUCT_TYPE_COLOR[type] ?? '#9a9a9a';
  const policies = product._count?.policies ?? 0;

  const priceText =
    product.pricingMode === 'COEFFICIENT'
      ? `baseRate: ${fmtSum(product.baseRate)}`
      : (() => {
          const min = minPlanPrice(product.plans);
          return min === null ? 'нет планов' : `от ${fmtSum(min)}`;
        })();

  const onDelete = () => {
    if (!confirm(`Удалить продукт «${product.name}»?`)) return;
    del.mutate(product.id, {
      onError: (err) => alert(apiErrorMessage(err, 'Не удалось удалить продукт')),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#ececec] p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
          <Package size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#151515]">{product.name}</span>
            <span
              className="inline-block text-[10px] px-1.5 py-0.5 rounded font-semibold text-white"
              style={{ background: color }}
            >
              {PRODUCT_TYPE_LABEL[type] ?? product.type}
            </span>
            {!product.active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]">
                скрыт
              </span>
            )}
          </div>
          <p className="text-xs text-[#9a9a9a] mt-0.5">{product.slug}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#555] flex-wrap">
            <span>{PRICING_MODE_LABEL[product.pricingMode]}</span>
            <span className="font-medium text-[#151515]">{priceText}</span>
            <span className="text-[#9a9a9a]">Полисов: {policies}</span>
            {product.pricingMode === 'PLANS' && (
              <span className="text-[#9a9a9a]">Планов: {product.plans?.length ?? 0}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            title="Редактировать"
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5f5e5e] hover:bg-[#f0f0f2] transition"
          >
            <Pencil size={14} />
          </button>
          <button
            title="Удалить"
            onClick={onDelete}
            disabled={del.isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#e61428] hover:bg-[rgba(230,20,40,0.08)] transition disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
