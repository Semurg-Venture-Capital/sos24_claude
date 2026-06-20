'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const TYPES = [
  { value: 'SYSTEM', label: 'Системное' },
  { value: 'PROMO', label: 'Акция / промо' },
  { value: 'POLICY_EXPIRING', label: 'Истечение полиса' },
] as const;

export default function NotificationsAdminPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<string>('SYSTEM');
  const [result, setResult] = useState<string | null>(null);

  const broadcast = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ recipients: number }>('/admin/notifications/broadcast', { title, body, type });
      return data;
    },
    onSuccess: (data) => {
      setResult(`Отправлено: ${data.recipients} получателям`);
      setTitle('');
      setBody('');
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setResult(`Ошибка: ${Array.isArray(msg) ? msg.join(', ') : msg ?? 'не удалось отправить'}`);
    },
  });

  const canSend = title.trim().length >= 2 && body.trim().length >= 2 && !broadcast.isPending;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Уведомления</h1>
      <p className="text-sm text-gray-500 mb-6">Рассылка уведомления всем пользователям (in-app + push).</p>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Тип</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Заголовок</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Напр. Скидка 10% на КАСКО"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Текст</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Текст уведомления…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{body.length}/500</div>
        </div>

        <button
          onClick={() => {
            setResult(null);
            broadcast.mutate();
          }}
          disabled={!canSend}
          className="rounded-lg bg-[#E61428] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {broadcast.isPending ? 'Отправка…' : 'Отправить всем'}
        </button>

        {result && (
          <div className={`text-sm ${result.startsWith('Ошибка') ? 'text-red-600' : 'text-green-700'}`}>{result}</div>
        )}
      </div>
    </div>
  );
}
