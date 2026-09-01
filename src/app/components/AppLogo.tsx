import { useTranslation } from 'react-i18next';
import appLogoSrc from '../../assets/branding/app-logo.png';

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className = 'w-10 h-10' }: AppLogoProps) {
  const { t } = useTranslation();

  return (
    <img
      src={appLogoSrc}
      alt={t('app.name')}
      className={`rounded-full object-contain shrink-0 ${className}`}
      draggable={false}
    />
  );
}
