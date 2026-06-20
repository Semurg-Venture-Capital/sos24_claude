'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import {
  useInsuranceCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useUploadCompanyLogo,
} from '@/lib/admin-hooks';
import { apiErrorMessage, type InsuranceCompany, type CompanyInput } from '@/lib/insurance';
import { Plus, Pencil, Trash2, Building2, ChevronRight, Upload } from 'lucide-react';

export default function InsuranceCompaniesPage() {
  const router = useRouter();
  const { data, isLoading } = useInsuranceCompanies();
  const companies = data ?? [];
  const [editing, setEditing] = useState<InsuranceCompany | null | 'new'>(null);

  return (
    <>
      <Header title="Страховые компании" subtitle={isLoading ? 'Загрузка…' : `${companies.length} компаний`} />

      <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-16 space-y-5">
        <div className="flex justify-end">
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#151515] hover:bg-black transition"
          >
            <Plus size={16} /> Добавить компанию
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#ececec] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#9a9a9a] text-xs border-b border-[#ececec]">
                <th className="px-4 py-3 font-medium">Компания</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Продуктов</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Порядок</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#9a9a9a]">Загрузка…</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#9a9a9a]">Нет компаний</td></tr>
              ) : (
                companies.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/insurance/${c.id}`)}
                    className="border-b border-[#f4f4f4] hover:bg-[#fafafa] cursor-pointer transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#f4f4f4] flex items-center justify-center overflow-hidden shrink-0">
                          {c.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 size={16} className="text-[#c4c4c4]" />
                          )}
                        </div>
                        <span className="font-medium text-[#151515]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#9a9a9a]">{c.slug}</td>
                    <td className="px-4 py-3 text-[#555]">{c.productCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={c.active} />
                    </td>
                    <td className="px-4 py-3 text-[#9a9a9a]">{c.sortOrder}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <IconBtn title="Редактировать" onClick={() => setEditing(c)}>
                          <Pencil size={14} />
                        </IconBtn>
                        <DeleteCompanyBtn company={c} />
                        <ChevronRight size={16} className="text-[#c4c4c4] ml-1" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <CompanyModal
          company={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(52,211,153,0.1)] text-[#0a9466]">Активна</span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]">Скрыта</span>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5f5e5e] hover:bg-[#f0f0f2] transition"
    >
      {children}
    </button>
  );
}

function DeleteCompanyBtn({ company }: { company: InsuranceCompany }) {
  const del = useDeleteCompany();
  const onDelete = () => {
    if (!confirm(`Удалить компанию «${company.name}»? Это действие необратимо.`)) return;
    del.mutate(company.id, {
      onError: (err) => alert(apiErrorMessage(err, 'Не удалось удалить компанию')),
    });
  };
  return (
    <button
      title="Удалить"
      onClick={onDelete}
      disabled={del.isPending}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#e61428] hover:bg-[rgba(230,20,40,0.08)] transition disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}

function CompanyModal({ company, onClose }: { company: InsuranceCompany | null; onClose: () => void }) {
  const create = useCreateCompany();
  const update = useUpdateCompany();
  const uploadLogo = useUploadCompanyLogo();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(company?.name ?? '');
  const [slug, setSlug] = useState(company?.slug ?? '');
  const [description, setDescription] = useState(company?.description ?? '');
  const [active, setActive] = useState(company?.active ?? true);
  const [sortOrder, setSortOrder] = useState(company?.sortOrder ?? 0);
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl ?? '');
  const [error, setError] = useState('');

  const pending = create.isPending || update.isPending;

  const save = () => {
    setError('');
    if (!name.trim() || !slug.trim()) {
      setError('Название и slug обязательны');
      return;
    }
    const body: CompanyInput = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      active,
      sortOrder,
    };
    if (company) {
      update.mutate(
        { id: company.id, ...body },
        { onSuccess: onClose, onError: (err) => setError(apiErrorMessage(err)) },
      );
    } else {
      create.mutate(body, { onSuccess: onClose, onError: (err) => setError(apiErrorMessage(err)) });
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    uploadLogo.mutate(
      { id: company.id, file },
      {
        onSuccess: (res) => setLogoUrl(res.logoUrl),
        onError: (err) => setError(apiErrorMessage(err, 'Не удалось загрузить логотип')),
      },
    );
  };

  return (
    <Modal title={company ? 'Редактирование компании' : 'Новая компания'} onClose={onClose}>
      <div className="space-y-4">
        {company && (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#f4f4f4] flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="логотип" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={20} className="text-[#c4c4c4]" />
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onPickFile}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadLogo.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-[#ececec] hover:bg-[#fafafa] transition disabled:opacity-50"
              >
                <Upload size={14} /> {uploadLogo.isPending ? 'Загрузка…' : 'Загрузить логотип'}
              </button>
              <p className="text-xs text-[#9a9a9a] mt-1">PNG, JPG, WEBP, SVG до 5 МБ</p>
            </div>
          </div>
        )}

        <FormField label="Название">
          <Input value={name} onChange={setName} placeholder="Например, SOS24 Sug'urta" />
        </FormField>
        <FormField label="Slug">
          <Input value={slug} onChange={setSlug} placeholder="sos24-sugurta" />
        </FormField>
        <FormField label="Описание">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white resize-none outline-none focus:border-[#151515]"
          />
        </FormField>
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
            <Toggle value={active} onChange={setActive} label="Активна" />
          </FormField>
        </div>

        {!company && (
          <p className="text-xs text-[#9a9a9a]">Логотип можно загрузить после создания компании.</p>
        )}
        {error && <p className="text-sm text-[#e61428]">{error}</p>}
      </div>

      <ModalFooter onClose={onClose} onSave={save} pending={pending} />
    </Modal>
  );
}

// ── Переиспользуемые UI-блоки (общие для insurance-страниц) ──
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#ececec]">
          <h2 className="text-sm font-semibold text-[#151515]">{title}</h2>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({
  onClose,
  onSave,
  pending,
}: {
  onClose: () => void;
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 mt-6">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-sm font-medium text-[#5f5e5e] border border-[#ececec] hover:bg-[#fafafa] transition"
      >
        Отмена
      </button>
      <button
        onClick={onSave}
        disabled={pending}
        className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#e61428] hover:bg-[#c01020] transition disabled:opacity-50"
      >
        {pending ? 'Сохранение…' : 'Сохранить'}
      </button>
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#9a9a9a] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#151515]"
    />
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition w-full ${
        value ? 'border-[#0a9466] bg-[rgba(52,211,153,0.08)] text-[#0a9466]' : 'border-[#ececec] text-[#9a9a9a]'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 ${value ? 'border-[#0a9466] bg-[#0a9466]' : 'border-[#c4c4c4]'}`} />
      {label}
    </button>
  );
}
