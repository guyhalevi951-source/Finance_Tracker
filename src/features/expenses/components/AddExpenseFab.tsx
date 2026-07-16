import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddExpenseFabProps {
  onClick: () => void;
  hidden?: boolean;
}

export function AddExpenseFab({ onClick, hidden = false }: AddExpenseFabProps) {
  const { t } = useTranslation();
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('addExpense.fab')}
      className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white shadow-lg flex items-center justify-center transition-colors min-h-[56px] min-w-[56px]"
    >
      <Plus className="w-7 h-7" />
    </button>
  );
}
