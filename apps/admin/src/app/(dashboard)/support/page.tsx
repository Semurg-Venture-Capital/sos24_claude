'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { Paperclip, Send, Check, CheckCheck, Lock, Unlock, UserPlus, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import {
  supportApi,
  connectSupportSocket,
  uploadAttachment,
  STATUS_LABEL,
  STATUS_STYLE,
  type SupportMessage,
  type SupportTicket,
  type TicketStatus,
} from '@/lib/support';
import {
  ensureAudioUnlocked,
  playPing,
  requestNotifyPermission,
  showDesktopNotification,
} from '@/lib/agentAlerts';

const BASE_TITLE = 'Поддержка — SOS24 Admin';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Все' },
  { key: 'OPEN', label: 'Открытые' },
  { key: 'PENDING', label: 'В ожидании' },
  { key: 'CLOSED', label: 'Закрытые' },
];

function time(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
function dayTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function SupportPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTicketRef = useRef<((t: SupportTicket) => void) | null>(null);
  const unseenRef = useRef(0);

  const { data: stats } = useQuery({ queryKey: ['support', 'stats'], queryFn: supportApi.stats, refetchInterval: 30_000 });
  const { data: ticketsPage } = useQuery({
    queryKey: ['support', 'tickets', status, mine],
    queryFn: () => supportApi.list({ status: status || undefined, mine: mine ? 'true' : undefined }),
    refetchInterval: 20_000,
  });

  const tickets = (ticketsPage?.tickets ?? []).filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.user?.name.toLowerCase().includes(q) ||
      t.user?.phone.includes(q)
    );
  });

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // ── Socket ──
  useEffect(() => {
    const socket = connectSupportSocket();
    socketRef.current = socket;

    socket.on('message:new', ({ ticketId, message }: { ticketId: string; message: SupportMessage }) => {
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      qc.invalidateQueries({ queryKey: ['support', 'stats'] });
      if (ticketId === selectedIdRef.current) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        setTyping(false);
        scrollToBottom();
        if (message.senderRole === 'USER') supportApi.read(ticketId).catch(() => {});
      }
    });
    socket.on('ticket:updated', () => {
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      qc.invalidateQueries({ queryKey: ['support', 'stats'] });
    });
    socket.on('typing', ({ ticketId, who }: { ticketId: string; who: string }) => {
      if (ticketId === selectedIdRef.current && who === 'user') {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 3000);
      }
    });

    // Сигнал оператору о новом сообщении пользователя: звук + (если вкладка свёрнута)
    // десктоп-уведомление и счётчик в заголовке вкладки.
    socket.on('agent:notify', ({ ticket }: { ticket: SupportTicket }) => {
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      qc.invalidateQueries({ queryKey: ['support', 'stats'] });
      const isCurrent = ticket.id === selectedIdRef.current;
      const hidden = typeof document !== 'undefined' && document.hidden;
      if (!isCurrent || hidden) playPing();
      if (hidden) {
        unseenRef.current += 1;
        document.title = `(${unseenRef.current}) ${BASE_TITLE}`;
        showDesktopNotification(
          ticket.user?.name ?? 'Новое обращение',
          ticket.lastMessagePreview ?? 'Сообщение в поддержку',
          () => openTicketRef.current?.(ticket),
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc, scrollToBottom]);

  // Разрешение на уведомления + разблокировка звука по первому клику.
  useEffect(() => {
    requestNotifyPermission();
    const unlock = () => ensureAudioUnlocked();
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  // Сброс счётчика непрочитанных в заголовке, когда оператор вернулся на вкладку.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        unseenRef.current = 0;
        document.title = BASE_TITLE;
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    document.title = BASE_TITLE;
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // ── Открытие тикета ──
  const openTicket = useCallback(
    async (t: SupportTicket) => {
      const prev = selectedIdRef.current;
      if (prev && socketRef.current) socketRef.current.emit('ticket:leave', { ticketId: prev });
      setSelected(t);
      selectedIdRef.current = t.id;
      setMessages([]);
      setTyping(false);
      socketRef.current?.emit('ticket:join', { ticketId: t.id });
      const page = await supportApi.messages(t.id);
      setMessages(page.messages);
      scrollToBottom();
      if (t.unreadForAgent > 0) {
        await supportApi.read(t.id).catch(() => {});
        qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      }
    },
    [qc, scrollToBottom],
  );
  openTicketRef.current = openTicket;

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || !selected || sending) return;
    setSending(true);
    setText('');
    try {
      await supportApi.reply(selected.id, { body });
      // сообщение прилетит через socket (мы в комнате) — не дублируем локально
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }, [text, selected, sending]);

  const onAttach = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !selected) return;
      setSending(true);
      try {
        const attachment = await uploadAttachment(file);
        await supportApi.reply(selected.id, { attachment });
      } catch (err) {
        alert('Не удалось загрузить файл');
      } finally {
        setSending(false);
      }
    },
    [selected],
  );

  const setTicketStatus = useCallback(
    async (newStatus: TicketStatus) => {
      if (!selected) return;
      const updated = await supportApi.update(selected.id, { status: newStatus });
      setSelected(updated);
      qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      qc.invalidateQueries({ queryKey: ['support', 'stats'] });
    },
    [selected, qc],
  );

  const claim = useCallback(async () => {
    if (!selected) return;
    const updated = await supportApi.update(selected.id, { assignToMe: 'true' });
    setSelected(updated);
    qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
  }, [selected, qc]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Поддержка"
        subtitle={stats ? `Открытых: ${stats.open} · В ожидании: ${stats.pending} · Без оператора: ${stats.unassigned}` : 'Чаты с пользователями'}
      />
      <div className="flex-1 flex min-h-0">
        {/* Список тикетов */}
        <div className="w-[340px] shrink-0 border-r border-[rgba(20,20,40,0.08)] flex flex-col bg-white">
          <div className="p-3 border-b border-[rgba(20,20,40,0.06)] flex flex-col gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a9a]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени, теме, телефону"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#f5f5f7] outline-none focus:ring-2 ring-[#e61428]/20"
              />
            </div>
            <div className="flex items-center gap-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                    status === tab.key ? 'bg-[#151515] text-white' : 'text-[#666] hover:bg-[#f0f0f2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => setMine((v) => !v)}
                className={`ml-auto px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                  mine ? 'bg-[rgba(230,20,40,0.12)] text-[#e61428]' : 'text-[#666] hover:bg-[#f0f0f2]'
                }`}
              >
                Мои
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 && <div className="p-6 text-center text-xs text-[#9a9a9a]">Нет обращений</div>}
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => openTicket(t)}
                className={`w-full text-left px-4 py-3 border-b border-[rgba(20,20,40,0.05)] transition-colors ${
                  selected?.id === t.id ? 'bg-[rgba(230,20,40,0.05)]' : 'hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[#151515] truncate">{t.user?.name ?? 'Пользователь'}</span>
                  <span className="text-[10px] text-[#9a9a9a] shrink-0">{time(t.lastMessageAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_STYLE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <span className="text-[10px] text-[#9a9a9a] truncate">{t.categoryLabel} · {t.subject}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[11px] text-[#666] truncate">{t.lastMessagePreview}</span>
                  {t.unreadForAgent > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e61428] text-white text-[10px] font-semibold flex items-center justify-center">
                      {t.unreadForAgent}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Панель чата */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0 bg-[#f7f7f8]">
            {/* Шапка тикета */}
            <div className="h-14 shrink-0 bg-white border-b border-[rgba(20,20,40,0.08)] flex items-center gap-3 px-5">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#151515] truncate">{selected.user?.name}</div>
                <div className="text-[11px] text-[#9a9a9a] truncate">
                  {selected.user?.phone} · {selected.categoryLabel} · {selected.subject}
                </div>
              </div>
              <span className={`ml-auto px-2 py-1 rounded text-[11px] font-medium ${STATUS_STYLE[selected.status]}`}>
                {STATUS_LABEL[selected.status]}
              </span>
              {!selected.agentId && (
                <button onClick={claim} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#151515] text-white hover:bg-black transition-colors">
                  <UserPlus size={13} /> Взять
                </button>
              )}
              {selected.status !== 'CLOSED' ? (
                <button onClick={() => setTicketStatus('CLOSED')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[rgba(20,20,40,0.12)] text-[#666] hover:bg-[#f0f0f2] transition-colors">
                  <Lock size={13} /> Закрыть
                </button>
              ) : (
                <button onClick={() => setTicketStatus('OPEN')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[rgba(20,20,40,0.12)] text-[#666] hover:bg-[#f0f0f2] transition-colors">
                  <Unlock size={13} /> Открыть
                </button>
              )}
            </div>

            {/* Сообщения */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
              {typing && (
                <div className="self-start px-3 py-2 rounded-2xl bg-white shadow-sm text-xs text-[#9a9a9a]">печатает…</div>
              )}
            </div>

            {/* Ввод */}
            {selected.status === 'CLOSED' ? (
              <div className="shrink-0 p-4 bg-white border-t border-[rgba(20,20,40,0.08)] text-center text-xs text-[#9a9a9a]">
                Обращение закрыто. Откройте его, чтобы ответить.
              </div>
            ) : (
              <div className="shrink-0 p-3 bg-white border-t border-[rgba(20,20,40,0.08)] flex items-end gap-2">
                <label className="w-10 h-10 shrink-0 rounded-full bg-[#f0f0f2] flex items-center justify-center cursor-pointer hover:bg-[#e8e8ea] transition-colors">
                  <Paperclip size={17} className="text-[#5f5e5e]" />
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onAttach} disabled={sending} />
                </label>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    socketRef.current?.emit('typing', { ticketId: selected.id });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Сообщение…"
                  className="flex-1 resize-none max-h-32 px-4 py-2.5 rounded-2xl bg-[#f5f5f7] text-sm outline-none focus:ring-2 ring-[#e61428]/20"
                />
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  className="w-10 h-10 shrink-0 rounded-full bg-[#e61428] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#c01020] transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[#9a9a9a]">Выберите обращение</div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: SupportMessage }) {
  if (m.senderRole === 'SYSTEM') {
    return (
      <div className="self-center px-3 py-1 rounded-full bg-[rgba(20,20,20,0.05)] text-[11px] text-[#9a9a9a]">
        {m.body} · {time(m.createdAt)}
      </div>
    );
  }
  const isAgent = m.senderRole === 'SUPPORT';
  return (
    <div className={`flex flex-col max-w-[70%] ${isAgent ? 'self-end items-end' : 'self-start items-start'}`}>
      <div
        className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
          isAgent ? 'bg-[#e61428] text-white rounded-br-md' : 'bg-white text-[#151515] shadow-sm rounded-bl-md'
        }`}
      >
        {m.attachment && <Attachment a={m.attachment} dark={isAgent} />}
        {m.body && <span>{m.body}</span>}
      </div>
      <div className={`flex items-center gap-1 mt-0.5 text-[10px] text-[#9a9a9a] ${isAgent ? 'pr-1' : 'pl-1'}`}>
        {time(m.createdAt)}
        {isAgent && (m.readAt ? <CheckCheck size={12} className="text-[#3670d4]" /> : <Check size={12} />)}
      </div>
    </div>
  );
}

function Attachment({ a, dark }: { a: NonNullable<SupportMessage['attachment']>; dark: boolean }) {
  const isImage = (a.mime ?? '').startsWith('image/');
  if (isImage && a.url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <a href={a.url} target="_blank" rel="noreferrer" className="block mb-1">
        <img src={a.url} alt={a.name ?? 'фото'} className="max-w-[240px] max-h-[240px] rounded-xl object-cover" />
      </a>
    );
  }
  return (
    <a
      href={a.url ?? '#'}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 mb-1 underline ${dark ? 'text-white' : 'text-[#3670d4]'}`}
    >
      <Paperclip size={13} /> {a.name ?? 'Файл'}
    </a>
  );
}
