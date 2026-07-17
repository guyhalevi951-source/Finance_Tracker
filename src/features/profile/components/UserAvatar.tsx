import { User } from 'lucide-react';

export function UserAvatar() {
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0"
      aria-hidden="true"
    >
      <User className="w-5 h-5" />
    </div>
  );
}
