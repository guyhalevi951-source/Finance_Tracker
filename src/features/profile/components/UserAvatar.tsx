import { User } from 'lucide-react';

type UserAvatarSize = 'default' | 'sm';
type UserAvatarVariant = 'default' | 'nav';

interface UserAvatarProps {
  size?: UserAvatarSize;
  variant?: UserAvatarVariant;
}

const sizeClasses: Record<UserAvatarSize, { container: string; icon: string }> = {
  default: { container: 'w-10 h-10', icon: 'w-5 h-5' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
};

const variantClasses: Record<UserAvatarVariant, string> = {
  default: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  nav: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function UserAvatar({ size = 'default', variant = 'default' }: UserAvatarProps) {
  if (variant === 'nav') {
    return (
      <div
        className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${variantClasses.nav}`}
        aria-hidden="true"
      >
        <User className="w-3 h-3" />
      </div>
    );
  }

  const { container, icon } = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${container} ${variantClasses.default}`}
      aria-hidden="true"
    >
      <User className={icon} />
    </div>
  );
}
