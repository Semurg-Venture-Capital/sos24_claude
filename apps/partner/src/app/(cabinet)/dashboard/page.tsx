'use client';

import { useCabinetMe, useCompanyStats, useBookings, useReviews } from '@/lib/cabinet';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновики',
  PENDING: 'Ожидают',
  ACTIVE: 'Активные',
  EXPIRED: 'Истёкшие',
  CANCELLED: 'Отменённые',
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-[#9a9a9a] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-[#151515]">{value}</p>
    </Card>
  );
}

function InsurerDashboard() {
  const { data: stats, isLoading } = useCompanyStats();
  if (isLoading || !stats) return <div className="p-8 text-sm text-[#9a9a9a]">Загрузка…</div>;
  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Всего полисов" value={stats.totalPolicies} />
        <Stat label="Сумма премий" value={formatMoney(stats.premiumSum)} />
        <Stat label="Продуктов в продаже" value={stats.byProduct.length} />
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-[#151515] mb-4">Полисы по статусам</h2>
        {stats.byStatus.length === 0 ? (
          <p className="text-sm text-[#9a9a9a]">Пока нет данных.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {stats.byStatus.map((s) => (
              <div key={s.status} className="px-4 py-3 rounded-xl bg-[#f7f7f8] min-w-32">
                <p className="text-xs text-[#9a9a9a]">{STATUS_LABELS[s.status] ?? s.status}</p>
                <p className="text-lg font-semibold text-[#151515]">{s.count}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-[#151515] mb-4">Полисы по продуктам</h2>
        {stats.byProduct.length === 0 ? (
          <p className="text-sm text-[#9a9a9a]">Пока нет проданных полисов.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.byProduct.map((p) => (
              <div key={p.productId ?? 'none'} className="flex items-center justify-between py-2 border-b border-[var(--color-hairline)] last:border-0">
                <span className="text-sm text-[#151515]">{p.productName}</span>
                <span className="text-sm font-medium text-[#5f5e5e]">{p.count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ServiceDashboard() {
  const { data: bookings } = useBookings();
  const { data: reviews } = useReviews();
  const pending = bookings?.filter((b) => b.status === 'PENDING').length ?? 0;
  const confirmed = bookings?.filter((b) => b.status === 'CONFIRMED').length ?? 0;
  const completed = bookings?.filter((b) => b.status === 'COMPLETED').length ?? 0;
  const avg = reviews && reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Новые записи" value={pending} />
        <Stat label="Подтверждено" value={confirmed} />
        <Stat label="Выполнено" value={completed} />
        <Stat label="Рейтинг" value={avg} />
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-[#151515] mb-4">Последние записи</h2>
        {!bookings || bookings.length === 0 ? (
          <EmptyState title="Записей пока нет" hint="Клиенты увидят вашу точку в приложении и смогут записаться." />
        ) : (
          <div className="flex flex-col gap-2">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-[var(--color-hairline)] last:border-0">
                <div>
                  <p className="text-sm text-[#151515]">{b.userName ?? 'Клиент'}</p>
                  <p className="text-xs text-[#9a9a9a]">{new Date(b.scheduledAt).toLocaleString('ru-RU')}</p>
                </div>
                <span className="text-xs text-[#5f5e5e]">{b.services.join(', ') || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { data: me } = useCabinetMe();
  return (
    <>
      <PageHeader title="Обзор" subtitle={me?.entity.name} />
      {me?.kind === 'INSURER' ? <InsurerDashboard /> : <ServiceDashboard />}
    </>
  );
}
