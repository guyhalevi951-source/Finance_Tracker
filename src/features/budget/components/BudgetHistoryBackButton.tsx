import { ArrowLeft } from 'lucide-react';

interface BudgetHistoryBackButtonProps {
  onBack: () => void;
  label: string;
}

export function BudgetHistoryBackButton({ onBack, label }: BudgetHistoryBackButtonProps) {
  return (
    <div className="flex items-center gap-2 mb-4 -mt-1">
      <button
        type="button"
        onClick={onBack}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label={label}
      >
        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
      </button>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}
