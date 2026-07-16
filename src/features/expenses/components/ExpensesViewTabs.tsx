import { useTranslation } from 'react-i18next';

export type ExpensesViewMode = 'date' | 'category';

interface ExpensesViewTabsProps {
  active: ExpensesViewMode;
  onChange: (mode: ExpensesViewMode) => void;
}

export function ExpensesViewTabs({ active, onChange }: ExpensesViewTabsProps) {
  const { t } = useTranslation();

  const tabClass = (mode: ExpensesViewMode) =>
    `flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
      active === mode
        ? 'bg-emerald-600 text-white'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
    }`;

  return (
    <div className="flex gap-2 mb-6">
      <button className={tabClass('date')} onClick={() => onChange('date')}>
        {t('expense.viewByDate')}
      </button>
      <button className={tabClass('category')} onClick={() => onChange('category')}>
        {t('expense.viewByCategory')}
      </button>
    </div>
  );
}
