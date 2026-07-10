'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useEuroProtocol, useUpdateEuroStatus } from '@/lib/admin-hooks';
import {
  ALL_STATUSES,
  DRIVER_ROLE_LABEL,
  EURO_CIRCUMSTANCES,
  euroFullName,
  PHOTO_SLOT_LABEL,
  SCHEME_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  type EuroMediaMeta,
  type EuroStatus,
} from '@/lib/euro';

function yn(v?: boolean | null): string {
  return v === true ? 'Да' : v === false ? 'Нет' : '—';
}

const ZONE: Record<string, string> = {
  front: 'Перёд', rear: 'Зад', left: 'Левый бок', right: 'Правый бок',
  'front-left': 'Перёд-лево', 'front-right': 'Перёд-право', 'rear-left': 'Зад-лево', 'rear-right': 'Зад-право',
};
function zone(code?: string | null): string {
  return code ? ZONE[code] ?? code : '—';
}
function dlText(seria?: string | null, number?: string | null, categories?: string | null, issuedAt?: string | null): string {
  if (!seria && !number) return '—';
  return (
    `${seria ?? ''} ${number ?? ''}`.trim() +
    (categories ? ` · кат. ${categories}` : '') +
    (issuedAt ? ` · от ${formatDate(issuedAt)}` : '')
  );
}
function policyText(seria?: string | null, number?: string | null, valid?: boolean | null, until?: string | null): string {
  if (!seria && !number) return '—';
  return `${seria ?? ''} ${number ?? ''}`.trim() + (valid ? ' ✓' : '') + (until ? ` · до ${formatDate(until)}` : '');
}

