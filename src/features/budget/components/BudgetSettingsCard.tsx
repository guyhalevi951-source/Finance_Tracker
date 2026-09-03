import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { formatNumber } from '../../../lib/format/formatDate';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';
import { type UseMonthBudgetReturn } from '../hooks/useMonthBudget';
import { Check } from 'lucide-react';

interface BudgetSettingsCardProps extends Pick<
  UseMonthBudgetReturn,
  | 'effectiveAmount'
  | 'carryOverToNext'
  | 'budgetInput'
  | 'showBudgetSaved'
  | 'setBudgetInput'
  | 'handleSetBudget'
  | 'handleCarryOverChange'
> {
  locale: AppLocale;
}

export function BudgetSettingsCard({
  effectiveAmount,
  carryOverToNext,
  budgetInput,
  showBudgetSaved,
  locale,
  setBudgetInput,
  handleSetBudget,
  handleCarryOverChange,
}: BudgetSettingsCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-200">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
        {t('budget.monthlyBudgetTitle')}
      </h2>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            {t('budget.amountLabel')}
          </label>
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onWheel={preventNumberInputScroll}
            placeholder={
              effectiveAmount > 0
                ? t('budget.amountPlaceholderWithCurrent', {
                    amount: formatNumber(effectiveAmount, locale),
                  })
                : t('budget.amountPlaceholder')
            }
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all text-lg"
            min="0"
            step="100"
          />
        </div>
        <button
          onClick={handleSetBudget}
          className={`${SEMANTIC_COLORS.budget.ctaGradient} text-white px-8 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 min-h-[48px]`}
        >
          {showBudgetSaved ? (
            <>
              <Check className="w-5 h-5" />
              {t('budget.savedButton')}
            </>
          ) : (
            t('budget.updateButton')
          )}
        </button>
      </div>

      <label className="flex items-center gap-3 mt-6 min-h-[44px] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={carryOverToNext}
          onChange={(e) => handleCarryOverChange(e.target.checked)}
          className="h-5 w-5 shrink-0 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-700"
        />
        <span className="text-sm text-slate-600 dark:text-slate-300">{t('budget.carryOverToNext')}</span>
      </label>
    </div>
  );
}
