import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { HEADER_ICON_BUTTON_CLASS } from '../../../app/components/headerIconButton';
import { UserAvatar } from './UserAvatar';

export function ProfileHeaderButton() {
  const { t } = useTranslation();

  return (
    <Link
      to={ROUTES.profile}
      aria-label={t('profile.goToProfile')}
      className={HEADER_ICON_BUTTON_CLASS}
    >
      <UserAvatar />
    </Link>
  );
}
