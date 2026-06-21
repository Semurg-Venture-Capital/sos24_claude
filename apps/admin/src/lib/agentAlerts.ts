// Звук + десктоп-уведомления для операторов поддержки.
// Звук синтезируем через Web Audio (без файлов). Браузер требует «разблокировки»
// аудио после первого клика пользователя — поэтому ensureAudioUnlocked().

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Вызвать на любой первый клик — разблокирует AudioContext (политика автоплея).
export function ensureAudioUnlocked() {
  const c = getCtx();
  if (!c || unlocked) return;
  c.resume().then(() => {
    unlocked = true;
  });
}

// Короткий двухтоновый «дин-дон».
export function playPing() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const now = c.currentTime;
  const gain = c.createGain();
  gain.connect(c.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  [880, 1320].forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    osc.connect(gain);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.28);
  });
}

export async function requestNotifyPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      /* пользователь отклонил — не критично */
    }
  }
}

export function showDesktopNotification(title: string, body: string, onClick?: () => void) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: '/favicon.ico', tag: 'sos24-support' });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
  } catch {
    /* SSR / неподдерживаемый контекст */
  }
}
