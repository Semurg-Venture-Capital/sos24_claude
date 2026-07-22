'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useCreateUser, useUpdateUser, useInsuranceCompanies, type UserInput } from '@/lib/admin-hooks';
import { partnersApi } from '@/lib/partners';

export const ROLE_OPTIONS = [
  { value: 'USER', label: 'Пользователь' },
  { value: 'SUPPORT', label: 'Поддержка' },
  { value: 'ADJUSTER', label: 'Специалист' },
  { value: 'ADMIN', label: 'Администратор' },
  { value: 'PARTNER', label: 'Партнёр (B2B-кабинет)' },
];

export interface EditUser {
  id: string;
  phone: string;
  role: string;
  name?: string | null;
  surname?: string | null;
  patronymic?: string | null;
  ownedCompany?: { id: string; name: string } | null;
  ownedPartner?: { id: string; name: string } | null;
  sipExtension?: string | null;
}

export function UserFormModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: EditUser | null }) {
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();
  const [form, setForm] = useState<UserInput>({ phone: '+998', role: 'SUPPORT', name: '', surname: '', patronymic: '' });
  const [error, setError] = useState('');
  // Привязка кабинета: тип сущности + выбранный id (только для role=PARTNER).
  const [linkType, setLinkType] = useState<'company' | 'partner'>('company');
  const [linkId, setLinkId] = useState('');

  // Списки для привязки тянем только когда работаем с партнёром.
  const isPartner = form.role === 'PARTNER';
  const { data: companies } = useInsuranceCompanies();
  const { data: partners } = useQuery({
    queryKey: ['admin', 'partners', 'all-for-link'],
    queryFn: () => partnersApi.list(),
    enabled: isPartner,
  });

  useEffect(() => {
    if (open) {
      setError('');
      setForm(
        user
          ? {
              phone: user.phone,
              role: user.role,
              name: user.name ?? '',
              surname: user.surname ?? '',
              patronymic: user.patronymic ?? '',
              sipExtension: user.sipExtension ?? '',
              sipSecret: '', // секрет не приходит с сервера; пусто = не менять
            }
          : { phone: '+998', role: 'SUPPORT', name: '', surname: '', patronymic: '', sipExtension: '', sipSecret: '' },
      );
      // Предзаполняем привязку из текущего владения.
      if (user?.ownedPartner) {
        setLinkType('partner');
        setLinkId(user.ownedPartner.id);
      } else if (user?.ownedCompany) {
        setLinkType('company');
        setLinkId(user.ownedCompany.id);
      } else {
        setLinkType('company');
        setLinkId('');
      }
    }
  }, [open, user]);

  if (!open) return null;

  const set = (k: keyof UserInput, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const phoneOk = /^\+998\d{9}$/.test(form.phone ?? '');
  const busy = create.isPending || update.isPending;

  const submit = async () => {
    setError('');
    if (!phoneOk) {
      setError('Телефон в формате +998XXXXXXXXX');
      return;
    }
    // Для партнёра собираем привязку; "" в нужном поле = отвязать.
    const payload: UserInput = { ...form };
    if (isPartner) {
      payload.linkCompanyId = linkType === 'company' ? linkId : '';
      payload.linkPartnerId = linkType === 'partner' ? linkId : '';
    } else if (isEdit) {
      // Сняли роль PARTNER — бэкенд сам отвяжет; ничего не передаём.
    }
    // Пустой sipSecret = «не менять» (не стираем существующий секрет оператора).
    if (!payload.sipSecret) delete payload.sipSecret;
    try {
      if (isEdit && user) {
        await update.mutateAsync({ id: user.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка сохранения');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(20,20,40,0.08)]">
          <h2 className="text-sm font-semibold text-[#151515]">{isEdit ? 'Изменить пользователя' : 'Новый пользователь'}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f0f2]">
            <X size={16} className="text-[#5f5e5e]" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <Field label="Телефон">
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+998901234567"
              className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20"
            />
          </Field>

          <Field label="Роль">
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>

          {isPartner && (
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-[rgba(230,20,40,0.04)] border border-[rgba(230,20,40,0.12)]">
              <p className="text-xs font-medium text-[#5f5e5e]">Привязка кабинета</p>
              <div className="flex gap-1 bg-white p-1 rounded-lg w-full">
                {([['company', 'Страховая компания'], ['partner', 'Точка-партнёр']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setLinkType(v); setLinkId(''); }}
                    className={`flex-1 h-8 rounded-md text-xs transition-colors ${linkType === v ? 'bg-[#e61428] text-white' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <select
                value={linkId}
                onChange={(e) => setLinkId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none focus:ring-2 ring-[#e61428]/20"
              >
                <option value="">— не привязывать —</option>
                {linkType === 'company'
                  ? (companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                  : (partners ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p className="text-[11px] text-[#9a9a9a]">Партнёр входит на partner.sos24.uz и управляет только привязанной {linkType === 'company' ? 'компанией' : 'точкой'}.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Имя">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20" />
            </Field>
            <Field label="Фамилия">
              <input value={form.surname} onChange={(e) => set('surname', e.target.value)} className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20" />
            </Field>
          </div>

          <Field label="Отчество">
            <input value={form.patronymic} onChange={(e) => set('patronymic', e.target.value)} className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20" />
          </Field>

          {(form.role === 'SUPPORT' || form.role === 'ADMIN') && (
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-[rgba(86,140,255,0.05)] border border-[rgba(86,140,255,0.15)]">
              <p className="text-xs font-medium text-[#5f5e5e]">Колл-центр: персональный SIP-extension оператора</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SIP extension">
                  <input value={form.sipExtension ?? ''} onChange={(e) => set('sipExtension', e.target.value)} placeholder="напр. 103" className="w-full h-10 px-3 rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none focus:ring-2 ring-[#e61428]/20" />
                </Field>
                <Field label="SIP secret">
                  <input value={form.sipSecret ?? ''} onChange={(e) => set('sipSecret', e.target.value)} placeholder={isEdit ? 'без изменений' : 'секрет extension'} className="w-full h-10 px-3 rounded-xl bg-white border border-[rgba(20,20,40,0.1)] text-sm outline-none focus:ring-2 ring-[#e61428]/20" />
                </Field>
              </div>
              <p className="text-[11px] text-[#9a9a9a]">Заведи WebRTC-extension в FreePBX и впиши сюда номер + секрет. Оператор получит свой телефон в панели «Колл-центр».</p>
            </div>
          )}

          {error && <p className="text-xs text-[#e61428]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(20,20,40,0.08)]">
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm text-[#5f5e5e] hover:bg-[#f0f0f2] transition-colors">
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="h-9 px-4 rounded-xl text-sm bg-[#e61428] text-white hover:bg-[#c01020] disabled:opacity-50 transition-colors"
          >
            {busy ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#9a9a9a]">{label}</span>
      {children}
    </label>
  );
}
