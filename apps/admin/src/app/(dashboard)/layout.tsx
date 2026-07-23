import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SoftphoneProvider } from '@/components/softphone/SoftphoneProvider';
import { SoftphoneWidget } from '@/components/softphone/SoftphoneWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SoftphoneProvider>
      <div className="flex h-full">
        <Suspense fallback={<aside className="w-60 shrink-0 bg-[#111111]" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</div>
      </div>
      {/* Глобальный софтфон-виджет (скрыт на колл-центре) */}
      <SoftphoneWidget />
    </SoftphoneProvider>
  );
}
