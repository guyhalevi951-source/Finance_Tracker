import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus } from 'lucide-react';
import { type AppLocale } from '../../../config/app';
import { MASTER_BUDGET_ID } from '../../../domain/budget/constants';
import { resolveBudgetLabel } from '../../../domain/budget/resolveBudgetLabel';
import { useBudgets } from '../hooks/useBudgets';
import { useSubBudgetEditor } from '../hooks/useSubBudgetEditor';

export function BudgetSwitcher() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { activeBudgetId, activeBudget, activeSubBudgets, setActiveBudgetId } = useBudgets();
  const { openAddSubBudget } = useSubBudgetEditor();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLabel = resolveBudgetLabel(activeBudget, locale, t);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const options = [
    { id: MASTER_BUDGET_ID, label: t('budget.monthlyBudgetTitle') },
    ...activeSubBudgets.map((budget) => ({
      id: budget.id,
      label: resolveBudgetLabel(budget, locale, t),
    })),
  ];

  return (
    <div ref={containerRef} className="relative max-w-[120px] sm:max-w-[160px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-1 min-h-[44px] px-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className="w-4 h-4 shrink-0" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full end-0 mt-1 w-56 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1"
        >
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === activeBudgetId}
                onClick={() => {
                  setActiveBudgetId(option.id);
                  setOpen(false);
                }}
                className={`w-full text-start px-4 py-3 text-sm min-h-[44px] truncate hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  option.id === activeBudgetId
                    ? 'font-semibold text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
          <li className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                openAddSubBudget();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm min-h-[44px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('budget.add.dropdownAction')}</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
