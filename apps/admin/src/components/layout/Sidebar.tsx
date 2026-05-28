'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/users', label: 'Пользователи', icon: Users },
  { href: '/policies', label: 'Полисы', icon: ShieldCheck },
  { href: '/adjuster', label: 'Аджастер', icon: Siren },
  { href: '/claims', label: 'Убытки', icon: FileText, disabled: true },
  { href: '/partners', label: 'Партнёры', icon: Handshake, disabled: true },
  { href: '/reports', label: 'Отчёты', icon: BarChart3, disabled: true },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-[#111111] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/[0.07]">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
          style={{ background: '#e61428' }}
        >
          S
        </div>
        <span className="font-semibold text-sm tracking-tight">SOS24 Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon, disabled }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={disabled ? '#' : href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                active
                  ? 'bg-[rgba(230,20,40,0.15)] text-white'
                  : disabled
                    ? 'text-white/20 cursor-default pointer-events-none'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0',
                  active ? 'text-[#e61428]' : disabled ? 'text-white/20' : 'text-white/40',
                )}
              />
              <span>{label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e61428]" />
              )}
            </Link>
          );
        })}
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
