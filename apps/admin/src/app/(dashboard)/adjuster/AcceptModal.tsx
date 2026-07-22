'use client';

import { useState } from 'react';
import { X, UserCheck, UserPlus, Plus } from 'lucide-react';
import { useAdjusterUsers, useCreateAdjusterUser } from '@/lib/admin-hooks';

type Mode = 'system' | 'manual';

interface Props {
  onConfirm: (data: {
    adjusterNote?: string;
    assignedAdjusterId?: string;
    adjusterName?: string;
    adjusterPhone?: string;
  }) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function AcceptModal({ onConfirm, onCancel, isPending }: Props) {
  const [mode, setMode] = useState<Mode>('system');

  // System adjuster
  const [selectedId, setSelectedId] = useState('');

  // Manual adjuster
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Common
  const [note, setNote] = useState('');

  // Add new adjuster to system
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addSurname, setAddSurname] = useState('');
  const [addPhone, setAddPhone] = useState('');

  const { data: adjusterUsers = [], isLoading: loadingUsers } = useAdjusterUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateAdjusterUser();

  const handleAddAdjuster = () => {
    if (!addName.trim() || !addPhone.trim()) return;
    createUser(
      { name: addName.trim(), surname: addSurname.trim() || undefined, phone: addPhone.trim() },
      {
        onSuccess: (user: any) => {
          setSelectedId(user.id);
          setShowAdd(false);
          setAddName(''); setAddSurname(''); setAddPhone('');
        },
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'system') {
      if (!selectedId) return;
      onConfirm({ assignedAdjusterId: selectedId, adjusterNote: note.trim() || undefined });
    } else {
      if (!manualName.trim()) return;
      onConfirm({
        adjusterName: manualName.trim(),
        adjusterPhone: manualPhone.trim() || undefined,
        adjusterNote: note.trim() || undefined,
      });
    }
  };

  const canSubmit = mode === 'system' ? !!selectedId : manualName.trim().length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(20,20,40,0.07)]">
          <div>
            <h2 className="text-base font-semibold text-[#151515]">Назначить специалиста</h2>
            <p className="text-xs text-[#9a9a9a] mt-0.5">Выберите специалиста для выезда</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9a9a9a] hover:bg-[#f4f4f6] transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-[#f4f4f6] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode('system')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-colors ${
                mode === 'system' ? 'bg-white text-[#151515] shadow-sm' : 'text-[#9a9a9a]'
              }`}
            >
              <UserCheck size={12} />
              Из системы
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-colors ${
                mode === 'manual' ? 'bg-white text-[#151515] shadow-sm' : 'text-[#9a9a9a]'
              }`}
            >
              <UserPlus size={12} />
              Вручную
            </button>
          </div>

          {/* System mode */}
          {mode === 'system' && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wide">
                Специалист <span className="text-[#e61428]">*</span>
              </label>

              {loadingUsers ? (
                <div className="h-10 bg-[#f0f0f2] rounded-xl animate-pulse" />
              ) : adjusterUsers.length === 0 ? (
                <div className="text-sm text-[#9a9a9a] text-center py-3">
                  Нет зарегистрированных специалистов
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {adjusterUsers.map((u) => {
                    const name = [u.surname, u.name].filter(Boolean).join(' ') || u.name || '—';
                    const active = selectedId === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedId(u.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border ${
                          active
                            ? 'border-[rgba(230,20,40,0.3)] bg-[rgba(230,20,40,0.04)]'
                            : 'border-[rgba(20,20,40,0.08)] hover:bg-[#f8f8f8]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          active ? 'bg-[#e61428] text-white' : 'bg-[#f0f0f2] text-[#5f5e5e]'
                        }`}>
                          {name[0] ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#151515] truncate">{name}</p>
                          <p className="text-xs text-[#9a9a9a]">{u.phone ?? '—'}</p>
                        </div>
                        {active && (
                          <div className="w-4 h-4 rounded-full bg-[#e61428] flex items-center justify-center shrink-0">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 4l2 2 4-4" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Add new adjuster */}
              {!showAdd ? (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 text-xs text-[#3670d4] hover:text-[#1a4fa0] transition-colors"
                >
                  <Plus size={12} />
                  Добавить нового специалиста
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-3 bg-[#f8f8f8] rounded-xl border border-[rgba(20,20,40,0.08)]">
                  <p className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wide">Новый специалист</p>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Имя *"
                    className="h-9 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] text-sm outline-none focus:border-[#e61428]"
                  />
                  <input
                    value={addSurname}
                    onChange={(e) => setAddSurname(e.target.value)}
                    placeholder="Фамилия"
                    className="h-9 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] text-sm outline-none focus:border-[#e61428]"
                  />
                  <input
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="Телефон +998… *"
                    type="tel"
                    className="h-9 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] text-sm outline-none focus:border-[#e61428]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="flex-1 h-8 rounded-lg border border-[rgba(20,20,40,0.12)] text-xs text-[#5f5e5e] hover:bg-white transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAdjuster}
                      disabled={isCreating || !addName.trim() || !addPhone.trim()}
                      className="flex-1 h-8 rounded-lg bg-[#151515] text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                    >
                      {isCreating ? 'Добавляем...' : 'Добавить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual mode */}
          {mode === 'manual' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wide">
                  ФИО <span className="text-[#e61428]">*</span>
                </label>
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Иван Иванов"
                  autoFocus
                  className="h-10 px-3 rounded-xl border border-[rgba(20,20,40,0.12)] text-sm text-[#151515] outline-none focus:border-[#e61428] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wide">
                  Телефон
                </label>
                <input
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="+998901234567"
                  type="tel"
                  className="h-10 px-3 rounded-xl border border-[rgba(20,20,40,0.12)] text-sm text-[#151515] outline-none focus:border-[#e61428] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Common: note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wide">
              Примечание диспетчера
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Будет через 20 мин..."
              rows={2}
              className="px-3 py-2 rounded-xl border border-[rgba(20,20,40,0.12)] text-sm text-[#151515] outline-none focus:border-[#e61428] transition-colors resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border border-[rgba(20,20,40,0.12)] text-sm font-medium text-[#5f5e5e] hover:bg-[#f4f4f6] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="flex-1 h-10 rounded-xl bg-[#e61428] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#c0101f] transition-colors"
            >
              {isPending ? 'Назначаем...' : 'Назначить и принять'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
