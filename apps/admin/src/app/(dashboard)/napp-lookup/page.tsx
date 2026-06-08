'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, UserSearch, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PersonDoc {
  document: string;
  type: string;
  docgiveplace: string;
  datebegin: string;
  dateend: string | null;
  status: number;
}
interface PersonInfo {
  currentPinfl: string;
  currentDocument: string;
  documents: PersonDoc[];
  lastNameLatin: string;
  firstNameLatin: string;
  middleNameLatin: string;
  engName?: string;
  engSurname?: string;
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  gender: string;
  address: string;
  regionId: number;
  districtId: number;
}
interface Envelope {
  error: number;
  error_message: string;
  result: PersonInfo | null;
}

type Mode = 'passport' | 'pinfl';

// ─── UI ──────────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div className="grid grid-cols-[180px_1fr] gap-x-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-5">{label}</span>
      <span className="text-sm text-gray-900 font-mono break-all leading-5">
        {isEmpty ? <span className="text-gray-300 italic">—</span> : value}
      </span>
    </div>
  );
}

function RawJsonBlock({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
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

function PersonCard({ p }: { p: PersonInfo }) {
  const fio = [p.lastNameLatin, p.firstNameLatin, p.middleNameLatin].filter(Boolean).join(' ');
  const gender = p.gender === '1' ? 'Мужской' : p.gender === '2' ? 'Женский' : p.gender;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Личные данные</h3>
        <div className="bg-white border border-gray-100 rounded-2xl px-4">
          <Field label="ФИО (латин.)" value={fio} />
          <Field label="ФИО (eng)" value={[p.engSurname, p.engName].filter(Boolean).join(' ') || null} />
          <Field label="ПИНФЛ" value={p.currentPinfl} />
          <Field label="Текущий документ" value={p.currentDocument} />
          <Field label="Дата рождения" value={p.birthDate?.slice(0, 10)} />
          <Field label="Место рождения" value={p.birthPlace} />
          <Field label="Страна рождения" value={p.birthCountry} />
          <Field label="Пол" value={gender} />
          <Field label="Регион / район" value={`${p.regionId} / ${p.districtId}`} />
          <Field label="Адрес" value={p.address} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Документы ({p.documents?.length ?? 0})
        </h3>
        <div className="space-y-2">
          {p.documents?.map((d, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-gray-900">{d.document}</span>
                <span
                  className={`text-[11px] rounded px-1.5 py-0.5 ${
                    d.status === 2 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {d.status === 2 ? 'действующий' : `статус ${d.status}`}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{d.docgiveplace}</div>
              <div className="text-xs text-gray-400">
                {d.datebegin?.slice(0, 10)} → {d.dateend?.slice(0, 10) ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <RawJsonBlock data={p} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NappLookupPage() {
  const [mode, setMode] = useState<Mode>('passport');
  const [document, setDocument] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [pinfl, setPinfl] = useState('');

  const mutation = useMutation<Envelope, Error>({
    mutationFn: async () => {
      if (mode === 'passport') {
        return api
          .post('/admin/napp/lookup/passport', { document: document.trim(), birthDate: birthDate.trim() })
          .then((r) => r.data);
      }
      return api
        .post('/admin/napp/lookup/pinfl', { pinfl: pinfl.trim(), document: document.trim() })
        .then((r) => r.data);
    },
  });

  const env = mutation.data;
  const notFound = env && (env.error !== 0 || !env.result);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserSearch size={18} className="text-red-600" />
        <h1 className="font-semibold text-gray-900">Пробить человека по базе НАПП</h1>
      </div>
      <p className="text-sm text-gray-400 -mt-3">
        Админ-инструмент. Данные берутся из гос. реестра населения (ГБДФЛ) через НАПП. В клиентском приложении
        данные человека приходят через MyID.
      </p>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(['passport', 'pinfl'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === m ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m === 'passport' ? 'По паспорту + дате рождения' : 'По ПИНФЛ'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        {mode === 'passport' ? (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Серия + номер паспорта</span>
              <input
                value={document}
                onChange={(e) => setDocument(e.target.value.toUpperCase())}
                placeholder="AC2523171"
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Дата рождения</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">ПИНФЛ</span>
              <input
                value={pinfl}
                onChange={(e) => setPinfl(e.target.value)}
                placeholder="50501015120024"
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Любой документ (серия+номер)</span>
              <input
                value={document}
                onChange={(e) => setDocument(e.target.value.toUpperCase())}
                placeholder="AC2523171"
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </label>
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 text-sm bg-red-600 text-white rounded-lg px-5 py-2.5 font-medium hover:bg-red-700 disabled:opacity-50"
        >
          <Search size={15} />
          {mutation.isPending ? 'Запрос в НАПП...' : 'Пробить'}
        </button>
      </div>

      {/* Result */}
      {mutation.isError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          <AlertCircle size={16} /> Ошибка запроса. Проверьте данные и попробуйте снова.
        </div>
      )}
      {notFound && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
          <AlertCircle size={16} /> {env?.error_message || 'Данных по предоставленным параметрам не найдено'}
        </div>
      )}
      {env?.result && <PersonCard p={env.result} />}
    </div>
  );
}
