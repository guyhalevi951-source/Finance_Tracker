import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';

interface BudgetOverviewButtonProps {
  onOpen: () => void;
}

export function BudgetOverviewButton({ onOpen }: BudgetOverviewButtonProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={ROUTES.overview}
      onClick={onOpen}
      className="w-full min-h-[44px] flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
    >
      {t('budget.list.overview')}
    </Link>
  );
}
