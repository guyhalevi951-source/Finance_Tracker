import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { type AppLocale } from '../config/app';
import { budgetHistoryDetailPath } from '../config/routes';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { formatExpenseDateNumeric } from '../lib/format/formatDate';

export function BudgetHistoryPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { archivedSubBudgets, deleteArchivedSubBudgetAction } = useBudgets();

  useAppHeader({ title: t('budget.history.title') });

  return (
    <div>
      {archivedSubBudgets.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-12">
          {t('budget.history.empty')}
        </p>
      ) : (
        <ul className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
          {archivedSubBudgets.map((budget) => (
            <li key={budget.id} className="flex items-stretch">
              <Link
                to={budgetHistoryDetailPath(budget.id)}
                className="flex flex-1 flex-col gap-1 px-4 py-4 min-h-[56px] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {resolveBudgetLabel(budget, locale, t)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatExpenseDateNumeric(budget.startDate, locale)} –{' '}
                  {formatExpenseDateNumeric(budget.endDate, locale)}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void deleteArchivedSubBudgetAction(budget.id)}
                aria-label={t('budget.history.delete')}
                className="flex items-center justify-center px-4 min-w-[56px] min-h-[56px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shrink-0"
              >
                <Trash2 className="w-5 h-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
