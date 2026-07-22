'use client';

import { ExternalLink, MapPin, Phone, X } from 'lucide-react';

type AdjusterStatus = 'NEW' | 'ACCEPTED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';
type IncidentType = 'ACCIDENT' | 'DAMAGE' | 'THEFT';

const STATUS_LABELS: Record<AdjusterStatus, string> = {
  NEW: 'Новая', ACCEPTED: 'Принята', EN_ROUTE: 'В пути', COMPLETED: 'Завершена', CANCELLED: 'Отменена',
};
const STATUS_STYLES: Record<AdjusterStatus, string> = {
  NEW: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  ACCEPTED: 'bg-[rgba(245,200,80,0.15)] text-[#b07d00]',
  EN_ROUTE: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  COMPLETED: 'bg-[rgba(52,211,153,0.1)] text-[#0a9466]',
  CANCELLED: 'bg-[rgba(230,20,40,0.08)] text-[#c01020]',
};
const INCIDENT_LABELS: Record<IncidentType, string> = {
  ACCIDENT: 'ДТП', DAMAGE: 'Повреждение', THEFT: 'Угон',
};
const NEXT_STATUSES: Record<AdjusterStatus, AdjusterStatus[]> = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const POLICY_TYPE_LABEL: Record<string, string> = {
  OSAGO: 'ОСАГО', KASKO: 'КАСКО', HEALTH: 'Здоровье', HOME: 'Дом', FINANCE: 'Финансы',
};

interface PolicyInfo {
  id: string;
  type: string;
  policyNumber: string | null;
  vehicle: { brand: string; model: string; plate: string } | null;
}

interface AdjusterUserInfo {
  id: string; name: string | null; surname: string | null; phone: string | null;
}

interface AdjusterItem {
  id: string;
  status: AdjusterStatus;
  incidentType: IncidentType;
  address: string;
  lat: number | null;
  lng: number | null;
  comment: string | null;
  adjusterNote: string | null;
  policyId: string | null;
  policy: PolicyInfo | null;
  assignedAdjuster: AdjusterUserInfo | null;
  adjusterName: string | null;
  adjusterPhone: string | null;
  adjusterDisplayName: string | null;
  adjusterDisplayPhone: string | null;
  createdAt: string;
  user: { id: string; name: string | null; surname: string | null; phone: string | null };
}

interface Props {
  item: AdjusterItem;
  isUpdating: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: AdjusterStatus) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-semibold text-[#9a9a9a] uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-[#9a9a9a] w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#151515] flex-1">{value}</span>
    </div>
  );
}

