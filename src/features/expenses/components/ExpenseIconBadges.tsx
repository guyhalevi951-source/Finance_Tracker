import { type ReactNode } from 'react';
import { Camera, Clock, Wallet } from 'lucide-react';

interface ExpenseIconBadgesProps {
  hasAttachment: boolean;
  isRecurring: boolean;
  hasSubBudget?: boolean;
}

const badgeClassName =
  'flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800';

export function ExpenseIconBadges({
  hasAttachment,
  isRecurring,
  hasSubBudget = false,
}: ExpenseIconBadgesProps) {
  const badges: Array<{ key: string; className: string; icon: ReactNode }> = [];

  if (isRecurring) {
    badges.push({
      key: 'recurring',
      className: 'bg-sky-500',
      icon: <Clock className="w-2.5 h-2.5 text-white" />,
    });
  }
  if (hasAttachment) {
    badges.push({
      key: 'attachment',
      className: 'bg-amber-400',
      icon: <Camera className="w-2.5 h-2.5 text-slate-800" />,
    });
  }
  if (hasSubBudget) {
    badges.push({
      key: 'subBudget',
      className: 'bg-amber-500',
      icon: <Wallet className="w-2.5 h-2.5 text-white" />,
    });
  }

  if (badges.length === 0) return null;

  if (badges.length === 1) {
    const badge = badges[0];
    return (
      <span
        className={`absolute -bottom-0.5 -start-0.5 ${badgeClassName} ${badge.className}`}
        aria-hidden
      >
        {badge.icon}
      </span>
    );
  }

  return (
    <span className="absolute -bottom-0.5 -start-0.5 flex flex-col gap-0.5" aria-hidden>
      {badges.map((badge) => (
        <span key={badge.key} className={`${badgeClassName} ${badge.className}`}>
          {badge.icon}
        </span>
      ))}
    </span>
  );
}
