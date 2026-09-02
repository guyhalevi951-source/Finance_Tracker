import { User } from 'lucide-react';

type UserAvatarSize = 'default' | 'sm';

interface UserAvatarProps {
  size?: UserAvatarSize;
}

const sizeClasses: Record<UserAvatarSize, { container: string; icon: string }> = {
  default: { container: 'w-10 h-10', icon: 'w-5 h-5' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
};

export function UserAvatar({ size = 'default' }: UserAvatarProps) {
  const { container, icon } = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0 ${container}`}
      aria-hidden="true"
    >
      <User className={icon} />
    </div>
  );
}
