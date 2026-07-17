import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SettingsCategoryPanelProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  nested?: boolean;
  children: ReactNode;
}

export function SettingsCategoryPanel({
  title,
  open,
  onToggle,
  nested = false,
  children,
}: SettingsCategoryPanelProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${
        nested ? 'border-s-4 border-s-emerald-500/40 ms-0' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 min-h-[56px] hover:bg-slate-50 dark:hover:bg-slate-700/50"
      >
        <span className="font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700">{children}</div>
      )}
    </div>
  );
}
