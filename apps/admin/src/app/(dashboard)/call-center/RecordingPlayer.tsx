'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, AlertCircle, Download } from 'lucide-react';
import { callcenterApi } from '@/lib/callcenter';

function mmss(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

type Phase = 'loading' | 'processing' | 'error' | 'ready';

// Инлайн-плеер записи разговора: play/pause, перемотка (seek), время, скачивание.
// Пока файл не залит аплоадером (backend отдаёт 425) — показываем «обрабатывается»
// и авто-повторяем запрос. Размонтирование (закрытие плеера) останавливает звук —
// этим пользуемся, чтобы глушить прослушку при входящем звонке.
export function RecordingPlayer({ callId }: { callId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await callcenterApi.recording(callId);
      setUrl(res.url);
      setPhase('ready');
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setPhase(status === 425 ? 'processing' : 'error');
    }
  }, [callId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Пока «обрабатывается» — повторяем каждые 8с (аплоадер заливает ~1/мин).
  useEffect(() => {
    if (phase !== 'processing') return;
    const t = setTimeout(() => void load(), 8000);
    return () => clearTimeout(t);
  }, [phase, load]);

  // Автоплей, как только запись готова (оператор ведь нажал «Прослушать»).
  useEffect(() => {
    if (phase === 'ready' && url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [phase, url]);

  // Стоп при размонтировании (входящий звонок закрывает плеер → звук глохнет).
  useEffect(() => {
    const a = audioRef.current;
    return () => {
      a?.pause();
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };
  const seek = (v: number) => {
    if (audioRef.current) audioRef.current.currentTime = v;
    setCur(v);
  };

  if (phase === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#5f5e5e] px-3 py-2.5">
        <Loader2 size={15} className="animate-spin" /> Загрузка записи…
      </div>
    );
  }
  if (phase === 'processing') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#9a7400] bg-[rgba(245,200,80,0.14)] rounded-xl px-3 py-2.5">
        <Loader2 size={15} className="animate-spin" />
        Запись обрабатывается — появится в течение минуты…
      </div>
    );
  }
  if (phase === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#e61428] bg-[rgba(230,20,40,0.08)] rounded-xl px-3 py-2.5">
        <AlertCircle size={15} /> Не удалось загрузить запись.
        <button onClick={() => void load()} className="underline hover:no-underline">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-[#f7f7f9] rounded-xl px-3 py-2.5">
      <audio
        ref={audioRef}
        src={url ?? undefined}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        title={playing ? 'Пауза' : 'Воспроизвести'}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0a9466] text-white hover:bg-[#087e57] transition-colors shrink-0"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <span className="text-xs tabular-nums text-[#5f5e5e] w-10 text-right shrink-0">{mmss(cur)}</span>
      <input
        type="range"
        min={0}
        max={dur || 0}
        step={0.1}
        value={cur}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Перемотка записи"
        className="flex-1 h-1.5 accent-[#0a9466] cursor-pointer"
      />
      <span className="text-xs tabular-nums text-[#5f5e5e] w-10 shrink-0">{mmss(dur)}</span>
      {url && (
        <a
          href={url}
          download
          title="Скачать запись"
          className="text-[#9a9a9a] hover:text-[#5f5e5e] transition-colors shrink-0"
        >
          <Download size={16} />
        </a>
      )}
    </div>
  );
}
