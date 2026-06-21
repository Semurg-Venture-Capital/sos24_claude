'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCreateUser, useUpdateUser, type UserInput } from '@/lib/admin-hooks';

export const ROLE_OPTIONS = [
  { value: 'USER', label: 'Пользователь' },
  { value: 'SUPPORT', label: 'Поддержка' },
  { value: 'ADJUSTER', label: 'Аджастер' },
  { value: 'ADMIN', label: 'Администратор' },
];

export interface EditUser {
  id: string;
  phone: string;
  role: string;
  name?: string | null;
  surname?: string | null;
  patronymic?: string | null;
}

export function UserFormModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: EditUser | null }) {
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();
  const [form, setForm] = useState<UserInput>({ phone: '+998', role: 'SUPPORT', name: '', surname: '', patronymic: '' });
  const [error, setError] = useState('');

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
            }
          : { phone: '+998', role: 'SUPPORT', name: '', surname: '', patronymic: '' },
      );
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
    try {
      if (isEdit && user) {
        await update.mutateAsync({ id: user.id, input: form });
      } else {
        await create.mutateAsync(form);
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
