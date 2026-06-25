'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Phone, PhoneIncoming, PhoneMissed, ShieldCheck, FileText, Volume2, Play } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import {
  useCalls,
  useCallHealth,
  callsSocket,
  callcenterApi,
  type Call,
  type CallStatus,
  type IncomingCall,
  type CallUpdate,
} from '@/lib/callcenter';
import { ensureAudioUnlocked, playPing, requestNotifyPermission, showDesktopNotification } from '@/lib/agentAlerts';
import { formatPhone } from '@/lib/utils';
import { SoftphoneBar } from './SoftphoneBar';
import { CallTicketModal } from './CallTicketModal';
import { FileSignature } from 'lucide-react';

const DIR_LABEL: Record<string, string> = {
  INBOUND_EXTERNAL: 'Внешний',
  INBOUND_APP: 'Из приложения',
  OUTBOUND: 'Исходящий',
};
const STATUS: Record<CallStatus, { label: string; cls: string }> = {
  RINGING: { label: 'Звонит', cls: 'bg-[rgba(245,200,80,0.2)] text-[#9a7400]' },
  ANSWERED: { label: 'Разговор', cls: 'bg-[rgba(86,140,255,0.15)] text-[#3b6fe0]' },
  COMPLETED: { label: 'Завершён', cls: 'bg-[rgba(52,211,153,0.15)] text-[#0a9466]' },
  MISSED: { label: 'Пропущен', cls: 'bg-[rgba(230,20,40,0.1)] text-[#e61428]' },
  FAILED: { label: 'Ошибка', cls: 'bg-[rgba(20,20,40,0.06)] text-[#5f5e5e]' },
};

