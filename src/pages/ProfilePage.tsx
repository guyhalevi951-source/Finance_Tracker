import { useTranslation } from 'react-i18next';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { UserAvatar } from '../features/profile/components/UserAvatar';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';

export function ProfilePage() {
  const { t } = useTranslation();
  const { userId, displayName, isLoading } = useAuthSession();

  useAppHeader({ title: t('profile.pageTitle') });

  const greeting = isLoading
    ? null
    : userId === null
      ? t('profile.greetingGuest')
      : t('profile.greetingUser', {
          name: displayName ?? t('profile.defaultUserName'),
        });

  return (
    <div>
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <UserAvatar />
        {greeting !== null && (
          <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{greeting}</p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          {t('profile.placeholder')}
        </p>
      </div>
    </div>
  );
}
