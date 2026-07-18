import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Folder,
  ImageIcon,
} from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type SubCategoryRecord } from '../../../types/category';
import { resolveSubCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { hasBilingualTextContent } from '../../../domain/i18n/buildBilingualText';
import { ROUTES } from '../../../config/routes';
import { type AppLocale } from '../../../config/app';
import { resolveRecurrenceRuleForExpense } from '../../../domain/recurrence/resolveRecurrenceRuleForExpense';
import { resolveRecurrenceLabelDescriptorFromRule } from '../../../domain/recurrence/resolveRecurrenceLabelKey';

import { formatCurrencyAmount, formatExpenseDateLong } from '../../../lib/format/formatDate';

interface ExpenseDetailsViewProps {
  expense: Expense;
  expenses: Expense[];
  locale: AppLocale;
  subCategories: SubCategoryRecord[];
}

export function ExpenseDetailsView({
  expense,
  expenses,
  locale,
  subCategories,
}: ExpenseDetailsViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const categoryLabel = resolveSubCategoryLabel(expense.category, subCategories, locale, t);

  const recurrenceRule = resolveRecurrenceRuleForExpense(expenses, expense);
  const recurrenceDescriptor = recurrenceRule
    ? resolveRecurrenceLabelDescriptorFromRule(recurrenceRule)
    : null;
  const recurrenceLabel = recurrenceDescriptor
    ? t(recurrenceDescriptor.key, recurrenceDescriptor.params)
    : null;

  const rows = [
    { icon: Folder, label: t('expense.details.category'), value: categoryLabel },
    ...(hasBilingualTextContent(expense.description)
      ? [{
          icon: FileText,
          label: t('expense.details.description'),
          value: resolveBilingualText(expense.description, locale),
        }]
      : []),
    {
      icon: CreditCard,
      label: t('expense.details.paymentMethod'),
      value: t(`expense.paymentMethod.${expense.paymentMethod}`),
    },
    {
      icon: Calendar,
      label: t('expense.details.date'),
      value: formatExpenseDateLong(expense.date, locale),
    },
  ];

  if (expense.attachmentUrl) {
    rows.push({
      icon: ImageIcon,
      label: t('expense.details.attachment'),
      value: '',
    });
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate(ROUTES.expenses)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
          aria-label={t('expense.details.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <p className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        {formatCurrencyAmount(expense.amount, locale)}
      </p>

      {recurrenceLabel && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
          {t('expense.details.recurringExpense', { schedule: recurrenceLabel })}
        </p>
      )}

      {!recurrenceLabel && <div className="mb-6" />}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-4 px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              {expense.attachmentUrl && label === t('expense.details.attachment') ? (
                <img
                  src={expense.attachmentUrl}
                  alt={t('expense.details.attachment')}
                  className="mt-2 max-h-48 rounded-xl border border-slate-200 dark:border-slate-600 object-contain"
                />
              ) : (
                <p className="text-base font-medium text-slate-800 dark:text-slate-100 mt-1 break-words">
                  {value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
