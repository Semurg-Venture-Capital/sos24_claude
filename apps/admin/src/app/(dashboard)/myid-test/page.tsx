'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronDown, ChevronRight, ShieldCheck, User, Eye } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerifiedUser {
  id: string;
  phone: string;
  name: string | null;
  surname: string | null;
  pinfl: string | null;
  createdAt: string;
}

interface MyIdUserData {
  id: string;
  phone: string;
  name: string | null;
  surname: string | null;
  patronymic: string | null;
  nameEn: string | null;
  surnameEn: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  gender: string | null;
  nationality: string | null;
  citizenship: string | null;
  address: string | null;
  pinfl: string | null;
  verificationStatus: string;
  createdAt: string;
  myidRaw: Record<string, unknown> | null;
  documents: Array<{
    series: string | null;
    number: string | null;
    pinfl: string | null;
    issuedAt: string | null;
    issuedBy: string | null;
    expiresAt: string | null;
    status: string;
  }>;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useVerifiedUsers() {
  return useQuery<VerifiedUser[]>({
    queryKey: ['admin', 'myid-verified'],
    queryFn: () => api.get('/admin/users/myid-verified').then((r) => r.data),
  });
}

function useUserMyId(userId: string | null) {
  return useQuery<MyIdUserData>({
    queryKey: ['admin', 'user-myid', userId],
    queryFn: () => api.get(`/admin/users/${userId}/myid`).then((r) => r.data),
    enabled: !!userId,
  });
}

// ─── Components ──────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-x-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-5">
        {label}
      </span>
      <span className="text-sm text-gray-900 font-mono break-all leading-5">
        {value ?? <span className="text-gray-300 italic">—</span>}
      </span>
    </div>
  );
}

function RawJsonBlock({ data }: { data: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!data) return <span className="text-gray-300 italic text-sm">—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {open ? 'Скрыть' : 'Показать myidRaw'}
      </button>
      {open && (
        <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-96 text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function UserDetailPanel({ userId }: { userId: string }) {
  const { data, isLoading } = useUserMyId(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        Загрузка данных MyID...
      </div>
    );
  }
  if (!data) return null;

  const passport = data.documents[0];
  const genderLabel =
    data.gender === '1' || data.gender === 'M' ? 'Мужской'
    : data.gender === '2' || data.gender === 'F' ? 'Женский'
    : data.gender || null;
  const fullName = [data.surname, data.name, data.patronymic].filter(Boolean).join(' ') || '—';
  const fullNameEn = [data.surnameEn, data.nameEn].filter((s) => s && s.trim()).join(' ') || null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{fullName}</div>
          <div className="text-sm text-gray-400">{data.phone} · верифицирован MyID</div>
        </div>
      </div>

      {/* Personal */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Персональные данные
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          <Field label="ФИО (кирилл.)" value={fullName} />
          <Field label="ФИО (латин.)" value={fullNameEn} />
          <Field label="ПИНФЛ" value={data.pinfl} />
          <Field label="Дата рождения" value={data.birthDate?.slice(0, 10)} />
          <Field label="Место рождения" value={data.birthPlace} />
          <Field label="Пол" value={genderLabel} />
          <Field label="Национальность" value={data.nationality} />
          <Field label="Гражданство" value={data.citizenship} />
          <Field label="Адрес прописки" value={data.address} />
        </div>
      </section>

      {/* Passport */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Паспортные данные
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          {passport ? (
            <>
              <Field label="Серия / номер" value={`${passport.series ?? ''} ${passport.number ?? ''}`.trim()} />
              <Field label="ПИНФЛ (документ)" value={passport.pinfl} />
              <Field label="Дата выдачи" value={passport.issuedAt?.slice(0, 10)} />
              <Field label="Выдан" value={passport.issuedBy} />
              <Field label="Действует до" value={passport.expiresAt?.slice(0, 10)} />
              <Field label="Статус" value={passport.status} />
            </>
          ) : (
            <div className="py-3 text-sm text-gray-400 italic">Паспорт не найден</div>
          )}
        </div>
      </section>

      {/* Technical */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Технические данные
        </h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          <Field label="ID пользователя" value={data.id} />
          <Field label="Статус верификации" value={data.verificationStatus} />
          <Field label="Дата регистрации" value={new Date(data.createdAt).toLocaleString('ru')} />
          <div className="py-2.5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              myidRaw (сырой ответ API)
            </div>
            <RawJsonBlock data={data.myidRaw} />
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyIdTestPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: users, isLoading } = useVerifiedUsers();

  return (
    <div className="flex h-full">
      {/* Left: users list */}
      <div className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-600" />
            <h1 className="font-semibold text-gray-900 text-sm">MyID верификация</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Тест-страница для просмотра данных от MyID
          </p>
        </div>

        {isLoading && (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">Загрузка...</div>
        )}

        {!isLoading && users?.length === 0 && (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">
            Нет верифицированных пользователей
          </div>
        )}

        <div className="py-2">
          {users?.map((u) => {
            const name = [u.surname, u.name].filter(Boolean).join(' ') || u.phone;
            const active = selectedId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${
                  active ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                  <div className="text-xs text-gray-400 truncate">{u.phone}</div>
                  {u.pinfl && (
                    <div className="text-xs text-gray-300 font-mono">ПИНФЛ: {u.pinfl}</div>
                  )}
                </div>
                {active && <Eye size={14} className="text-green-600 shrink-0 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: detail panel */}
      <div className="flex-1 overflow-y-auto">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
            <User size={40} strokeWidth={1.2} />
            <span className="text-sm">Выберите пользователя слева</span>
          </div>
        ) : (
          <UserDetailPanel userId={selectedId} />
        )}
      </div>
    </div>
  );
}
