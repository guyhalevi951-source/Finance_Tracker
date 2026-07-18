import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type CustomCategory } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { isBuiltinSubCategoryId } from '../../../domain/categories/hierarchy';
import {
  getBuiltinCategoryI18nKey,
  resolveCustomCategoryLabel,
} from '../../../domain/categories/resolveCategoryLabel';
import { resolveExpenseDisplayLabel } from '../../../domain/expenses/resolveExpenseDisplayLabel';
import { hasBilingualTextContent } from '../../../domain/i18n/buildBilingualText';
import { resolveRecurrenceLabelDescriptorFromRule } from '../../../domain/recurrence/resolveRecurrenceLabelKey';
import { resolveRemainingOccurrencesLabelDescriptor } from '../../../domain/recurrence/resolveRemainingOccurrencesLabel';
import { resolveSettingsSeriesDisplayFields } from '../../../domain/recurrence/applyRecurringSettingsFieldUpdate';
import { formatCurrencyAmount } from '../../../lib/format/formatDate';

interface ActiveRecurringExpenseListItemProps {
  template: Expense;
  expenses: Expense[];
  locale: AppLocale;
  customCategories: CustomCategory[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ActiveRecurringExpenseListItem({
  template,
  expenses,
  locale,
  customCategories,
  onEdit,
  onDelete,
}: ActiveRecurringExpenseListItemProps) {
  const { t } = useTranslation();
  const display = resolveSettingsSeriesDisplayFields(template);

  const categoryLabel = isBuiltinSubCategoryId(display.category)
    ? t(getBuiltinCategoryI18nKey(display.category))
    : (resolveCustomCategoryLabel(display.category, customCategories, locale) ??
      t('category.sub.other.miscellaneous'));
  const displayExpense = { ...template, ...display };
  const displayName = resolveExpenseDisplayLabel(displayExpense, locale, categoryLabel);
  const hasDescription = hasBilingualTextContent(display.description);

  const rule = template.recurrenceRule;
  const scheduleDescriptor = rule
    ? resolveRecurrenceLabelDescriptorFromRule(rule)
    : { key: 'addExpense.recurrence.never' };
  const scheduleLabel = t(scheduleDescriptor.key, scheduleDescriptor.params);
  const remainingDescriptor = resolveRemainingOccurrencesLabelDescriptor(template, expenses);
  const remainingLabel = t(remainingDescriptor.key, remainingDescriptor.params);

  return (
    <li className="flex items-center gap-3 px-4 py-4 min-h-[64px]">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {formatCurrencyAmount(display.amount, locale)} · {scheduleLabel}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
          {remainingLabel}
        </p>
        {hasDescription && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {categoryLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('profile.settings.recurring.editAction')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('profile.settings.recurring.deleteAction')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </li>
  );
}
