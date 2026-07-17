import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { UserAvatar } from './UserAvatar';

export function ProfileHeaderButton() {
  const { t } = useTranslation();

  return (
    <Link
      to={ROUTES.profile}
      aria-label={t('profile.goToProfile')}
      className="flex items-center justify-center min-h-[44px] min-w-[44px] p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-emerald-500"
    >
      <UserAvatar />
    </Link>
  );
}
