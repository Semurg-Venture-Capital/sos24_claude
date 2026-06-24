'use client';

import { useState } from 'react';
import { useBookings, useSetBookingStatus, type BookingStatus } from '@/lib/cabinet';
import { PageHeader, Card, Button, Badge, EmptyState } from '@/components/ui';
import { cn, formatDateTime, formatPhone } from '@/lib/utils';

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Все' },
  { key: 'PENDING', label: 'Новые' },
  { key: 'CONFIRMED', label: 'Подтверждённые' },
  { key: 'COMPLETED', label: 'Выполненные' },
  { key: 'CANCELLED', label: 'Отменённые' },
];

const STATUS: Record<BookingStatus, { label: string; tone: 'gray' | 'green' | 'yellow' | 'red' | 'blue' }> = {
  PENDING: { label: 'Новая', tone: 'yellow' },
  CONFIRMED: { label: 'Подтверждена', tone: 'blue' },
  COMPLETED: { label: 'Выполнена', tone: 'green' },
  CANCELLED: { label: 'Отменена', tone: 'red' },
};

export default function BookingsPage() {
  const [tab, setTab] = useState('');
  const { data: bookings, isLoading } = useBookings(tab || undefined);
  const setStatus = useSetBookingStatus();

  const act = (id: string, status: BookingStatus) => setStatus.mutate({ id, status });

  return (
    <>
      <PageHeader title="Записи" subtitle="Обновляется автоматически" />
      <div className="px-8 pt-5">
        <div className="flex gap-1 bg-[#f0f0f2] p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('px-3.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer', tab === t.key ? 'bg-white text-[#151515] shadow-sm' : 'text-[#5f5e5e] hover:text-[#151515]')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-8 pt-5 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-sm text-[#9a9a9a]">Загрузка…</div>
        ) : !bookings || bookings.length === 0 ? (
          <Card><EmptyState title="Записей нет" /></Card>
        ) : (
          bookings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#151515]">{b.userName ?? 'Клиент'}</span>
                    <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
                  </div>
                  {b.userPhone && <p className="text-xs text-[#9a9a9a]">{formatPhone(b.userPhone)}</p>}
                  <p className="text-xs text-[#5f5e5e] mt-1">🗓 {formatDateTime(b.scheduledAt)}</p>
                  {b.services.length > 0 && <p className="text-xs text-[#9a9a9a] mt-1">Услуги: {b.services.join(', ')}</p>}
                  {b.comment && <p className="text-xs text-[#9a9a9a] mt-1 italic">«{b.comment}»</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {b.status === 'PENDING' && (
                    <>
                      <Button onClick={() => act(b.id, 'CONFIRMED')} disabled={setStatus.isPending}>Подтвердить</Button>
                      <Button variant="danger" onClick={() => act(b.id, 'CANCELLED')} disabled={setStatus.isPending}>Отклонить</Button>
                    </>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <>
                      <Button onClick={() => act(b.id, 'COMPLETED')} disabled={setStatus.isPending}>Завершить</Button>
                      <Button variant="danger" onClick={() => act(b.id, 'CANCELLED')} disabled={setStatus.isPending}>Отменить</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
