'use client';

import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Headphones } from 'lucide-react';
import { callcenterApi } from '@/lib/callcenter';
import { Softphone, type CallState, type IncomingInfo, type PhoneStatus, type SipCreds } from '@/lib/softphone';
import { formatPhone } from '@/lib/utils';

const STATUS_LABEL: Record<PhoneStatus, string> = {
  idle: 'Софтфон выключен',
  connecting: 'Подключение…',
  registered: 'Готов к приёму',
  unregistered: 'Не зарегистрирован',
  failed: 'Ошибка подключения',
};

export function SoftphoneBar() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const phoneRef = useRef<Softphone | null>(null);
  const [status, setStatus] = useState<PhoneStatus>('idle');
  const [callState, setCallState] = useState<CallState>('none');
  const [incoming, setIncoming] = useState<IncomingInfo | null>(null);
  const [muted, setMuted] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let phone: Softphone | null = null;
    (async () => {
      const creds = await callcenterApi.sipCredentials();
      if (!creds?.configured || !audioRef.current) {
        setNotConfigured(true);
        return;
      }
      phone = new Softphone(audioRef.current, {
        onStatus: setStatus,
        onCall: (s, info) => {
          setCallState(s);
          if (s === 'incoming') setIncoming(info ?? null);
          if (s === 'ended' || s === 'none') {
            setIncoming(null);
            setMuted(false);
          }
        },
      });
      phoneRef.current = phone;
      await phone.start(creds as SipCreds);
    })();
    return () => {
      void phone?.stop();
    };
  }, []);

  // Таймер разговора.
  useEffect(() => {
    if (callState !== 'in-call') {
      setSeconds(0);
      return;
    }
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  const answer = () => phoneRef.current?.answer();
  const hangup = () => phoneRef.current?.hangup();
  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    phoneRef.current?.setMuted(m);
  };

  const dur = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const ringing = callState === 'incoming';
  const inCall = callState === 'in-call';

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-[rgba(20,20,40,0.06)] shadow-sm px-4 py-3">
      <audio ref={audioRef} autoPlay hidden />
      <Headphones size={18} className="text-[#5f5e5e] shrink-0" />

      {notConfigured ? (
        <span className="text-sm text-[#9a9a9a]">Софтфон не настроен (нет WSS/SIP в конфиге)</span>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${status === 'registered' ? 'bg-[#34d399]' : status === 'connecting' ? 'bg-[#f5c850]' : 'bg-[#e61428]'}`}
            />
            <span className="text-sm text-[#5f5e5e]">{STATUS_LABEL[status]}</span>
          </div>

          {ringing && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm font-medium text-[#e61428]">
                Входящий{incoming?.number ? `: ${formatPhone(incoming.number)}` : ''}
              </span>
              <button
                onClick={answer}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm text-white bg-[#0a9466] hover:bg-[#087e57] transition-colors"
              >
                <Phone size={15} /> Принять
              </button>
              <button
                onClick={hangup}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm text-white bg-[#e61428] hover:bg-[#c01020] transition-colors"
              >
                <PhoneOff size={15} /> Отклонить
              </button>
            </div>
          )}

          {inCall && (
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm font-medium text-[#0a9466]">Разговор · {dur}</span>
              <button
                onClick={toggleMute}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm transition-colors ${muted ? 'bg-[rgba(230,20,40,0.1)] text-[#e61428]' : 'bg-[#f0f0f2] text-[#5f5e5e] hover:bg-[#e6e6e9]'}`}
              >
                {muted ? <MicOff size={15} /> : <Mic size={15} />} {muted ? 'Вкл. микр.' : 'Без звука'}
              </button>
              <button
                onClick={hangup}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm text-white bg-[#e61428] hover:bg-[#c01020] transition-colors"
              >
                <PhoneOff size={15} /> Завершить
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
