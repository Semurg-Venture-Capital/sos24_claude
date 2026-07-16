'use client';

import { useState } from 'react';
import { useAlcoTests } from '@/lib/admin-hooks';

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString('ru-RU') : '—');

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'red' }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === 'red' ? 'text-red-600' : ''}`}>{value}</div>
    </div>
  );
}

export default function AlcoTestsPage() {
  const [page, setPage] = useState(1);
  const [positive, setPositive] = useState('');
  const { data, isLoading } = useAlcoTests(page, positive);
  const [photo, setPhoto] = useState<string | null>(null);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-2xl font-semibold mb-1">Алкотесты</h1>
      <p className="text-sm text-gray-500 mb-6">
        Данные с алкотестера Alcostop 8000S (пред-/послерейсовый осмотр): значение, время, водитель, фото.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Всего тестов" value={data ? String(data.summary.total) : '—'} />
        <Stat label="Положительных" value={data ? String(data.summary.positive) : '—'} tone="red" />
      </div>

      {/* Фильтр */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { v: '', label: 'Все' },
          { v: 'true', label: 'Положительные' },
          { v: 'false', label: 'Годен' },
        ].map((f) => (
          <button
            key={f.v || 'all'}
            onClick={() => {
              setPositive(f.v);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              positive === f.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Время теста</th>
                <th className="px-4 py-3 font-medium">Госномер</th>
                <th className="px-4 py-3 font-medium">Значение</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Водитель</th>
                <th className="px-4 py-3 font-medium">Оператор</th>
                <th className="px-4 py-3 font-medium">Прибор</th>
                <th className="px-4 py-3 font-medium">Фото</th>
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
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtDate(it.checkDateTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{it.carLicense || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{it.checkValue || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {it.positive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Положительно
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          Годен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{it.driverName || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {it.officerName || it.officerId || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">{it.deviceType || '—'}</td>
                    <td className="px-4 py-3">
                      {it.photoUrl ? (
                        <button onClick={() => setPhoto(it.photoUrl)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.photoUrl}
                            alt="фото"
                            className="h-11 w-14 rounded-md object-cover border border-gray-200 hover:opacity-80"
                          />
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Пока нет тестов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {data ? (
        <div className="flex items-center justify-between mt-4 mb-2 text-sm">
          <span className="text-gray-500">
            Стр. {data.page} из {pages} · всего: {data.total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              Вперёд
            </button>
          </div>
        </div>
      ) : null}

      {/* Просмотр фото на весь экран */}
      {photo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="фото теста" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      ) : null}
    </div>
  );
}
