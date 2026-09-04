import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { Check } from 'lucide-react';

import { type AppLocale } from '../../../config/app';

import { SEMANTIC_COLORS } from '../../../config/semanticColors';

import { getMonthBounds } from '../../../domain/expenses/periods';

import { formatCurrencyAmount, formatExpenseDateNumeric } from '../../../lib/format/formatDate';

import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';

import { ExpenseTimeNavigator } from '../../expenses/components/ExpenseTimeNavigator';

import { BudgetOverviewButton } from './BudgetOverviewButton';

import { type UseMonthBudgetReturn } from '../hooks/useMonthBudget';



export const BUDGET_LIST_ROW_LAYOUT = 'px-4 py-5 min-h-[96px]';



/** Matches 3 sub-budget action icons: 3×44px + 2×12px gap-3 */

export const BUDGET_ACTION_CLUSTER_WIDTH_CLASS = 'w-[156px] max-w-[156px]';



export interface MasterBudgetListRowProps {

  locale: AppLocale;

  year: number;

  month: number;

  monthLabel: string;

  goToPreviousMonth: () => void;

  goToNextMonth: () => void;

  selectMonth: (year: number, month: number) => void;

  monthBudget: Pick<

    UseMonthBudgetReturn,

    | 'effectiveAmount'

    | 'carryOverToNext'

    | 'budgetSource'

    | 'showCarryOverCheckbox'

    | 'budgetInput'

    | 'showBudgetSaved'

    | 'setBudgetInput'

    | 'handleSetBudget'

    | 'handleCarryOverChange'

    | 'handleResetBudget'

  >;

  onOpenOverview: () => void;

}



export function MasterBudgetListRow({

  locale,

  year,

  month,

  monthLabel,

  goToPreviousMonth,

  goToNextMonth,

  selectMonth,

  monthBudget,

  onOpenOverview,

}: MasterBudgetListRowProps) {

  const { t } = useTranslation();

  const {

    effectiveAmount,

    carryOverToNext,

    budgetSource,

    showCarryOverCheckbox,

    budgetInput,

    showBudgetSaved,

    setBudgetInput,

    handleSetBudget,

    handleCarryOverChange,

    handleResetBudget,

  } = monthBudget;



  const isEnglish = locale === 'en';



  const monthRange = useMemo(() => getMonthBounds(year, month), [year, month]);

  const dateRangeLabel = `${formatExpenseDateNumeric(monthRange.startIso, locale)} – ${formatExpenseDateNumeric(monthRange.endIso, locale)}`;



  const controlRowClass = isEnglish ? 'ltr:flex-row-reverse' : 'rtl:flex-row-reverse';

  const updateButtonClass = isEnglish

    ? 'px-1.5 py-1 text-[11px] min-h-[40px]'

    : 'px-2 py-1.5 text-xs min-h-[44px]';

  const carryoverLabelClass = isEnglish

    ? 'flex-1 min-w-0 text-[11px] leading-4 whitespace-nowrap'

    : 'flex-1 text-base leading-snug';

  const carryoverRowClass = isEnglish ? 'items-center' : 'items-start';

  const carryoverCheckboxClass = isEnglish

    ? 'h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-700'

    : 'h-4 w-4 shrink-0 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-700';



  return (

    <div

      className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 ${BUDGET_LIST_ROW_LAYOUT} border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40`}

    >

      <div className="min-w-0">

        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">

          {t('budget.monthlyBudgetTitle')}

        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{dateRangeLabel}</p>

        <p className={`flex items-center gap-2 mt-1 ${SEMANTIC_COLORS.budget.valueText}`}>

          <span className="text-sm tabular-nums">

            {budgetSource === 'none' ? '-' : formatCurrencyAmount(effectiveAmount, locale)}

          </span>

          {budgetSource === 'explicit' && (

            <button

              type="button"

              onClick={handleResetBudget}

              className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 min-h-[44px] px-1 shrink-0 transition-colors"

            >

              {t('budget.resetButton')}

            </button>

          )}

        </p>

        <span className="sr-only">{t('budget.list.masterLocked')}</span>

      </div>



      <div className="justify-self-center self-start shrink-0">

        <ExpenseTimeNavigator

          variant="masterRow"

          year={year}

          month={month}

          monthLabel={monthLabel}

          onPrevious={goToPreviousMonth}

          onNext={goToNextMonth}

          onSelectMonth={selectMonth}

        />

      </div>



      <div

        className={`justify-self-end flex flex-col items-stretch gap-1 shrink-0 ${BUDGET_ACTION_CLUSTER_WIDTH_CLASS}`}

      >

        <div className={`flex items-center gap-1.5 ${controlRowClass}`}>

          <input

            type="number"

            value={budgetInput}

            onChange={(e) => setBudgetInput(e.target.value)}

            onWheel={preventNumberInputScroll}

            placeholder=""

            aria-label={t('budget.amountLabel')}

            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none min-h-[44px] text-xs"

            min="0"

            step="100"

          />

          <button

            type="button"

            onClick={handleSetBudget}

            className={`${SEMANTIC_COLORS.budget.ctaGradient} shrink-0 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-1 whitespace-nowrap ${updateButtonClass}`}

          >

            {showBudgetSaved ? (

              <>

                <Check className="w-4 h-4" />

                {t('budget.savedButton')}

              </>

            ) : (

              t('budget.updateButton')

            )}

          </button>

        </div>

        {showCarryOverCheckbox && (

          <label className={`flex gap-1.5 cursor-pointer select-none w-full ${carryoverRowClass}`}>

            <input

              type="checkbox"

              checked={carryOverToNext}

              onChange={(e) => handleCarryOverChange(e.target.checked)}

              className={carryoverCheckboxClass}

            />

            <span className={`text-slate-600 dark:text-slate-300 ${carryoverLabelClass}`}>

              {t('budget.carryOverToNext')}

            </span>

          </label>

        )}

        <BudgetOverviewButton onOpen={onOpenOverview} />

      </div>

    </div>

  );

}


