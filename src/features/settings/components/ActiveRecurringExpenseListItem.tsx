import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { type AppLocale } from '../../../config/app';
import { type Expense } from '../../../types/expense';
import { type MainCategoryRecord, type SubCategoryRecord } from '../../../types/category';
import { resolveSubCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import { resolveExpenseDisplayLabel } from '../../../domain/expenses/resolveExpenseDisplayLabel';
import { hasBilingualTextContent } from '../../../domain/i18n/buildBilingualText';
import { resolveRecurrenceLabelDescriptorFromRule } from '../../../domain/recurrence/resolveRecurrenceLabelKey';
import { resolveRecurringSeriesDateInfo } from '../../../domain/recurrence/resolveRecurringSeriesDates';
import { resolveSettingsSeriesDisplayFields } from '../../../domain/recurrence/applyRecurringSettingsFieldUpdate';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { formatCurrencyAmount, formatExpenseDateNumeric } from '../../../lib/format/formatDate';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';

interface ActiveRecurringExpenseListItemProps {
  template: Expense;
  expenses: Expense[];
  locale: AppLocale;
  subCategories: SubCategoryRecord[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ActiveRecurringExpenseListItem({
  template,
  expenses,
  locale,
  subCategories,
  onEdit,
  onDelete,
}: ActiveRecurringExpenseListItemProps) {
  const { t } = useTranslation();
  const todayIso = useTodayIso();
  const display = resolveSettingsSeriesDisplayFields(template);

  const categoryLabel = resolveSubCategoryLabel(display.category, subCategories, locale, t);
  const displayExpense = { ...template, ...display };
  const displayName = resolveExpenseDisplayLabel(displayExpense, locale, categoryLabel);
  const hasDescription = hasBilingualTextContent(display.description);

  const rule = template.recurrenceRule;
  const scheduleDescriptor = rule
    ? resolveRecurrenceLabelDescriptorFromRule(rule)
    : { key: 'addExpense.recurrence.never' };
  const scheduleLabel = t(scheduleDescriptor.key, scheduleDescriptor.params);
  const dateInfo = resolveRecurringSeriesDateInfo(template, todayIso);
  const startLabel = formatExpenseDateNumeric(dateInfo.startDateIso, locale);
  const nextLabel = dateInfo.nextOccurrenceDateIso
    ? formatExpenseDateNumeric(dateInfo.nextOccurrenceDateIso, locale)
    : t('profile.settings.recurring.noNextOccurrence');
  const endLabel = dateInfo.endDateIso
    ? formatExpenseDateNumeric(dateInfo.endDateIso, locale)
    : t('profile.settings.recurring.noEndDate');

  return (
    <li className="flex items-center gap-3 px-4 py-4 min-h-[64px]">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          <span className={SEMANTIC_COLORS.expense.valueText}>
            {formatCurrencyAmount(display.amount, locale)}
          </span>
          <span> · {scheduleLabel}</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
          {t('profile.settings.recurring.startDate')}: {startLabel}
          {' · '}
          {t('profile.settings.recurring.nextOccurrence')}: {nextLabel}
          {' · '}
          {t('profile.settings.recurring.endDate')}: {endLabel}
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