export function AdjusterDetailDrawer({ item, isUpdating, onClose, onStatusChange }: Props) {
  const fullName = [item.user?.surname, item.user?.name].filter(Boolean).join(' ') || '—';
  const initials = fullName !== '—' ? fullName[0] : '?';
  const status = item.status as AdjusterStatus;
  const nextStatuses = NEXT_STATUSES[status];
  const mapUrl = item.lat && item.lng
    ? `https://maps.google.com/?q=${item.lat},${item.lng}`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-40 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(20,20,40,0.07)] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <span className="text-xs text-[#9a9a9a]">
              {INCIDENT_LABELS[item.incidentType] ?? item.incidentType}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9a9a9a] hover:bg-[#f4f4f6] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {/* Client */}
          <Section title="Клиент">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0f0f2] flex items-center justify-center text-sm font-semibold text-[#5f5e5e] shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#151515]">{fullName}</p>
                <p className="text-xs text-[#9a9a9a]">{item.user?.phone ?? '—'}</p>
              </div>
              {item.user?.phone && (
                <a
                  href={`tel:${item.user.phone}`}
                  className="w-8 h-8 rounded-xl bg-[rgba(52,211,153,0.1)] flex items-center justify-center text-[#0a9466] hover:bg-[rgba(52,211,153,0.2)] transition-colors"
                  title="Позвонить клиенту"
                >
                  <Phone size={14} />
                </a>
              )}
            </div>
          </Section>

          {/* Incident */}
          <Section title="Инцидент">
            <div className="flex flex-col gap-2">
              <Row label="Тип" value={<span className="font-medium">{INCIDENT_LABELS[item.incidentType] ?? item.incidentType}</span>} />
              <Row
                label="Адрес"
                value={
                  <span className="flex items-start gap-1.5">
                    <span className="flex-1">{item.address}</span>
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 mt-0.5 text-[#3670d4] hover:text-[#1a4fa0] transition-colors"
                        title="Открыть на карте"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </span>
                }
              />
              {item.lat && item.lng && (
                <Row label="GPS" value={
                  <a
                    href={mapUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3670d4] hover:underline text-xs"
                  >
                    {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                  </a>
                } />
              )}
              {item.comment && (
                <Row label="Комментарий" value={<span className="text-[#5f5e5e]">{item.comment}</span>} />
              )}
              {item.policy ? (
                <Row
                  label="Полис"
                  value={
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{POLICY_TYPE_LABEL[item.policy.type] ?? item.policy.type}</span>
                      {item.policy.vehicle && (
                        <span className="text-[#9a9a9a]">· {item.policy.vehicle.brand} {item.policy.vehicle.model} · {item.policy.vehicle.plate}</span>
                      )}
                      {item.policy.policyNumber && (
                        <span className="font-mono text-xs text-[#9a9a9a]">#{item.policy.policyNumber}</span>
                      )}
                    </span>
                  }
                />
              ) : item.policyId ? (
                <Row label="Полис" value={<span className="font-mono text-xs">{item.policyId.slice(0, 12)}…</span>} />
              ) : null}
            </div>
          </Section>

          {/* Assigned adjuster */}
          {(item.adjusterDisplayName || item.adjusterDisplayPhone) && (
            <Section title="Назначен специалист">
              <div className="flex items-center gap-3 bg-[rgba(245,200,80,0.08)] border border-[rgba(245,200,80,0.3)] rounded-xl p-3">
                <div className="w-9 h-9 rounded-full bg-[rgba(245,200,80,0.25)] flex items-center justify-center text-sm font-semibold text-[#b07d00] shrink-0">
                  {item.adjusterDisplayName?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  {item.adjusterDisplayName && (
                    <p className="text-sm font-medium text-[#151515]">{item.adjusterDisplayName}</p>
                  )}
                  {item.adjusterDisplayPhone && (
                    <p className="text-xs text-[#9a9a9a]">{item.adjusterDisplayPhone}</p>
                  )}
                </div>
                {item.adjusterDisplayPhone && (
                  <a
                    href={`tel:${item.adjusterDisplayPhone}`}
                    className="w-8 h-8 rounded-xl bg-[rgba(52,211,153,0.1)] flex items-center justify-center text-[#0a9466] hover:bg-[rgba(52,211,153,0.2)] transition-colors"
                  >
                    <Phone size={14} />
                  </a>
                )}
              </div>
              {item.adjusterNote && (
                <p className="text-xs text-[#5f5e5e] px-1 mt-1 whitespace-pre-wrap">{item.adjusterNote}</p>
              )}
            </Section>
          )}

          {/* Info */}
          <Section title="Информация">
            <Row label="ID заявки" value={<span className="font-mono text-xs">{item.id.slice(0, 16)}…</span>} />
            <Row label="Создана" value={new Date(item.createdAt).toLocaleString('ru-RU')} />
          </Section>
        </div>

        {/* Footer: action buttons */}
        {nextStatuses.length > 0 && (
          <div className="shrink-0 px-5 py-4 border-t border-[rgba(20,20,40,0.07)] flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-[#9a9a9a] uppercase tracking-wider mb-1">Действие</p>
            <div className="flex gap-2">
              {nextStatuses.map((next) => (
                <button
                  key={next}
                  disabled={isUpdating}
                  onClick={() => onStatusChange(item.id, next)}
                  className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
                    next === 'CANCELLED'
                      ? 'border border-[rgba(230,20,40,0.25)] text-[#e61428] hover:bg-[rgba(230,20,40,0.06)]'
                      : 'bg-[#151515] text-white hover:bg-[#333]'
                  }`}
                >
                  {STATUS_LABELS[next]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
