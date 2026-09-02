import { useTranslation } from 'react-i18next';
import { Check, Pencil, Trash2 } from 'lucide-react';
import {
  HEADER_ICON_BUTTON_CLASS,
  HEADER_ICON_BUTTON_CONFIRM_CLASS,
  HEADER_ICON_BUTTON_DANGER_CLASS,
} from '../../../app/components/headerIconButton';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { BatchCancelButton } from './DiscardChangesModal';

interface ExpensesHeaderActionsProps {
  mode: ExpenseBatchMode;
  isSaving: boolean;
  onEnterDelete: () => void;
  onEnterEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExpensesHeaderActions({
  mode,
  isSaving,
  onEnterDelete,
  onEnterEdit,
  onConfirm,
  onCancel,
}: ExpensesHeaderActionsProps) {
  const { t } = useTranslation();
  const inBatchMode = mode !== 'view';

  if (inBatchMode) {
    return (
      <div className="flex items-center gap-2">
        <BatchCancelButton onClick={onCancel} />
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSaving}
          aria-label={t('expense.batch.confirm')}
          className={HEADER_ICON_BUTTON_CONFIRM_CLASS}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEnterDelete}
        aria-label={t('expense.batch.deleteMode')}
        className={HEADER_ICON_BUTTON_DANGER_CLASS}
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onEnterEdit}
        aria-label={t('expense.batch.editMode')}
        className={HEADER_ICON_BUTTON_CLASS}
      >
        <Pencil className="w-5 h-5" />
      </button>
    </div>
  );
}
