'use client';

import { useState } from 'react';
import { useAiUsage } from '@/lib/admin-hooks';

const FEATURE_LABEL: Record<string, string> = {
  triage_ask: 'Триаж · вопрос',
  triage_finalize: 'Триаж · итог',
  euro_voice: 'Европротокол · голос',
};
const featureLabel = (f: string) => FEATURE_LABEL[f] ?? f;

const fmt = (n: number) => n.toLocaleString('ru-RU');

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-gray-400">{sub}</div> : null}
    </div>
  );
}

export default function AiUsagePage() {
  const [page, setPage] = useState(1);
  const [feature, setFeature] = useState('');
  const { data, isLoading } = useAiUsage(page, feature);

  const s = data?.summary;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">AI-лог</h1>
      <p className="text-sm text-gray-500 mb-6">Все запросы к ИИ (Gemini): расход токенов, время ответа, статус.</p>

      {/* Сводка */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Всего запросов" value={s ? fmt(s.calls) : '—'} />
        <Stat label="Всего токенов" value={s ? fmt(s.totalTokens) : '—'} sub="prompt + output" />
        <Stat label="Входные токены" value={s ? fmt(s.promptTokens) : '—'} />
        <Stat label="Выходные токены" value={s ? fmt(s.outputTokens) : '—'} />
      </div>

      {/* По фичам */}
      {s && s.byFeature.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
          <div className="text-sm font-medium mb-3">По функциям</div>
          <div className="space-y-2">
            {s.byFeature.map((f) => {
              const pct = s.totalTokens ? Math.round((f.tokens / s.totalTokens) * 100) : 0;
              return (
                <div key={f.feature} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-sm">{featureLabel(f.feature)}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-28 shrink-0 text-right text-sm text-gray-600">
                    {fmt(f.tokens)} <span className="text-gray-400">· {fmt(f.calls)}×</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Фильтр по фиче */}
      <div className="flex flex-wrap gap-2 mb-3">
        {['', 'triage_ask', 'triage_finalize', 'euro_voice'].map((f) => (
          <button
            key={f || 'all'}
            onClick={() => {
              setFeature(f);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              feature === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {f ? featureLabel(f) : 'Все'}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Время</th>
                <th className="px-4 py-3 font-medium">Функция</th>
                <th className="px-4 py-3 font-medium">Модель</th>
                <th className="px-4 py-3 font-medium text-right">Вход</th>
                <th className="px-4 py-3 font-medium text-right">Выход</th>
                <th className="px-4 py-3 font-medium text-right">Всего</th>
                <th className="px-4 py-3 font-medium text-right">Время</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Загрузка…
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(it.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{featureLabel(it.feature)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{it.model}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(it.promptTokens)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(it.outputTokens)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(it.totalTokens)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(it.latencyMs)} мс</td>
                    <td className="px-4 py-3">
                      {it.ok ? (
                        <span className="text-green-600">OK</span>
                      ) : (
                        <span className="text-red-600" title={it.error ?? ''}>
                          Ошибка
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Пока нет запросов к ИИ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {data && pages > 1 ? (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Стр. {data.page} из {pages} · всего {fmt(data.total)}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40"
            >
              Назад
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
