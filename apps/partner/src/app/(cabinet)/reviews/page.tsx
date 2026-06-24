'use client';

import { Star } from 'lucide-react';
import { useReviews } from '@/lib/cabinet';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? 'fill-[#f5c850] text-[#f5c850]' : 'text-[#d8d8dc]'} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { data: reviews, isLoading } = useReviews();
  const avg = reviews && reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <>
      <PageHeader title="Отзывы" subtitle={reviews?.length ? `Средний рейтинг ${avg} · ${reviews.length} отзывов` : undefined} />
      <div className="p-8 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-sm text-[#9a9a9a]">Загрузка…</div>
        ) : !reviews || reviews.length === 0 ? (
          <Card><EmptyState title="Отзывов пока нет" hint="Клиенты смогут оставить отзыв после выполненной записи." /></Card>
        ) : (
          reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#151515]">{r.authorName}</span>
                <span className="text-xs text-[#9a9a9a]">{formatDate(r.createdAt)}</span>
              </div>
              <Stars n={r.rating} />
              {r.text && <p className="text-sm text-[#5f5e5e] mt-2">{r.text}</p>}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
