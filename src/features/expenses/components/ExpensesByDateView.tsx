import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { type MainCategoryRecord, type SubCategoryRecord } from '../../../types/category';
import { type SubBudgetRecord } from '../../../types/budget';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { groupExpensesByDate } from '../../../domain/expenses/groupByDate';
import { formatCurrencyAmount, formatExpenseDateLong } from '../../../lib/format/formatDate';
import { ExpenseListItem } from './ExpenseListItem';

interface ExpensesByDateViewProps {
  expenses: Expense[];
  locale: AppLocale;
  mainCategories: MainCategoryRecord[];
  subCategories: SubCategoryRecord[];
  subBudgets?: SubBudgetRecord[];
  isMaster: boolean;
  mode: ExpenseBatchMode;
  selectedIds: Set<string>;
  onItemClick: (expense: Expense) => void;
}

export function ExpensesByDateView({
  expenses,
  locale,
  mainCategories,
  subCategories,
  subBudgets = [],
  isMaster,
  mode,
  selectedIds,
  onItemClick,
}: ExpensesByDateViewProps) {
  const { t } = useTranslation();
  const groups = groupExpensesByDate(expenses);

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p className="text-lg">{t('expense.empty.title')}</p>
        <p className="text-sm mt-1">{t('expense.empty.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section
          key={group.date}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">
              {formatExpenseDateLong(group.date, locale)}
            </h2>
            <span className={`font-semibold ${SEMANTIC_COLORS.expense.valueText}`}>
              {formatCurrencyAmount(group.total, locale)}
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {group.expenses.map((expense) => (
              <ExpenseListItem
                key={expense.id}
                expense={expense}
                locale={locale}
                mainCategories={mainCategories}
                subCategories={subCategories}
                subBudgets={subBudgets}
                isMaster={isMaster}
                mode={mode}
                selected={selectedIds.has(expense.id)}
                onItemClick={() => onItemClick(expense)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
