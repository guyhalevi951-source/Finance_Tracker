import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';

interface AddSubBudgetFabProps {
  onClick: () => void;
  hidden?: boolean;
}

export function AddSubBudgetFab({ onClick, hidden = false }: AddSubBudgetFabProps) {
  const { t } = useTranslation();

  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('budget.add.fab')}
      className={`fixed bottom-6 end-6 z-40 w-14 h-14 rounded-full ${SEMANTIC_COLORS.budget.fabBg} text-white shadow-lg flex items-center justify-center transition-colors min-h-[56px] min-w-[56px]`}
    >
      <Plus className="w-7 h-7" />
    </button>
  );
}
