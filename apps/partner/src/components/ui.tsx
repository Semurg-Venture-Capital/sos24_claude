'use client';

import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 px-8 h-14 border-b border-[var(--color-hairline)] bg-white shrink-0">
      <div className="min-w-0">
        <h1 className="text-[15px] font-semibold text-[#151515] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#9a9a9a] truncate">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-black/[0.06] shadow-sm', className)}>{children}</div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  return (
    <button
      {...props}
      className={cn(
        'h-9 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5',
        variant === 'primary' && 'bg-[#e61428] text-white hover:bg-[#c8111f]',
        variant === 'ghost' && 'bg-[#f0f0f2] text-[#5f5e5e] hover:bg-[#e6e6e9]',
        variant === 'danger' && 'bg-[rgba(230,20,40,0.08)] text-[#e61428] hover:bg-[rgba(230,20,40,0.14)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#5f5e5e]">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 px-3 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm text-[#151515] placeholder:text-[#c0c0c0] outline-none focus:border-[#e61428] transition-colors',
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'px-3 py-2 rounded-lg border border-[rgba(20,20,40,0.12)] bg-[#fafafa] text-sm text-[#151515] placeholder:text-[#c0c0c0] outline-none focus:border-[#e61428] transition-colors resize-y min-h-20',
        props.className,
      )}
    />
  );
}

export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'green' | 'yellow' | 'red' | 'blue' }) {
  const tones: Record<string, string> = {
    gray: 'bg-[#f0f0f2] text-[#5f5e5e]',
    green: 'bg-[rgba(52,211,153,0.15)] text-[#0f9f6e]',
    yellow: 'bg-[rgba(245,200,80,0.2)] text-[#9a7400]',
    red: 'bg-[rgba(230,20,40,0.1)] text-[#e61428]',
    blue: 'bg-[rgba(86,140,255,0.15)] text-[#3b6fe0]',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', tones[tone])}>{children}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-[#5f5e5e]">{title}</p>
      {hint && <p className="text-xs text-[#9a9a9a] mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 h-14 border-b border-[var(--color-hairline)] sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-[#151515]">{title}</h2>
          <button onClick={onClose} className="text-[#9a9a9a] hover:text-[#151515] text-xl leading-none cursor-pointer">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
