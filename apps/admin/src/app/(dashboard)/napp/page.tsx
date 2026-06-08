'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { NAPP_TOOLS, NAPP_GROUPS, findTool, FIELD_LABELS, type NappTool } from '@/lib/nappTools';
import { Search, AlertCircle, ChevronDown, ChevronRight, Radar } from 'lucide-react';

// ─── Универсальный рендер значения результата ──────────────────────────────────

function prettify(key: string, value: unknown): string {
  if (key === 'gender') return value === '1' ? 'Мужской' : value === '2' ? 'Женский' : String(value);
  if (key === 'isPensioner') return value === 1 || value === '1' ? 'Да' : 'Нет';
  if (key === 'fund' && typeof value === 'number') return `${value.toLocaleString('ru')} сум`;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

function label(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function Row({ k, value }: { k: string; value: unknown }) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div className="grid grid-cols-[200px_1fr] gap-x-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-5">{label(k)}</span>
      <span className="text-sm text-gray-900 font-mono break-all leading-5">
        {isEmpty ? <span className="text-gray-300 italic">—</span> : prettify(k, value)}
      </span>
    </div>
  );
}

function DocCard({ doc }: { doc: Record<string, unknown> }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono font-medium text-gray-900">{String(doc.document ?? doc.pNumber ?? '—')}</span>
        {'status' in doc && (
          <span
            className={`text-[11px] rounded px-1.5 py-0.5 ${
              doc.status === 2 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {doc.status === 2 ? 'действующий' : `статус ${String(doc.status)}`}
          </span>
        )}
      </div>
      {'docgiveplace' in doc && <div className="text-xs text-gray-400 mt-1">{String(doc.docgiveplace)}</div>}
      {('datebegin' in doc || 'dateend' in doc) && (
        <div className="text-xs text-gray-400">
          {String(doc.datebegin ?? '').slice(0, 10)} → {doc.dateend ? String(doc.dateend).slice(0, 10) : '—'}
        </div>
      )}
    </div>
  );
}

// Рендер объекта: скаляры → строки, массивы объектов → карточки, вложенные объекты → подсекции.
function ObjectView({ obj }: { obj: Record<string, unknown> }) {
  const scalars: [string, unknown][] = [];
  const sections: { key: string; node: React.ReactNode }[] = [];

  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      if (v.length === 0) {
        scalars.push([k, '— (пусто)']);
      } else if (typeof v[0] === 'object' && v[0] !== null) {
        sections.push({
          key: k,
          node: (
            <div className="space-y-2">
              {v.map((item, i) => (
                <DocCard key={i} doc={item as Record<string, unknown>} />
              ))}
            </div>
          ),
        });
      } else {
        scalars.push([k, v.join(', ')]);
      }
    } else if (v !== null && typeof v === 'object') {
      sections.push({ key: k, node: <ObjectView obj={v as Record<string, unknown>} /> });
    } else {
      scalars.push([k, v]);
    }
  }

  return (
    <div className="space-y-5">
      {scalars.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          {scalars.map(([k, v]) => (
            <Row key={k} k={k} value={v} />
          ))}
        </div>
      )}
      {sections.map((s) => (
        <section key={s.key}>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label(s.key)}</h4>
          {s.node}
        </section>
      ))}
    </div>
  );
}

function RawJson({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {open ? 'Скрыть сырой ответ' : 'Показать сырой ответ'}
      </button>
      {open && (
        <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-96 text-gray-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── Инструмент: форма + результат (перемонтируется по tool.key) ────────────────

interface Envelope {
  error: number;
  error_message: string;
  result: Record<string, unknown> | null;
}

function ToolPanel({ tool }: { tool: NappTool }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const mutation = useMutation<Envelope, Error>({
    mutationFn: () =>
      api.post(`/admin/napp/lookup/${tool.endpoint}`, values).then((r) => r.data),
  });

  const env = mutation.data;
  const notFound = env && (env.error !== 0 || !env.result);
  const canSubmit = tool.fields.filter((f) => !f.optional).every((f) => (values[f.name] ?? '').trim());

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Radar size={18} className="text-red-600" />
        <h1 className="font-semibold text-gray-900">{tool.label}</h1>
      </div>
      {tool.hint && <p className="text-sm text-gray-400 mb-4">{tool.hint}</p>}

      {/* Форма */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {tool.fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-xs font-medium text-gray-500">
                {f.label}
                {f.optional && <span className="text-gray-300"> (необяз.)</span>}
              </span>
              <input
                type={f.type === 'date' ? 'date' : 'text'}
                value={values[f.name] ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.name]: f.upper ? e.target.value.toUpperCase() : e.target.value }))
                }
                placeholder={f.placeholder}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </label>
          ))}
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canSubmit}
          className="flex items-center gap-2 text-sm bg-red-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-red-700 disabled:opacity-50"
        >
          <Search size={15} />
          {mutation.isPending ? 'Запрос в НАПП...' : 'Пробить'}
        </button>
      </div>

      {/* Результат */}
      <div className="mt-5 space-y-4">
        {mutation.isError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={16} /> Ошибка запроса. Проверьте поля и попробуйте снова.
          </div>
        )}
        {notFound && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
            <AlertCircle size={16} /> {env?.error_message || 'Данных по предоставленным параметрам не найдено'}
          </div>
        )}
        {env?.result && (
          <>
            <ObjectView obj={env.result} />
            <RawJson data={env.result} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Рабочее место «Отдел NAPP» ────────────────────────────────────────────────

function NappWorkspace() {
  const sp = useSearchParams();
  const active = findTool(sp.get('tool'));

  return (
    <div className="flex h-full">
      {/* Левое подменю инструментов */}
      <div className="w-64 shrink-0 border-r border-gray-100 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Radar size={16} className="text-red-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Отдел NAPP</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">Инструменты пробивки данных</p>
        </div>
        <nav className="py-2">
          {NAPP_GROUPS.map((group) => (
            <div key={group} className="mb-1">
              <div className="px-5 pt-3 pb-1 text-[10px] font-semibold text-gray-300 uppercase tracking-widest">
                {group}
              </div>
              {NAPP_TOOLS.filter((t) => t.group === group).map((t) => {
                const isActive = t.key === active.key;
                return (
                  <Link
                    key={t.key}
                    href={`/napp?tool=${t.key}`}
                    className={`block px-5 py-2 text-sm transition-colors ${
                      isActive ? 'bg-red-50 text-red-700 font-medium border-r-2 border-red-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Рабочая область инструмента */}
      <div className="flex-1 overflow-y-auto p-6">
        <ToolPanel key={active.key} tool={active} />
      </div>
    </div>
  );
}

export default function NappPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Загрузка...</div>}>
      <NappWorkspace />
    </Suspense>
  );
}
