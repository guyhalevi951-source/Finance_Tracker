import { useTranslation } from 'react-i18next';
import { DateCalendarModal } from '../../../components/calendar/DateCalendarModal';

interface ExpenseDatePickerModalProps {
  open: boolean;
  value: string;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
}

export function ExpenseDatePickerModal({
  open,
  value,
  onConfirm,
  onCancel,
}: ExpenseDatePickerModalProps) {
  const { t } = useTranslation();

  return (
    <DateCalendarModal
      open={open}
      value={value}
      cancelLabel={t('addExpense.dateCancel')}
      confirmLabel={t('addExpense.dateConfirm')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
