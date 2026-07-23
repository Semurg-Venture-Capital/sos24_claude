'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Phone, PhoneIncoming, X } from 'lucide-react';
import { ensureAudioUnlocked } from '@/lib/agentAlerts';
import { useSoftphone } from './SoftphoneProvider';
import { IphoneCaller } from './IphoneCaller';

// Глобальный виджет софтфона: плавающая кнопка справа внизу на всех страницах
// дашборда (кроме колл-центра, где панель зафиксирована инлайн). При любом звонке
// (входящий/исходящий/разговор) панель раскрывается автоматически — оператор
// может ответить, где бы он ни находился.
export function SoftphoneWidget() {
  const pathname = usePathname();
  const { status, callState, notConfigured } = useSoftphone();
  const [manualOpen, setManualOpen] = useState(false);

  // У не-операторов (нет extension) софтфона нет — виджет не показываем.
  if (notConfigured) return null;
  // На колл-центре виджет не нужен — там звонилка зафиксирована в разметке страницы.
  if (pathname?.startsWith('/call-center')) return null;

  const busy = callState !== 'none';
  const ringing = callState === 'incoming';
  // Во время звонка панель всегда открыта; в простое — по ручному переключателю.
  const open = busy || manualOpen;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <IphoneCaller />
        </div>
      )}

      <button
        onClick={() => {
          ensureAudioUnlocked();
          setManualOpen((v) => !v);
        }}
        title={ringing ? 'Входящий звонок' : open ? 'Свернуть' : 'Открыть телефон'}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-colors ${
          ringing
            ? 'bg-[#34c759] animate-pulse'
            : busy
              ? 'bg-[#0a9466]'
              : 'bg-[#1c1c1e] hover:bg-[#333]'
        }`}
      >
        {ringing ? <PhoneIncoming size={22} /> : open ? <X size={22} /> : <Phone size={22} />}
        {/* Зелёная точка «готов», когда зарегистрированы, свободны и свёрнуты */}
        {status === 'registered' && !busy && !open && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#34c759] border-2 border-white" />
        )}
      </button>
    </div>
  );
}
