'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Delete, Grid3x3, Loader2, User, PhoneForwarded, ArrowLeft } from 'lucide-react';
import { callcenterApi } from '@/lib/callcenter';
import { type PhoneStatus } from '@/lib/softphone';
import { formatPhone } from '@/lib/utils';
import { useSoftphone } from './SoftphoneProvider';

// Раскладка дайлпада как на iPhone: цифра + буквы под ней.
const PAD: { d: string; s: string }[] = [
  { d: '1', s: '' }, { d: '2', s: 'ABC' }, { d: '3', s: 'DEF' },
  { d: '4', s: 'GHI' }, { d: '5', s: 'JKL' }, { d: '6', s: 'MNO' },
  { d: '7', s: 'PQRS' }, { d: '8', s: 'TUV' }, { d: '9', s: 'WXYZ' },
  { d: '*', s: '' }, { d: '0', s: '+' }, { d: '#', s: '' },
];

const STATUS_LABEL: Record<PhoneStatus, string> = {
  idle: 'Софтфон выключен',
  connecting: 'Подключение…',
  registered: 'Готов к приёму',
  unregistered: 'Не зарегистрирован',
  failed: 'Ошибка подключения',
};

function initials(name?: string | null): string | null {
  if (!name) return null;
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || null;
}

// Круглая аватарка iOS: инициалы или иконка.
function Avatar({ name }: { name?: string | null }) {
  const ini = initials(name);
  return (
    <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#c7c7cc] to-[#a2a2a8] text-white flex items-center justify-center shadow-inner">
      {ini ? <span className="text-3xl font-medium tracking-wide">{ini}</span> : <User size={40} strokeWidth={1.5} />}
    </div>
  );
}

// Круглая кнопка дайлпада.
function PadKey({ d, s, onPress }: { d: string; s: string; onPress: (d: string) => void }) {
  return (
    <button
      onClick={() => onPress(d)}
      className="w-16 h-16 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] active:bg-[#d1d1d6] flex flex-col items-center justify-center leading-none transition-colors select-none"
    >
      <span className="text-[26px] font-light text-[#1c1c1e]">{d}</span>
      {s && <span className="text-[9px] font-semibold tracking-[0.18em] text-[#8e8e93] mt-[3px]">{s}</span>}
    </button>
  );
}

