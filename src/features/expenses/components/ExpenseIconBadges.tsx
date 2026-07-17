import { Camera, Clock } from 'lucide-react';

interface ExpenseIconBadgesProps {
  hasAttachment: boolean;
  isRecurring: boolean;
}

const badgeClassName =
  'flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800';

export function ExpenseIconBadges({ hasAttachment, isRecurring }: ExpenseIconBadgesProps) {
  if (!hasAttachment && !isRecurring) {
    return null;
  }

  if (hasAttachment && isRecurring) {
    return (
      <span className="absolute -bottom-0.5 -start-0.5 flex flex-col gap-0.5" aria-hidden>
        <span className={`${badgeClassName} bg-sky-500`}>
          <Clock className="w-2.5 h-2.5 text-white" />
        </span>
        <span className={`${badgeClassName} bg-amber-400`}>
          <Camera className="w-2.5 h-2.5 text-slate-800" />
        </span>
      </span>
    );
  }

  if (isRecurring) {
    return (
      <span
        className={`absolute -bottom-0.5 -start-0.5 ${badgeClassName} bg-sky-500`}
        aria-hidden
      >
        <Clock className="w-2.5 h-2.5 text-white" />
      </span>
    );
  }

  return (
    <span
      className={`absolute -bottom-0.5 -start-0.5 ${badgeClassName} bg-amber-400`}
      aria-hidden
    >
      <Camera className="w-2.5 h-2.5 text-slate-800" />
    </span>
  );
}
