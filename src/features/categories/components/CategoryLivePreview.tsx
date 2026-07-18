import { type LucideIcon } from 'lucide-react';
import { getCategoryIconComponent } from '../iconRegistry';

interface CategoryLivePreviewProps {
  name: string;
  iconKey: string;
  colorClass: string;
}

export function CategoryLivePreview({ name, iconKey, colorClass }: CategoryLivePreviewProps) {
  const Icon: LucideIcon = getCategoryIconComponent(iconKey);

  return (
    <div className="flex items-center gap-4 px-1 py-2">
      <span
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white flex-shrink-0 ${colorClass}`}
      >
        <Icon className="w-6 h-6" />
      </span>
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{name || '—'}</p>
    </div>
  );
}
