'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  Handshake,
  BarChart3,
  Settings,
  LogOut,
  Siren,
  Fingerprint,
  Car,
  Radar,
  ChevronDown,
  FileWarning,
  Building2,
  Bell,
  MessageCircle,
  Phone,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAPP_TOOLS, NAPP_GROUPS } from '@/lib/nappTools';
import { SosMark } from '@/components/SosMark';

const NAV = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/users', label: 'Пользователи', icon: Users },
  { href: '/policies', label: 'Полисы', icon: ShieldCheck },
  { href: '/insurance', label: 'Страховые компании', icon: Building2 },
  { href: '/vehicles', label: 'Автомобили', icon: Car },
  { href: '/adjuster', label: 'Аджастер', icon: Siren },
  { href: '/europrotocols', label: 'Европротоколы', icon: FileWarning },
  { href: '/support', label: 'Поддержка', icon: MessageCircle },
  { href: '/call-center', label: 'Колл-центр', icon: Phone },
  { href: '/partners', label: 'Партнёры', icon: Handshake },
  { href: '/health', label: 'Здоровье', icon: HeartPulse },
  { href: '/notifications', label: 'Уведомления', icon: Bell },
  { href: '/myid-test', label: 'MyID данные', icon: Fingerprint },
];

const NAV_DISABLED = [
  { href: '/claims', label: 'Убытки', icon: FileText },
  { href: '/reports', label: 'Отчёты', icon: BarChart3 },
];

export function Sidebar() {
  const path = usePathname();
  const sp = useSearchParams();
  const onNapp = path.startsWith('/napp');
  const [nappOpen, setNappOpen] = useState(onNapp);
  const activeTool = sp.get('tool');

  // Операторы поддержки видят только «Поддержку» и «Колл-центр».
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setRole(localStorage.getItem('sos24_admin_role'));
  }, []);
  const isSupportOnly = role === 'SUPPORT';
  const nav = isSupportOnly ? NAV.filter((n) => n.href === '/support' || n.href === '/call-center') : NAV;

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[#111111] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/[0.07]">
        <SosMark size={22} />
        <span className="font-semibold text-sm tracking-tight">SOS24 Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                active ? 'bg-[rgba(230,20,40,0.15)] text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
              )}
            >
              <Icon size={16} className={cn('shrink-0', active ? 'text-[#e61428]' : 'text-white/40')} />
              <span>{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e61428]" />}
            </Link>
          );
        })}

        {/* ── Отдел NAPP (раскрывающийся блок с подменю) ── */}
        {!isSupportOnly && (
        <>
        <div className="mt-3 pt-3 border-t border-white/[0.07]">
          <button
            onClick={() => setNappOpen((v) => !v)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
              onNapp ? 'bg-[rgba(230,20,40,0.15)] text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
            )}
          >
            <Radar size={16} className={cn('shrink-0', onNapp ? 'text-[#e61428]' : 'text-white/40')} />
            <span className="font-medium">Отдел NAPP</span>
            <ChevronDown size={14} className={cn('ml-auto transition-transform text-white/30', nappOpen && 'rotate-180')} />
          </button>

          {nappOpen && (
            <div className="mt-1 ml-2 pl-3 border-l border-white/[0.07] flex flex-col gap-0.5">
              {NAPP_GROUPS.map((group) => (
                <div key={group} className="mt-1">
                  <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                    {group}
                  </div>
                  {NAPP_TOOLS.filter((t) => t.group === group).map((t) => {
                    const active = onNapp && activeTool === t.key;
                    return (
                      <Link
                        key={t.key}
                        href={`/napp?tool=${t.key}`}
                        className={cn(
                          'block px-3 py-1.5 rounded-lg text-[13px] transition-colors',
                          active ? 'text-[#ff6b6b] bg-[rgba(230,20,40,0.1)]' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]',
                        )}
                      >
                        {t.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disabled (скоро) */}
        <div className="mt-3 pt-3 border-t border-white/[0.07] flex flex-col gap-0.5">
          {NAV_DISABLED.map(({ href, label, icon: Icon }) => (
            <span
              key={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/20 cursor-default"
            >
              <Icon size={16} className="shrink-0 text-white/20" />
              {label}
            </span>
          ))}
        </div>
        </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-white/[0.07] pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
        >
          <Settings size={16} className="text-white/30" />
          Настройки
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('sos24_admin_token');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-[#ff6b6b] hover:bg-[rgba(230,20,40,0.08)] transition-colors w-full text-left"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
