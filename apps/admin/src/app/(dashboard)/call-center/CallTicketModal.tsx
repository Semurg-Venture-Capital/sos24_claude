'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Check } from 'lucide-react';
import { callcenterApi, type Call } from '@/lib/callcenter';
import { formatPhone } from '@/lib/utils';

const CATEGORIES = [
  { value: 'OTHER', label: 'Другое' },
  { value: 'POLICY', label: 'Полисы' },
  { value: 'PAYMENT', label: 'Оплата' },
  { value: 'ACCIDENT', label: 'ДТП / страховой случай' },
  { value: 'ACCOUNT', label: 'Аккаунт' },
];

// Заявка по звонку: создать обращение поддержки для определённого клиента и/или
// сохранить заметку оператора. Привязывается к звонку (омниканальность с Поддержкой).
export function CallTicketModal({ call, onClose }: { call: Call; onClose: () => void }) {
  const qc = useQueryClient();
  const hasUser = !!call.user;
  const [category, setCategory] = useState('OTHER');
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState(call.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const refresh = () => qc.invalidateQueries({ queryKey: ['cc', 'calls'] });

  const createTicket = async () => {
    setBusy(true);
    setError('');
    try {
      await callcenterApi.createTicket(call.id, { category, subject: subject.trim() || undefined, note: note.trim() || undefined });
      setDone('Заявка создана и привязана к звонку');
      refresh();
      setTimeout(onClose, 1200);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Не удалось создать заявку');
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setBusy(true);
    setError('');
    try {
      await callcenterApi.attachTicket(call.id, { note: note.trim() });
      setDone('Заметка сохранена');
      refresh();
      setTimeout(onClose, 1000);
    } catch {
      setError('Не удалось сохранить заметку');
    } finally {
      setBusy(false);
    }
  };

  const who = call.user ? [call.user.surname, call.user.name].filter(Boolean).join(' ') || call.user.phone : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(20,20,40,0.08)]">
          <h2 className="text-sm font-semibold text-[#151515]">Заявка по звонку</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f0f2]">
            <X size={16} className="text-[#5f5e5e]" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="text-sm">
            <span className="text-[#9a9a9a]">Клиент: </span>
            {who ? (
              <span className="text-[#151515] font-medium">{who}{call.externalNumber ? ` · ${formatPhone(call.externalNumber)}` : ''}</span>
            ) : (
              <span className="text-[#9a9a9a]">не определён{call.externalNumber ? ` (${formatPhone(call.externalNumber)})` : ''}</span>
            )}
          </div>

          {call.ticketId ? (
            <p className="text-sm text-[#0a9466] bg-[rgba(52,211,153,0.1)] rounded-lg px-3 py-2">К звонку уже привязана заявка.</p>
          ) : hasUser ? (
            <>
              <Field label="Категория">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Тема (необязательно)">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Кратко суть обращения" className="w-full h-10 px-3 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20" />
              </Field>
            </>
          ) : (
            <p className="text-xs text-[#9a9a9a]">Клиент не определён по номеру — заявку создать нельзя, но можно сохранить заметку по звонку.</p>
          )}

          <Field label="Заметка оператора">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Что обсудили / что нужно сделать" className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20 resize-y" />
          </Field>

          {error && <p className="text-xs text-[#e61428]">{error}</p>}
          {done && <p className="text-xs text-[#0a9466] inline-flex items-center gap-1"><Check size={13} /> {done}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(20,20,40,0.08)]">
          <button onClick={saveNote} disabled={busy} className="h-9 px-4 rounded-xl text-sm text-[#5f5e5e] hover:bg-[#f0f0f2] transition-colors disabled:opacity-50">
            Только заметка
          </button>
          {hasUser && !call.ticketId && (
            <button onClick={createTicket} disabled={busy} className="h-9 px-4 rounded-xl text-sm bg-[#e61428] text-white hover:bg-[#c01020] disabled:opacity-50 transition-colors">
              {busy ? 'Создаём…' : 'Создать заявку'}
            </button>
          )}
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
