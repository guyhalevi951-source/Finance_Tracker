import { useTranslation } from 'react-i18next';
import { type TimeGranularity } from '../../../domain/expenses/periods';

interface ExpenseGranularityToggleProps {
  active: TimeGranularity;
  onChange: (granularity: TimeGranularity) => void;
}

const GRANULARITIES: TimeGranularity[] = ['monthly', 'weekly', 'daily'];

export function ExpenseGranularityToggle({ active, onChange }: ExpenseGranularityToggleProps) {
  const { t } = useTranslation();

  const tabClass = (granularity: TimeGranularity) =>
    `flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
      active === granularity
        ? 'bg-emerald-600 text-white'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
    }`;

  return (
    <div className="flex gap-2">
      {GRANULARITIES.map((granularity) => (
        <button
          key={granularity}
          type="button"
          className={tabClass(granularity)}
          onClick={() => onChange(granularity)}
        >
          {t(`expense.time.granularity.${granularity}`)}
        </button>
      ))}
    </div>
  );
}
