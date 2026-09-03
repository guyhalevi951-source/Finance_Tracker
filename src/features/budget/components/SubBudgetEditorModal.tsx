import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type AppLocale } from '../../../config/app';
import { CustomDatePicker } from '../../../components/calendar';
import { parseSubBudgetInput } from '../../../domain/budget/validateSubBudget';
import { toIsoDate } from '../../../domain/expenses/parseExpenseDate';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { type SubBudgetInput, type SubBudgetRecord } from '../../../types/budget';

interface SubBudgetEditorModalProps {
  open: boolean;
  locale: AppLocale;
  editingBudget: SubBudgetRecord | null;
  isSaving: boolean;
  onSave: (input: SubBudgetInput) => Promise<void>;
  onClose: () => void;
}

export function SubBudgetEditorModal({
  open,
  locale,
  editingBudget,
  isSaving,
  onSave,
  onClose,
}: SubBudgetEditorModalProps) {
  const { t } = useTranslation();
  const todayIso = useTodayIso();
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingBudget) {
      setName(editingBudget.name[locale] || editingBudget.name.en);
      setTotalAmount(String(editingBudget.totalAmount));
      setStartDate(editingBudget.startDate);
      setEndDate(editingBudget.endDate);
    } else {
      const today = toIsoDate(new Date());
      setName('');
      setTotalAmount('');
      setStartDate(today);
      setEndDate(today);
    }
    setErrorKey(null);
  }, [open, editingBudget, locale]);

  if (!open) return null;

  const handleSubmit = async () => {
    const parsed = parseSubBudgetInput({ name, totalAmount, startDate, endDate }, todayIso);
    if (!parsed.ok) {
      setErrorKey(`budget.validation.${parsed.error}`);
      return;
    }

    setErrorKey(null);
    try {
      const bilingualName = await createBilingualText(name.trim(), locale);
      await onSave({
        ...parsed.value,
        name: bilingualName,
      });
      onClose();
    } catch {
      setErrorKey('expense.validation.translationError');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {editingBudget ? t('budget.edit.title') : t('budget.add.title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('budget.form.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorKey && (
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{t(errorKey)}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('budget.form.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('budget.form.totalAmount')}
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              onWheel={preventNumberInputScroll}
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('budget.form.startDate')}
            </label>
            <button
              type="button"
              onClick={() => setStartPickerOpen(true)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-start min-h-[48px]"
            >
              {startDate || t('budget.form.selectDate')}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('budget.form.endDate')}
            </label>
            <button
              type="button"
              onClick={() => setEndPickerOpen(true)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-start min-h-[48px]"
            >
              {endDate || t('budget.form.selectDate')}
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 min-h-[48px]"
          >
            {t('budget.form.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium min-h-[48px] disabled:opacity-60"
          >
            {t('budget.form.save')}
          </button>
        </div>
      </div>

      <CustomDatePicker
        open={startPickerOpen}
        value={startDate}
        onConfirm={(iso) => {
          setStartDate(iso);
          setStartPickerOpen(false);
        }}
        onCancel={() => setStartPickerOpen(false)}
      />
      <CustomDatePicker
        open={endPickerOpen}
        value={endDate}
        minDate={todayIso}
        onConfirm={(iso) => {
          setEndDate(iso);
          setEndPickerOpen(false);
        }}
        onCancel={() => setEndPickerOpen(false)}
      />
    </div>
  );
}
