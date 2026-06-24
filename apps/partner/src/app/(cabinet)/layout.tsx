'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useCabinetMe } from '@/lib/cabinet';

// Какие разделы принадлежат какому типу кабинета (для защиты от ручного ввода URL).
const INSURER_PATHS = ['/company', '/products'];
const SERVICE_PATHS = ['/profile', '/services', '/bookings', '/reviews'];

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { data: me, isLoading, isError } = useCabinetMe();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('sos24_partner_token')) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  // Защита разделов по типу кабинета.
  useEffect(() => {
    if (!me) return;
    if (me.kind === 'INSURER' && SERVICE_PATHS.some((p) => path.startsWith(p))) router.replace('/dashboard');
    if (me.kind === 'SERVICE' && INSURER_PATHS.some((p) => path.startsWith(p))) router.replace('/dashboard');
  }, [me, path, router]);

  if (isLoading || !me) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#9a9a9a]">Загрузка…</div>
    );
  }

  return (
    <div className="flex h-full">
      <Sidebar kind={me.kind} entityName={me.entity.name} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
}
