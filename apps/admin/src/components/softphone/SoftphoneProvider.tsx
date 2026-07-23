'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { callcenterApi } from '@/lib/callcenter';
import { Softphone, type CallState, type IncomingInfo, type PhoneStatus, type SipCreds } from '@/lib/softphone';
import { ensureAudioUnlocked, playPing, requestNotifyPermission, showDesktopNotification } from '@/lib/agentAlerts';
import { formatPhone } from '@/lib/utils';

// Глобальный софтфон оператора: живёт на уровне layout дашборда, поэтому переживает
// переходы между страницами — телефон звонит/отвечает независимо от того, где оператор.
// Владеет единственным инстансом Softphone и <audio>; UI (IphoneCaller, виджет) —
// презентационные потребители этого контекста.
export interface SoftphoneContextValue {
  status: PhoneStatus;
  callState: CallState;
  peer: IncomingInfo | null;
  muted: boolean;
  seconds: number;
  notConfigured: boolean;
  answering: boolean;
  dial: (n: string) => void;
  answer: () => void;
  hangup: () => void;
  toggleMute: () => void;
  sendDtmf: (d: string) => void;
  transfer: (ext: string) => void;
}

const Ctx = createContext<SoftphoneContextValue | null>(null);

export function useSoftphone(): SoftphoneContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSoftphone должен использоваться внутри <SoftphoneProvider>');
  return v;
}

export function SoftphoneProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const phoneRef = useRef<Softphone | null>(null);
  const mutedRef = useRef(false);
  const [status, setStatus] = useState<PhoneStatus>('idle');
  const [callState, setCallState] = useState<CallState>('none');
  const [peer, setPeer] = useState<IncomingInfo | null>(null);
  const [muted, setMuted] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [answering, setAnswering] = useState(false);

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
          if (s === 'incoming' || s === 'outgoing') setPeer(info ?? null);
          if (s === 'in-call') setSeconds(0);
          if (s === 'in-call' || s === 'ended' || s === 'none') setAnswering(false);
          if (s === 'ended' || s === 'none') {
            setPeer(null);
            setMuted(false);
            mutedRef.current = false;
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
    if (callState !== 'in-call') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  // При любой смене состояния звонка оператора — освежаем журнал звонков сразу
  // (не дожидаясь поллинга/сокета), чтобы свой звонок появлялся в таблице мгновенно.
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['cc', 'calls'] });
  }, [callState, qc]);

  // Разблокировка звука на первый клик где угодно (политика автоплея) + разрешение
  // на десктоп-уведомления — чтобы рингтон и оповещение работали на любой странице.
  useEffect(() => {
    requestNotifyPermission();
    const unlock = () => ensureAudioUnlocked();
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, []);

  // Пока звонок входящий — «звоним»: рингтон каждые 2с + десктоп-уведомление.
  useEffect(() => {
    if (callState !== 'incoming') return;
    const who = peer?.displayName || (peer?.number ? formatPhone(peer.number) : 'Неизвестный номер');
    showDesktopNotification('Входящий звонок', who);
    playPing();
    const t = setInterval(() => playPing(), 2000);
    return () => clearInterval(t);
  }, [callState, peer]);

  const dial = useCallback((n: string) => {
    void phoneRef.current?.call(n);
  }, []);
  const answer = useCallback(async () => {
    setAnswering(true);
    try {
      await phoneRef.current?.answer();
    } catch {
      setAnswering(false);
    }
  }, []);
  const hangup = useCallback(() => {
    setAnswering(false);
    phoneRef.current?.hangup();
  }, []);
  const toggleMute = useCallback(() => {
    const nm = !mutedRef.current;
    mutedRef.current = nm;
    setMuted(nm);
    phoneRef.current?.setMuted(nm);
  }, []);
  const sendDtmf = useCallback((d: string) => phoneRef.current?.sendDtmf(d), []);
  const transfer = useCallback((ext: string) => {
    void phoneRef.current?.transfer(ext);
  }, []);

  const value: SoftphoneContextValue = {
    status,
    callState,
    peer,
    muted,
    seconds,
    notConfigured,
    answering,
    dial,
    answer,
    hangup,
    toggleMute,
    sendDtmf,
    transfer,
  };

  return (
    <Ctx.Provider value={value}>
      <audio ref={audioRef} autoPlay hidden />
      {children}
    </Ctx.Provider>
  );
}