const TABS = [
  { key: '', label: 'Все' },
  { key: 'RINGING', label: 'Активные' },
  { key: 'COMPLETED', label: 'Завершённые' },
  { key: 'MISSED', label: 'Пропущенные' },
];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtDur(sec: number | null) {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CallCenterPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('');
  const { data: calls, isLoading } = useCalls(tab);
  const { data: health } = useCallHealth();
  const [incoming, setIncoming] = useState<IncomingCall[]>([]);
  const [audioOn, setAudioOn] = useState(false);

  useEffect(() => {
    requestNotifyPermission();
    const socket = callsSocket();

    socket.on('call:incoming', (c: IncomingCall) => {
      setIncoming((prev) => [c, ...prev.filter((x) => x.callId !== c.callId)].slice(0, 6));
      playPing();
      const who = c.user?.name || c.number || 'Неизвестный';
      showDesktopNotification('Входящий звонок', who);
      qc.invalidateQueries({ queryKey: ['cc', 'calls'] });
    });

    socket.on('call:update', (u: CallUpdate) => {
      // звонок завершился/пропущен — убираем из активной панели
      if (u.status === 'COMPLETED' || u.status === 'MISSED' || u.status === 'FAILED') {
        setIncoming((prev) => prev.filter((x) => x.callId !== u.callId));
      }
      qc.invalidateQueries({ queryKey: ['cc', 'calls'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [qc]);

  const enableAudio = () => {
    ensureAudioUnlocked();
    requestNotifyPermission();
    playPing();
    setAudioOn(true);
  };

  const [playingId, setPlayingId] = useState<string | null>(null);
  const playRecording = async (id: string) => {
    try {
      const { url } = await callcenterApi.recording(id);
      const audio = new Audio(url);
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      await audio.play();
    } catch {
      setPlayingId(null);
    }
  };

  const [ticketCall, setTicketCall] = useState<Call | null>(null);

  const list: Call[] = calls ?? [];

  return (
    <div className="flex flex-col flex-1 overflow-auto" onClick={() => ensureAudioUnlocked()}>
      <Header
        title="Колл-центр"
        subtitle={
          health
            ? health.connected
              ? 'Телефония подключена'
              : health.enabled
                ? 'Телефония недоступна (нет связи с АТС)'
                : 'Телефония не настроена'
            : '...'
        }
      />

      <main className="flex-1 p-6 flex flex-col gap-6">
        {/* Софтфон оператора */}
        <SoftphoneBar />

        {/* Статус + включить звук */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${health?.connected ? 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]' : 'bg-[rgba(230,20,40,0.1)] text-[#e61428]'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${health?.connected ? 'bg-[#34d399]' : 'bg-[#e61428]'}`} />
            {health?.connected ? 'АТС онлайн' : 'АТС офлайн'}
          </span>
          {!audioOn && (
            <button
              onClick={enableAudio}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs bg-[#f0f0f2] text-[#5f5e5e] hover:bg-[#e6e6e9] transition-colors"
            >
              <Volume2 size={14} /> Включить звук уведомлений
            </button>
          )}
        </div>

        {/* Входящие (живой screen-pop) */}
        {incoming.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider">Входящие сейчас</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {incoming.map((c) => (
                <div key={c.callId} className="bg-white rounded-2xl border-2 border-[#e61428] shadow-sm p-4">
                  <div className="flex items-center gap-2 text-[#e61428] mb-2">
                    <PhoneIncoming size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wide">{DIR_LABEL[c.direction]}</span>
                  </div>
                  {c.user ? (
                    <>
                      <p className="text-base font-semibold text-[#151515]">{c.user.name || 'Клиент'}</p>
                      <p className="text-sm text-[#5f5e5e]">{formatPhone(c.user.phone)}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#5f5e5e]">
                        {c.user.verified && (
                          <span className="inline-flex items-center gap-1 text-[#0a9466]">
                            <ShieldCheck size={13} /> MyID
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <FileText size={13} /> Полисов: {c.user.policies}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-[#151515]">Неизвестный номер</p>
                      <p className="text-sm text-[#5f5e5e]">{c.number ? formatPhone(c.number) : '—'}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Журнал звонков */}
        <div>
          <div className="flex gap-1 bg-[#f0f0f2] p-1 rounded-xl w-fit mb-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-white text-[#151515] shadow-sm' : 'text-[#5f5e5e] hover:text-[#151515]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(20,20,40,0.06)]">
                  {['Время', 'Направление', 'Клиент / номер', 'Статус', 'Длит.', 'Оператор', 'Действия'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(20,20,40,0.04)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#9a9a9a]">
                      Загрузка...
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center">
                      <Phone size={20} className="mx-auto text-[#c0c0c0] mb-2" />
                      <p className="text-sm text-[#9a9a9a]">Звонков пока нет</p>
                    </td>
                  </tr>
                ) : (
                  list.map((c) => {
                    const st = STATUS[c.status];
                    const who = c.user
                      ? [c.user.surname, c.user.name].filter(Boolean).join(' ') || c.user.phone
                      : c.externalNumber;
                    return (
                      <tr key={c.id} className="hover:bg-[#fafafa] transition-colors">
                        <td className="px-5 py-3.5 text-sm text-[#5f5e5e] whitespace-nowrap">{fmtTime(c.startedAt)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{DIR_LABEL[c.direction]}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {c.status === 'MISSED' && <PhoneMissed size={14} className="text-[#e61428]" />}
                            <span className="text-sm font-medium text-[#151515]">{who || '—'}</span>
                          </div>
                          {c.user && c.externalNumber && (
                            <p className="text-xs text-[#9a9a9a]">{formatPhone(c.externalNumber)}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">{fmtDur(c.durationSec)}</td>
                        <td className="px-5 py-3.5 text-sm text-[#5f5e5e]">
                          {c.operator ? [c.operator.surname, c.operator.name].filter(Boolean).join(' ') : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {c.recordingKey && (
                              <button
                                onClick={() => playRecording(c.id)}
                                disabled={playingId === c.id}
                                title="Прослушать запись"
                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs text-[#5f5e5e] hover:bg-[#f0f0f2] transition-colors disabled:opacity-50"
                              >
                                <Play size={13} /> {playingId === c.id ? 'Играет…' : 'Запись'}
                              </button>
                            )}
                            <button
                              onClick={() => setTicketCall(c)}
                              title={c.ticketId ? 'Заявка привязана' : 'Создать заявку / заметку'}
                              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs transition-colors ${c.ticketId ? 'text-[#0a9466] hover:bg-[rgba(52,211,153,0.1)]' : 'text-[#5f5e5e] hover:bg-[#f0f0f2]'}`}
                            >
                              <FileSignature size={13} /> {c.ticketId ? 'Заявка ✓' : 'Заявка'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {ticketCall && <CallTicketModal call={ticketCall} onClose={() => setTicketCall(null)} />}
    </div>
  );
}
