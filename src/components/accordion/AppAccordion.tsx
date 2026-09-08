import { type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

export type AppAccordionVariant = 'parent' | 'nested';

export interface AppAccordionProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: () => void;
  variant?: AppAccordionVariant;
  children: ReactNode;
}

const VARIANT_SHELL: Record<AppAccordionVariant, string> = {
  parent:
    'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden',
  nested:
    'bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600/70 overflow-hidden',
};

const VARIANT_HOVER: Record<AppAccordionVariant, string> = {
  parent: 'hover:bg-slate-50 dark:hover:bg-slate-700/40',
  nested: 'hover:bg-slate-200/70 dark:hover:bg-slate-600/40',
};

export const ACCORDION_EMPTY_CONTENT_CLASS =
  'py-5 px-4 text-sm text-slate-500 dark:text-slate-400 text-center';

export function AppAccordion({
  title,
  subtitle,
  icon: Icon,
  open,
  onToggle,
  variant = 'parent',
  children,
}: AppAccordionProps) {
  return (
    <div className={VARIANT_SHELL[variant]}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-4 py-3 min-h-[56px] ${VARIANT_HOVER[variant]}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-900/80 text-slate-700 dark:text-slate-100">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block font-semibold text-slate-800 dark:text-slate-100">{title}</span>
          <span className="block text-sm font-normal text-slate-500 dark:text-slate-400">
            {subtitle}
          </span>
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-slate-400 dark:text-slate-300 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