export function IphoneCaller() {
  const {
    status, callState, peer, muted, seconds, notConfigured, answering,
    dial, answer, hangup, toggleMute, sendDtmf, transfer,
  } = useSoftphone();

  const [dialValue, setDialValue] = useState('');
  const [padOpen, setPadOpen] = useState(false); // DTMF-клавиатура во время разговора
  const [transferOpen, setTransferOpen] = useState(false);
  const [operators, setOperators] = useState<{ id: string; name: string; ext: string }[] | null>(null);
  const [transferManual, setTransferManual] = useState('');

  // Сброс локального UI при завершении звонка — паттерн «правка состояния при
  // изменении входных данных» (без эффекта, чтобы не плодить каскадные рендеры).
  const [prevCall, setPrevCall] = useState(callState);
  if (prevCall !== callState) {
    setPrevCall(callState);
    if (callState === 'none' || callState === 'ended') {
      setPadOpen(false);
      setTransferOpen(false);
      setTransferManual('');
    }
  }

  const callManual = () => {
    const n = dialValue.trim();
    if (!n) return;
    dial(n);
    setDialValue('');
  };
  const openTransfer = () => {
    setPadOpen(false);
    setTransferOpen(true);
    if (operators === null) {
      callcenterApi.operators().then(setOperators).catch(() => setOperators([]));
    }
  };
  const doTransfer = (ext: string) => {
    const clean = ext.trim();
    if (!clean) return;
    transfer(clean);
    setTransferOpen(false);
    setTransferManual('');
  };

  const dur = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const peerLabel = peer?.displayName || (peer?.number ? formatPhone(peer.number) : 'Неизвестный');
  const dotColor =
    status === 'registered' ? 'bg-[#34c759]' : status === 'connecting' ? 'bg-[#ff9f0a]' : 'bg-[#ff3b30]';

  return (
    <div className="w-full rounded-[28px] bg-white border border-[rgba(20,20,40,0.08)] shadow-[0_8px_40px_-12px_rgba(20,20,40,0.18)] overflow-hidden flex flex-col min-h-[600px]">
      {/* Шапка со статусом */}
      <div className="flex items-center justify-center gap-2 py-3.5 border-b border-[rgba(20,20,40,0.05)] bg-[#fbfbfd]">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[13px] font-medium text-[#6b6b70]">
          {notConfigured ? 'Софтфон не настроен' : STATUS_LABEL[status]}
        </span>
      </div>

      {notConfigured ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-sm text-[#9a9a9a]">
          Нет WSS/SIP в конфигурации
        </div>
      ) : callState === 'incoming' ? (
        /* ───────── ВХОДЯЩИЙ ───────── */
        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
          <Avatar name={peer?.displayName} />
          <p className="mt-5 text-xl font-semibold text-[#1c1c1e] text-center">{peerLabel}</p>
          <p className="mt-1 text-[13px] text-[#8e8e93]">Входящий вызов…</p>
          <div className="mt-auto flex items-center justify-center gap-16 w-full pt-8">
            <button onClick={hangup} className="flex flex-col items-center gap-2">
              <span className="w-16 h-16 rounded-full bg-[#ff3b30] hover:bg-[#e0352b] text-white flex items-center justify-center shadow-lg transition-colors">
                <PhoneOff size={26} />
              </span>
              <span className="text-xs text-[#8e8e93]">Отклонить</span>
            </button>
            <button onClick={answer} disabled={answering} className="flex flex-col items-center gap-2">
              <span
                className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg transition-colors ${
                  answering ? 'bg-[#34c759]/70' : 'bg-[#34c759] hover:bg-[#2fb350]'
                }`}
              >
                {answering ? <Loader2 size={26} className="animate-spin" /> : <Phone size={26} />}
              </span>
              <span className="text-xs text-[#8e8e93]">{answering ? 'Принимаю…' : 'Принять'}</span>
            </button>
          </div>
        </div>
      ) : callState === 'outgoing' || callState === 'in-call' ? (
        /* ───────── ИСХОДЯЩИЙ / РАЗГОВОР ───────── */
        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
          <Avatar name={peer?.displayName} />
          <p className="mt-5 text-xl font-semibold text-[#1c1c1e] text-center">{peerLabel}</p>
          <p className="mt-1 text-[13px] text-[#8e8e93] tabular-nums">
            {callState === 'outgoing' ? 'Вызов…' : dur}
          </p>

          {callState === 'in-call' && transferOpen ? (
            /* ── Панель перевода звонка на оператора ── */
            <div className="w-full mt-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setTransferOpen(false)} className="text-[#8e8e93] hover:text-[#1c1c1e] p-1 -ml-1">
                  <ArrowLeft size={18} />
                </button>
                <span className="text-[13px] font-semibold text-[#6b6b70]">Перевести на оператора</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {operators === null ? (
                  <div className="flex items-center gap-2 text-sm text-[#8e8e93] py-2">
                    <Loader2 size={15} className="animate-spin" /> Загрузка…
                  </div>
                ) : operators.length === 0 ? (
                  <p className="text-sm text-[#9a9a9a] py-2">Нет других операторов с extension.</p>
                ) : (
                  operators.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => doTransfer(o.ext)}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#f7f7f9] hover:bg-[#eef0f2] transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-[#1c1c1e] truncate">{o.name}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0a9466] shrink-0">
                        <PhoneForwarded size={13} /> {o.ext}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  value={transferManual}
                  onChange={(e) => setTransferManual(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doTransfer(transferManual)}
                  inputMode="tel"
                  placeholder="Доб. номер"
                  className="flex-1 h-9 px-3 text-sm rounded-xl border border-[rgba(20,20,40,0.1)] outline-none focus:border-[#0a9466] tabular-nums"
                />
                <button
                  onClick={() => doTransfer(transferManual)}
                  disabled={!transferManual.trim()}
                  className="h-9 px-4 rounded-xl text-sm text-white bg-[#0a9466] hover:bg-[#087e57] disabled:bg-[#0a9466]/40 disabled:cursor-not-allowed transition-colors"
                >
                  Перевести
                </button>
              </div>
            </div>
          ) : (
            <>
              {callState === 'in-call' && padOpen && (
                <div className="grid grid-cols-3 gap-x-5 gap-y-2.5 mt-6">
                  {PAD.map((k) => (
                    <PadKey key={k.d} d={k.d} s={k.s} onPress={sendDtmf} />
                  ))}
                </div>
              )}

              {/* Управление разговором (iOS-сетка) */}
              {callState === 'in-call' && (
                <div className="flex items-start justify-center gap-7 mt-8">
                  <button onClick={toggleMute} className="flex flex-col items-center gap-2">
                    <span
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        muted ? 'bg-[#1c1c1e] text-white' : 'bg-[#f2f2f7] text-[#1c1c1e] hover:bg-[#e5e5ea]'
                      }`}
                    >
                      {muted ? <MicOff size={22} /> : <Mic size={22} />}
                    </span>
                    <span className="text-[11px] text-[#8e8e93]">{muted ? 'Вкл. звук' : 'Без звука'}</span>
                  </button>
                  <button onClick={() => setPadOpen((v) => !v)} className="flex flex-col items-center gap-2">
                    <span
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        padOpen ? 'bg-[#1c1c1e] text-white' : 'bg-[#f2f2f7] text-[#1c1c1e] hover:bg-[#e5e5ea]'
                      }`}
                    >
                      <Grid3x3 size={22} />
                    </span>
                    <span className="text-[11px] text-[#8e8e93]">Клавиши</span>
                  </button>
                  <button onClick={openTransfer} className="flex flex-col items-center gap-2">
                    <span className="w-14 h-14 rounded-full flex items-center justify-center transition-colors bg-[#f2f2f7] text-[#1c1c1e] hover:bg-[#e5e5ea]">
                      <PhoneForwarded size={22} />
                    </span>
                    <span className="text-[11px] text-[#8e8e93]">Перевести</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Красный сброс */}
          <div className="mt-auto pt-8">
            <button
              onClick={hangup}
              className="w-16 h-16 rounded-full bg-[#ff3b30] hover:bg-[#e0352b] text-white flex items-center justify-center shadow-lg transition-colors"
              title="Завершить"
            >
              <PhoneOff size={26} />
            </button>
          </div>
        </div>
      ) : status === 'registered' ? (
        /* ───────── НАБОР (дайлпад) ───────── */
        <div className="flex-1 flex flex-col items-center px-6 pt-6 pb-8">
          {/* Дисплей номера */}
          <div className="h-12 flex items-center justify-center w-full">
            <span className="text-[30px] font-light text-[#1c1c1e] tracking-wide tabular-nums break-all text-center">
              {dialValue || <span className="text-[#c7c7cc]">Введите номер</span>}
            </span>
          </div>

          {/* Клавиатура */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 mt-4">
            {PAD.map((k) => (
              <PadKey key={k.d} d={k.d} s={k.s} onPress={(d) => setDialValue((v) => v + d)} />
            ))}
          </div>

          {/* Вызов + стереть */}
          <div className="grid grid-cols-3 items-center mt-5 w-full max-w-[248px]">
            <span />
            <div className="flex justify-center">
              <button
                onClick={callManual}
                disabled={!dialValue.trim()}
                className="w-16 h-16 rounded-full bg-[#34c759] hover:bg-[#2fb350] disabled:bg-[#34c759]/40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg transition-colors"
                title="Позвонить"
              >
                <Phone size={26} />
              </button>
            </div>
            <div className="flex justify-center">
              {dialValue && (
                <button
                  onClick={() => setDialValue((v) => v.slice(0, -1))}
                  className="text-[#8e8e93] hover:text-[#1c1c1e] transition-colors p-3"
                  title="Стереть"
                >
                  <Delete size={24} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ───────── ПОДКЛЮЧЕНИЕ / ОШИБКА ───────── */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          {status === 'connecting' ? (
            <Loader2 size={28} className="animate-spin text-[#8e8e93]" />
          ) : (
            <PhoneOff size={28} className="text-[#ff3b30]" />
          )}
          <p className="text-sm text-[#8e8e93]">{STATUS_LABEL[status]}</p>
        </div>
      )}
    </div>
  );
}
