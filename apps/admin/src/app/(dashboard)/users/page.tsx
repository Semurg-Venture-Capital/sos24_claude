'use client';

import { useState } from 'react';
import { useUsers } from '@/lib/admin-hooks';
import { Header } from '@/components/layout/Header';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react';
import { formatDate, formatPhone } from '@/lib/utils';
import { UserFormModal, ROLE_OPTIONS, type EditUser } from './UserFormModal';

const ROLE_LABEL: Record<string, string> = {
  USER: 'Пользователь',
  ADMIN: 'Администратор',
  ADJUSTER: 'Аджастер',
  SUPPORT: 'Поддержка',
  PARTNER: 'Партнёр',
};
const ROLE_STYLE: Record<string, string> = {
  USER: 'bg-[rgba(20,20,40,0.06)] text-[#5f5e5e]',
  ADMIN: 'bg-[rgba(230,20,40,0.1)] text-[#e61428]',
  ADJUSTER: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  SUPPORT: 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]',
  PARTNER: 'bg-[rgba(245,200,80,0.2)] text-[#9a7400]',
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('');
  const [role, setRole] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<EditUser | null>(null);

  const { data, isLoading } = useUsers(page, 20, search, verified, role);
  const total: number = data?.total ?? 0;
  const users: any[] = data?.users ?? [];
  const totalPages = Math.ceil(total / 20);

  const applySearch = () => { setSearch(searchInput); setPage(1); };
  const openCreate = () => { setEditUser(null); setModalOpen(true); };
  const openEdit = (u: any) => {
    setEditUser({ id: u.id, phone: u.phone, role: u.role, name: u.name, surname: u.surname, patronymic: u.patronymic, ownedCompany: u.ownedCompany, ownedPartner: u.ownedPartner, sipExtension: u.sipExtension });
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Пользователи" subtitle={isLoading ? 'Загрузка...' : `${total} записей`} />

      <main className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl px-3 h-9 flex-1 max-w-xs">
            <Search size={14} className="text-[#9a9a9a] shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Поиск по телефону или имени..."
              className="flex-1 text-sm outline-none bg-transparent text-[#151515] placeholder:text-[#c0c0c0]"
            />
          </div>

          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] outline-none"
          >
            <option value="">Все роли</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            value={verified}
            onChange={(e) => { setVerified(e.target.value); setPage(1); }}
            className="h-9 px-3 bg-white border border-[rgba(20,20,40,0.1)] rounded-xl text-sm text-[#5f5e5e] outline-none"
          >
            <option value="">Все статусы</option>
            <option value="true">Верифицированные</option>
            <option value="false">Не верифицированные</option>
          </select>

          <button
            onClick={openCreate}
            className="ml-auto h-9 px-3.5 bg-[#e61428] text-white rounded-xl text-sm flex items-center gap-2 hover:bg-[#c01020] transition-colors"
          >
            <Plus size={15} /> Создать пользователя
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(20,20,40,0.06)]">
                {['Пользователь', 'Телефон', 'Верификация', 'Полисов', 'Роль', 'Зарегистрирован', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-[#f0f0f2] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => {
                const fullName = [u.surname, u.name, u.patronymic].filter(Boolean).join(' ');
                const verifiedFlag = u.verificationStatus === 'MYID_VERIFIED';
                return (
                  <tr key={u.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f0f0f2] flex items-center justify-center text-xs font-semibold text-[#5f5e5e] shrink-0">
                          {fullName ? fullName[0] : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#151515]">{fullName || '—'}</p>
                          <p className="text-xs text-[#9a9a9a]">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{formatPhone(u.phone)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${verifiedFlag ? 'bg-[rgba(52,211,153,0.1)] text-[#0a9466]' : 'bg-[rgba(20,20,40,0.06)] text-[#9a9a9a]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${verifiedFlag ? 'bg-[#34d399]' : 'bg-[#c0c0c0]'}`} />
                        {verifiedFlag ? 'MyID верифицирован' : 'Не верифицирован'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#151515]">{u._count?.policies ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${ROLE_STYLE[u.role] ?? ROLE_STYLE.USER}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#9a9a9a]">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-[#5f5e5e] hover:bg-[#f0f0f2] transition-colors"
                      >
                        <Pencil size={13} /> Изменить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(20,20,40,0.06)]">
              <p className="text-xs text-[#9a9a9a]">Страница {page} из {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg border border-[rgba(20,20,40,0.1)] flex items-center justify-center disabled:opacity-40 hover:bg-[#f8f8f8] transition-colors">
                  <ChevronLeft size={14} className="text-[#5f5e5e]" />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-lg border border-[rgba(20,20,40,0.1)] flex items-center justify-center disabled:opacity-40 hover:bg-[#f8f8f8] transition-colors">
                  <ChevronRight size={14} className="text-[#5f5e5e]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <UserFormModal open={modalOpen} onClose={() => setModalOpen(false)} user={editUser} />
    </div>
  );
}