export default function EuroprotocolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: p, isLoading } = useEuroProtocol(id);
  const [pdfLoading, setPdfLoading] = useState(false);

  const openPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await api.get(`/admin/europrotocols/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      alert('Не удалось сформировать PDF. Попробуйте ещё раз.');
    } finally {
      setPdfLoading(false);
    }
  };

  const otherVehicle = (p?.otherVehicleRaw as { modelName?: string; issueYear?: string; vehicleColor?: string } | null) ?? null;
  const photos = (p?.photos as EuroMediaMeta[] | null) ?? [];
  const circA = (p?.circumstancesA as boolean[] | null) ?? [];
  const circB = (p?.circumstancesB as boolean[] | null) ?? [];

  return (
    <>
      <Header title="Европротокол" subtitle={p?.number ?? '—'} />

      <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-16 space-y-5 max-w-6xl">
        {/* Назад + статус + PDF */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/europrotocols" className="text-sm text-[#9a9a9a] hover:text-[#151515]">
            ← К списку
          </Link>
          <div className="flex items-center gap-3">
            {p && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status as EuroStatus]}`}>
                {STATUS_LABEL[p.status as EuroStatus]}
              </span>
            )}
            <button
              onClick={openPdf}
              disabled={pdfLoading || !p}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#151515] hover:bg-black disabled:opacity-50 transition"
            >
              {pdfLoading ? 'Формируем…' : '↓ PDF извещения'}
            </button>
          </div>
        </div>

        {isLoading || !p ? (
          <div className="bg-white rounded-2xl border border-[#ececec] p-10 text-center text-[#9a9a9a]">
            Загрузка…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Обстоятельства */}
              <Section title="Обстоятельства ДТП">
                <Field label="Дата · время" value={`${formatDate(p.incidentDate)} · ${p.incidentTime}`} />
                <Field label="Место" value={p.place} />
                {p.lat && p.lng ? (
                  <Field
                    label="Координаты"
                    value={
                      <a
                        href={`https://maps.google.com/?q=${p.lat},${p.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3670d4] hover:underline"
                      >
                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)} ↗
                      </a>
                    }
                  />
                ) : null}
                <Field label="Схема" value={p.schemeType ? SCHEME_LABEL[p.schemeType] ?? p.schemeType : '—'} />
                <Field label="Кол-во ТС" value="2" />
                <VoiceField label="Описание (своими словами)" text={p.description} audioKey={p.descAudioKey} raw={p.descRaw} />
                <VoiceField label="Доп. замечания (оборот)" text={p.remarks} audioKey={p.remarksAudioKey} raw={p.remarksRaw} />
              </Section>

              {/* Общая часть */}
              <Section title="Общая часть бланка">
                <Field label="Медосвидетельствование" value={yn(p.medCheck)} />
                <Field label="Свидетели" value={p.witnesses} />
                <Field label="Оформлено сотрудником ИИО/ДЙҲХ" value={yn(p.officialRegistered)} />
                <Field label="№ нагрудного знака" value={p.officerBadgeNo} />
                <Field label="Кто за рулём (сторона A)" value={p.driverRole ? DRIVER_ROLE_LABEL[p.driverRole] ?? p.driverRole : '—'} />
                <Field label="ТС может двигаться" value={yn(p.canMove)} />
                {p.canMove === false ? <Field label="Место стоянки" value={p.cannotMovePlace} /> : null}
              </Section>

              {/* Сторона A */}
              {/* Стороны A и B — одинаковая структура полей */}
              <Section title="Сторона A · Заявитель" accent="#3670d4">
                <Field label="ФИО" value={euroFullName(p.user)} />
                <Field label="ПИНФЛ" value={p.user?.pinfl} />
                <Field label="Телефон" value={p.user?.phone} />
                <Field label="Адрес" value={p.user?.address} />
                <Field label="Авто" value={p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model}` : '—'} />
                <Field label="Госномер" value={p.vehicle?.plate} />
                <Field label="Вод. удостоверение" value={dlText(p.aDriverLicense?.series, p.aDriverLicense?.number, p.aDriverLicense?.categories, p.aDriverLicense?.issuedAt)} />
                <Field label="Страховщик" value={p.aOsago ? 'SOS24 Sugʻurta' : '—'} />
                <Field label="Полис ОСАГО" value={policyText(null, p.aOsago?.policyNumber, p.aOsago?.status === 'ACTIVE', p.aOsago?.endDate)} />
                <Field label="Зона удара" value={zone(p.impactZoneA)} />
                <Field label="Повреждения" value={p.damageDescA} />
                <Field label="Возражения" value={p.objectionsA} />
                <Field label="Док. о праве владения" value={p.ownershipDocA} />
                <Field label="Подпись (MyID)" value={p.signedAAt ? `Подписано ${formatDate(p.signedAAt)}` : p.selfVerified ? 'Подтверждён' : 'Нет'} />
              </Section>

              {/* Сторона B — та же структура */}
              <Section title="Сторона B · Второй участник" accent="#e61428">
                <Field label="ФИО" value={p.participant ? euroFullName(p.participant) : '—'} />
                <Field label="ПИНФЛ" value={p.participant?.pinfl} />
                <Field label="Телефон" value={p.otherPhone} />
                <Field label="Адрес" value={p.otherOwnerAddr} />
                <Field label="Авто" value={otherVehicle?.modelName ? [otherVehicle.modelName, otherVehicle.issueYear].filter(Boolean).join(' · ') : '—'} />
                <Field label="Госномер" value={p.otherGov} />
                <Field label="Вод. удостоверение" value={dlText(p.otherDlSeria, p.otherDlNumber, p.otherDlCategories, p.otherDlIssue)} />
                <Field label="Страховщик" value={p.otherInsurer} />
                <Field label="Полис ОСАГО" value={policyText(p.otherPolicySeria, p.otherPolicyNumber, p.otherPolicyValid, p.otherPolicyValidUntil)} />
                <Field label="Зона удара" value={zone(p.impactZoneB)} />
                <Field label="Повреждения" value={p.damageDescB} />
                <Field label="Возражения" value={p.objectionsB} />
                <Field label="Док. о праве владения" value={p.otherOwnershipDoc} />
                <Field label="Подпись (MyID)" value={p.signedBAt ? `Подписано ${formatDate(p.signedBAt)}` : 'Нет'} />
              </Section>
            </div>

            {/* Обстоятельства (22 чекбокса) */}
            <CircumstancesBlock a={circA} b={circB} />

            {/* Медиа: фото, видео, схема */}
            <MediaGallery photos={photos} schemeImageKey={p.schemeImageKey} />

            {/* Управление статусом */}
            <StatusManager
              id={id}
              current={p.status as EuroStatus}
              note={p.adminNote}
              onSaved={() => router.refresh()}
            />

            {/* Мета */}
            <div className="text-xs text-[#9a9a9a]">
              Создано {formatDate(p.createdAt)} · обновлено {formatDate(p.updatedAt)}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#ececec] p-5">
      <div className="flex items-center gap-2 mb-3">
        {accent && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />}
        <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">{title}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

// Поле с голосовой записью: текст (нормализованный/правленый) + плеер + сырой транскрипт.
function VoiceField({
  label,
  text,
  audioKey,
  raw,
}: {
  label: string;
  text?: string | null;
  audioKey?: string | null;
  raw?: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  useEffect(() => {
    if (!audioKey) {
      setUrl(null);
      return;
    }
    let alive = true;
    api
      .get('/files/presign-download', { params: { key: audioKey } })
      .then((r) => alive && setUrl(r.data.url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [audioKey]);

  const empty = !text;
  return (
    <div className="py-2 border-b border-[#f4f4f4] last:border-0">
      <div className="flex justify-between gap-4">
        <span className="text-xs text-[#9a9a9a] shrink-0">{label}</span>
        <span className={`text-sm text-right ${empty ? 'text-[#c4c4c4]' : 'text-[#151515]'}`}>{empty ? '—' : text}</span>
      </div>
      {audioKey ? (
        <div className="mt-2 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs text-[#9a9a9a]">
            <span>🎙 Голосовая запись</span>
            {raw && raw !== text ? (
              <button onClick={() => setShowRaw((s) => !s)} className="underline hover:text-[#151515]">
                {showRaw ? 'скрыть транскрипт' : 'сырой транскрипт'}
              </button>
            ) : null}
          </div>
          {url ? (
            <audio controls src={url} className="w-full max-w-sm" />
          ) : (
            <span className="text-xs text-[#c4c4c4]">загрузка аудио…</span>
          )}
          {showRaw && raw ? <div className="text-xs text-[#9a9a9a] italic text-right">«{raw}»</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === null || value === undefined || value === '' || value === '—';
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#f4f4f4] last:border-0">
      <span className="text-xs text-[#9a9a9a] shrink-0">{label}</span>
      <span className={`text-sm text-right ${empty ? 'text-[#c4c4c4]' : 'text-[#151515]'}`}>
        {empty ? '—' : value}
      </span>
    </div>
  );
}

function CircumstancesBlock({ a, b }: { a: boolean[]; b: boolean[] }) {
  const marked = EURO_CIRCUMSTANCES.map((text, i) => ({ text, i, a: !!a[i], b: !!b[i] })).filter((x) => x.a || x.b);
  return (
    <div className="bg-white rounded-2xl border border-[#ececec] p-5">
      <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
        Обстоятельства · отмечено {marked.length} из 22
      </div>
      {marked.length === 0 ? (
        <div className="text-sm text-[#c4c4c4]">Ничего не отмечено</div>
      ) : (
        <div className="space-y-1.5">
          {marked.map((x) => (
            <div key={x.i} className="flex items-start gap-3 text-sm">
              <span className="text-[#9a9a9a] w-5 shrink-0">{x.i + 1}.</span>
              <span className="flex gap-1 shrink-0">
                {x.a && <span className="px-1.5 rounded bg-[rgba(54,112,212,0.12)] text-[#3670d4] text-xs font-semibold">A</span>}
                {x.b && <span className="px-1.5 rounded bg-[rgba(230,20,40,0.1)] text-[#c01020] text-xs font-semibold">B</span>}
              </span>
              <span className="text-[#151515]">{x.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaGallery({ photos, schemeImageKey }: { photos: EuroMediaMeta[]; schemeImageKey?: string | null }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const allKeys = [...photos.filter((p) => p.key).map((p) => p.key), ...(schemeImageKey ? [schemeImageKey] : [])];

  useEffect(() => {
    let alive = true;
    if (allKeys.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      allKeys.map(async (key) => {
        try {
          const { data } = await api.get('/files/presign-download', { params: { key } });
          return [key, (data as { url: string }).url] as const;
        } catch {
          return [key, ''] as const;
        }
      }),
    ).then((pairs) => {
      if (alive) {
        setUrls(Object.fromEntries(pairs));
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allKeys.join(',')]);

  const images = photos.filter((p) => p.type === 'image' && p.key);
  const videos = photos.filter((p) => p.type === 'video' && p.key);

  return (
    <div className="bg-white rounded-2xl border border-[#ececec] p-5">
      <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide mb-3">
        Медиа · {images.length} фото · {videos.length} видео{schemeImageKey ? ' · схема' : ''}
      </div>

      {allKeys.length === 0 ? (
        <div className="text-sm text-[#c4c4c4]">Файлы не прикреплены</div>
      ) : loading ? (
        <div className="text-sm text-[#9a9a9a]">Загрузка медиа…</div>
      ) : (
        <div className="space-y-4">
          {/* Фото */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((m) => (
                <a key={m.key} href={urls[m.key] || '#'} target="_blank" rel="noreferrer" className="block group">
                  {urls[m.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[m.key]}
                      alt={m.slot ?? 'фото'}
                      className="w-full h-32 object-cover rounded-xl border border-[#ececec] group-hover:opacity-90 transition"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-[#f4f4f4] flex items-center justify-center text-xs text-[#c4c4c4]">
                      нет доступа
                    </div>
                  )}
                  <div className="text-xs text-[#9a9a9a] mt-1 truncate">
                    {(m.slot && PHOTO_SLOT_LABEL[m.slot]) || m.slot || 'Фото'}
                    {m.at ? ` · ${m.at}` : ''}
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Видео */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videos.map((m, i) =>
                urls[m.key] ? (
                  <div key={m.key}>
                    <video src={urls[m.key]} controls className="w-full rounded-xl border border-[#ececec] bg-black" />
                    <div className="text-xs text-[#9a9a9a] mt-1">
                      Видео {i + 1}
                      {m.at ? ` · ${m.at}` : ''}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}

          {/* Схема */}
          {schemeImageKey && urls[schemeImageKey] && (
            <div>
              <div className="text-xs text-[#9a9a9a] mb-1">Схема ДТП</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[schemeImageKey]}
                alt="схема"
                className="max-w-md w-full rounded-xl border border-[#ececec]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusManager({
  id,
  current,
  note,
  onSaved,
}: {
  id: string;
  current: EuroStatus;
  note?: string | null;
  onSaved: () => void;
}) {
  const update = useUpdateEuroStatus();
  const [status, setStatus] = useState<EuroStatus>(current);
  const [text, setText] = useState('');

  const save = () => {
    update.mutate({ id, status, adminNote: text || undefined }, { onSuccess: onSaved });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#ececec] p-5 space-y-3">
      <div className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wide">Управление</div>
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EuroStatus)}
          className="border border-[#ececec] rounded-xl px-3 py-2.5 text-sm bg-white md:w-64"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={note || 'Примечание оператора (необязательно)'}
          rows={2}
          className="flex-1 border border-[#ececec] rounded-xl px-3 py-2 text-sm bg-white resize-none"
        />
      </div>
      <button
        onClick={save}
        disabled={update.isPending}
        className="bg-[#e61428] text-white rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-[#c01020] transition"
      >
        {update.isPending ? 'Сохранение…' : 'Сохранить'}
      </button>
    </div>
  );
}
