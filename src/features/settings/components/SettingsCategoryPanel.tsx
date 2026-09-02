import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type SettingsPanelDepth = 0 | 1 | 2;

interface SettingsCategoryPanelProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  depth?: SettingsPanelDepth;
  grouped?: boolean;
  children: ReactNode;
}

const DEPTH_HEADER_PADDING: Record<SettingsPanelDepth, string> = {
  0: 'ps-4 pe-4',
  1: 'ps-4 pe-4',
  2: 'ps-6 pe-4',
};

const DEPTH_INDENT: Record<SettingsPanelDepth, string> = {
  0: '',
  1: 'ms-0',
  2: 'ms-4',
};

const DEPTH_BG: Record<SettingsPanelDepth, string> = {
  0: 'bg-white dark:bg-slate-800',
  1: 'bg-slate-100 dark:bg-slate-700/45',
  2: 'bg-slate-200/60 dark:bg-slate-600/25',
};

const DEPTH_ACCENT: Record<SettingsPanelDepth, string> = {
  0: '',
  1: 'border-s-4 border-s-emerald-500/40',
  2: 'border-s-4 border-s-emerald-500/50',
};

const DEPTH_HOVER: Record<SettingsPanelDepth, string> = {
  0: 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
  1: 'hover:bg-slate-200 dark:hover:bg-slate-700/55',
  2: 'hover:bg-slate-300/50 dark:hover:bg-slate-600/35',
};

/** Shared shell for same-depth siblings (level bg + flush stacked accent on start edge). */
export const SETTINGS_DEPTH_SHELL = {
  2: 'border-s-4 border-s-emerald-500/50 bg-slate-200/60 dark:bg-slate-600/25 overflow-hidden',
} as const;

export const SETTINGS_DEPTH_CONTENT_PADDING = 'ps-6 pe-4';

export function SettingsCategoryPanel({
  title,
  open,
  onToggle,
  depth = 0,
  grouped = false,
  children,
}: SettingsCategoryPanelProps) {
  const buttonClass = `w-full flex items-center justify-between py-4 min-h-[56px] ${DEPTH_HEADER_PADDING[depth]} ${DEPTH_HOVER[depth]}`;

  const headerButton = (
    <button type="button" onClick={onToggle} className={buttonClass}>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{title}</span>
      <ChevronDown
        className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );

  if (depth === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {headerButton}
        {open && (
          <div className="border-t border-slate-200 dark:border-slate-700">{children}</div>
        )}
      </div>
    );
  }

  if (grouped) {
    return (
      <div>
        {headerButton}
        {open && (
          <div className="border-t border-slate-200 dark:border-slate-700">{children}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${DEPTH_INDENT[depth]} ${DEPTH_BG[depth]} ${DEPTH_ACCENT[depth]} overflow-hidden`}
    >
      {headerButton}
      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700">{children}</div>
      )}
    </div>
  );
}
