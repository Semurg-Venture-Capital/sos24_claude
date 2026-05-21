import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-[rgba(20,20,40,0.08)] flex items-center justify-between px-6">
      <div>
        <h1 className="text-sm font-semibold text-[#151515]">{title}</h1>
        {subtitle && <p className="text-xs text-[#9a9a9a] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f0f2] transition-colors">
          <Bell size={16} className="text-[#5f5e5e]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e61428]" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-[rgba(20,20,40,0.08)]">
          <div className="w-7 h-7 rounded-full bg-[#e61428] flex items-center justify-center text-white text-xs font-semibold">
            А
          </div>
          <div className="text-xs leading-tight">
            <div className="font-medium text-[#151515]">Администратор</div>
            <div className="text-[#9a9a9a]">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
