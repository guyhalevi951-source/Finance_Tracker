import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { type CustomCategory } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { groupExpensesByCategory } from '../../../domain/expenses/groupByCategory';
import { isBuiltinCategoryId, resolveCustomCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import { formatCurrencyAmount } from '../../../lib/format/formatDate';
import { getCategoryUI } from '../categoryUi';
import { ExpenseListItem } from './ExpenseListItem';

interface ExpensesByCategoryViewProps {
  expenses: Expense[];
  locale: AppLocale;
  customCategories: CustomCategory[];
  mode: ExpenseBatchMode;
  selectedIds: Set<string>;
  onItemClick: (expense: Expense) => void;
}

export function ExpensesByCategoryView({
  expenses,
  locale,
  customCategories,
  mode,
  selectedIds,
  onItemClick,
}: ExpensesByCategoryViewProps) {
  const { t } = useTranslation();
  const groups = groupExpensesByCategory(expenses);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p className="text-lg">{t('expense.empty.title')}</p>
        <p className="text-sm mt-1">{t('expense.empty.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const { icon: Icon, color } = getCategoryUI(group.categoryId);
        const categoryLabel = isBuiltinCategoryId(group.categoryId)
          ? t(`category.${group.categoryId}`)
          : (resolveCustomCategoryLabel(group.categoryId, customCategories, locale) ?? t('category.other'));
        const isOpen = expanded.has(group.categoryId);

        return (
          <section
            key={group.categoryId}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleExpanded(group.categoryId)}
              className="w-full flex items-center justify-between px-4 py-4 min-h-[56px] hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white ${color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{categoryLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {formatCurrencyAmount(group.total, locale)}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {group.expenses.map((expense) => (
                  <ExpenseListItem
                    key={expense.id}
                    expense={expense}
                    locale={locale}
                    customCategories={customCategories}
                    mode={mode}
                    selected={selectedIds.has(expense.id)}
                    showNestedDate
                    onItemClick={() => onItemClick(expense)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
