import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '../config/routes';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseDetailsView } from '../features/expenses/components/ExpenseDetailsView';

export function ExpenseDetailPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { id } = useParams<{ id: string }>();

  const { userId } = useAuthSession();
  const { customCategories } = useCategories(userId);
  const { expenses } = useExpenses();

  const expense = expenses.find((e) => e.id === id);

  useAppHeader({ title: t('expense.detailsTitle') });

  if (!expense) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">{t('expense.notFound')}</p>
        <Link
          to={ROUTES.expenses}
          className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('expense.details.back')}
        </Link>
      </div>
    );
  }

  return (
    <ExpenseDetailsView
      expense={expense}
      expenses={expenses}
      locale={locale}
      customCategories={customCategories}
    />
  );
}
