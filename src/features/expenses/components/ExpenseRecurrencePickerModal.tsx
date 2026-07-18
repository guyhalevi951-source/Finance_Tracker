import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import {
  DEFAULT_RECURRENCE_SELECTION,
  type OccurrencesLimitPreset,
  RECURRENCE_PRESET_IDS,
  type RecurrenceCustomMode,
  type RecurrencePresetId,
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import { validateRecurrenceSelection } from '../../../domain/recurrence/validateRecurrenceRule';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';
import {
  mergeOccurrencesIntoSelection,
  RecurrenceOccurrencesLimitField,
} from './RecurrenceOccurrencesLimitField';

const WEEKDAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

const WEEKDAY_I18N_KEYS = [
  'weekdaySun',
  'weekdayMon',
  'weekdayTue',
  'weekdayWed',
  'weekdayThu',
  'weekdayFri',
  'weekdaySat',
] as const;

interface ExpenseRecurrencePickerModalProps {
  open: boolean;
  value: RecurrenceSelection;
  onSelect: (selection: RecurrenceSelection) => void;
  onClose: () => void;
  occurrencesTitleKey?: string;
  occurrencesCustomLabelKey?: string;
  minCustomOccurrences?: number;
  hideOccurrencesField?: boolean;
}

function resolvePresetLabelKey(preset: RecurrencePresetId, selection: RecurrenceSelection): string {
  if (preset === 'custom') {
    if (selection.customMode === 'intervalDays') {
      return 'addExpense.recurrence.everyDays';
    }
    return 'addExpense.recurrence.customWeekdays';
  }
  return `addExpense.recurrence.${preset}`;
}

function resolvePresetLabelParams(
  preset: RecurrencePresetId,
  selection: RecurrenceSelection,
): Record<string, string | number> | undefined {
  if (preset === 'custom' && selection.customMode === 'intervalDays') {
    return { count: selection.customIntervalDays ?? 1 };
  }
  return undefined;
}

export function ExpenseRecurrencePickerModal({
  open,
  value,
  onSelect,
  onClose,
  occurrencesTitleKey,
  occurrencesCustomLabelKey,
  minCustomOccurrences,
  hideOccurrencesField = false,
}: ExpenseRecurrencePickerModalProps) {
  const { t } = useTranslation();
  const [pendingPreset, setPendingPreset] = useState<RecurrencePresetId>('never');
  const [presetListExpanded, setPresetListExpanded] = useState(true);
  const [customFormActive, setCustomFormActive] = useState(false);
  const [customMode, setCustomMode] = useState<RecurrenceCustomMode>('intervalDays');
  const [intervalDays, setIntervalDays] = useState(2);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [occurrencesLimit, setOccurrencesLimit] = useState<OccurrencesLimitPreset>('unlimited');
  const [customOccurrences, setCustomOccurrences] = useState(2);
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPendingPreset(value.preset);
    setCustomFormActive(false);
    setPresetListExpanded(value.preset === 'never');
    setCustomMode(value.customMode ?? 'intervalDays');
    setIntervalDays(value.customIntervalDays ?? 2);
    setWeekdays(value.customWeekdays ?? []);
    setOccurrencesLimit(value.occurrencesLimit ?? 'unlimited');
    setCustomOccurrences(value.customOccurrences ?? 2);
    setValidationErrorKey(null);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const isRecurring = pendingPreset !== 'never';
  const showBackArrow = !presetListExpanded;

  const resolveOccurrencesForMerge = () => {
    if (hideOccurrencesField) {
      return {
        limit: value.occurrencesLimit ?? 'unlimited',
        custom: value.customOccurrences ?? 2,
      };
    }
    return { limit: occurrencesLimit, custom: customOccurrences };
  };

  const handleBackToPresetList = () => {
    setCustomFormActive(false);
    setPresetListExpanded(true);
    setValidationErrorKey(null);
  };

  const handlePresetSelect = (preset: RecurrencePresetId) => {
    if (preset === 'never') {
      onSelect({ preset: 'never' });
      onClose();
      return;
    }

    if (preset === 'custom') {
      setPendingPreset('custom');
      setCustomFormActive(true);
      setPresetListExpanded(false);
      setValidationErrorKey(null);
      return;
    }

    setPendingPreset(preset);
    setCustomFormActive(false);
    setPresetListExpanded(false);
    setValidationErrorKey(null);
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    );
  };

  const buildSelection = (): RecurrenceSelection => {
    if (pendingPreset === 'custom') {
      return customMode === 'intervalDays'
        ? {
            preset: 'custom',
            customMode: 'intervalDays',
            customIntervalDays: intervalDays,
          }
        : {
            preset: 'custom',
            customMode: 'weekdays',
            customWeekdays: weekdays,
          };
    }

    return { preset: pendingPreset };
  };

  const handleConfirm = () => {
    const baseSelection = buildSelection();
    const { limit, custom } = resolveOccurrencesForMerge();
    const selection = mergeOccurrencesIntoSelection(baseSelection, limit, custom);

    const error = validateRecurrenceSelection(selection);
    if (error) {
      setValidationErrorKey(`addExpense.validation.${error}`);
      return;
    }

    onSelect(selection);
    onClose();
  };

  const handleCustomConfirm = () => {
    const baseSelection = buildSelection();
    const { limit, custom } = resolveOccurrencesForMerge();
    const selection = mergeOccurrencesIntoSelection(baseSelection, limit, custom);

    const error = validateRecurrenceSelection(selection);
    if (error) {
      setValidationErrorKey(`addExpense.validation.${error}`);
      return;
    }

    setPendingPreset('custom');
    setCustomFormActive(false);
    setPresetListExpanded(false);
    setValidationErrorKey(null);
  };

  const collapsedSelection: RecurrenceSelection =
    pendingPreset === 'custom'
      ? {
          preset: 'custom',
          customMode,
          customIntervalDays: intervalDays,
          customWeekdays: weekdays,
          occurrencesLimit,
          ...(occurrencesLimit === 'custom' ? { customOccurrences } : {}),
        }
      : mergeOccurrencesIntoSelection({ preset: pendingPreset }, occurrencesLimit, customOccurrences);

  const selectedPresetLabelKey = resolvePresetLabelKey(pendingPreset, collapsedSelection);
  const selectedPresetLabelParams = resolvePresetLabelParams(pendingPreset, collapsedSelection);

  const renderPresetButton = (presetId: RecurrencePresetId, isSelected: boolean) => (
    <li key={presetId}>
      <button
        type="button"
        onClick={() => handlePresetSelect(presetId)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] transition-colors ${
          isSelected
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
            : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        <span className="flex-1 text-start font-medium">
          {t(`addExpense.recurrence.${presetId}`)}
        </span>
        {isSelected && presetId !== 'custom' && (
          <Check className="w-5 h-5 shrink-0" aria-hidden />
        )}
      </button>
    </li>
  );

  const renderOccurrencesField = () => {
    if (hideOccurrencesField) return null;

    return (
      <RecurrenceOccurrencesLimitField
        occurrencesLimit={occurrencesLimit}
        customOccurrences={customOccurrences}
        onOccurrencesLimitChange={setOccurrencesLimit}
        onCustomOccurrencesChange={setCustomOccurrences}
        occurrencesTitleKey={occurrencesTitleKey}
        occurrencesCustomLabelKey={occurrencesCustomLabelKey}
        minCustomOccurrences={minCustomOccurrences}
      />
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-recurrence-picker-title"
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          {showBackArrow && (
            <button
              type="button"
              onClick={handleBackToPresetList}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 shrink-0"
              aria-label={t('addExpense.recurrence.back')}
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}
          <h3
            id="expense-recurrence-picker-title"
            className="flex-1 text-lg font-semibold text-slate-800 dark:text-slate-100"
          >
            {t('addExpense.recurrence.pickerTitle')}
          </h3>
        </div>

        {validationErrorKey && (
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{t(validationErrorKey)}</p>
        )}

        {customFormActive ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomMode('intervalDays')}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] ${
                  customMode === 'intervalDays'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {t('addExpense.recurrence.customModeInterval')}
              </button>
              <button
                type="button"
                onClick={() => setCustomMode('weekdays')}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] ${
                  customMode === 'weekdays'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {t('addExpense.recurrence.customModeWeekdays')}
              </button>
            </div>

            {customMode === 'intervalDays' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300 shrink-0">
                  {t('addExpense.recurrence.intervalLabel')}
                </span>
                <input
                  type="number"
                  min={1}
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                  onWheel={preventNumberInputScroll}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[44px] text-center"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {t('addExpense.recurrence.intervalSuffix')}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_INDICES.map((day) => {
                  const isActive = weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => toggleWeekday(day)}
                      className={`min-w-[44px] min-h-[44px] px-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t(`addExpense.recurrence.${WEEKDAY_I18N_KEYS[day]}`)}
                    </button>
                  );
                })}
              </div>
            )}

            {renderOccurrencesField()}

            <button
              type="button"
              onClick={handleCustomConfirm}
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium min-h-[48px]"
            >
              {t('addExpense.recurrence.confirm')}
            </button>
          </div>
        ) : presetListExpanded ? (
          <ul className="space-y-2">
            {RECURRENCE_PRESET_IDS.map((presetId) =>
              renderPresetButton(presetId, presetId === pendingPreset),
            )}
          </ul>
        ) : (
          <>
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 mb-4">
              <span className="flex-1 text-start font-medium">
                {t(selectedPresetLabelKey, selectedPresetLabelParams)}
              </span>
              <Check className="w-5 h-5 shrink-0" aria-hidden />
            </div>

            {renderOccurrencesField()}

            {isRecurring && (
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full mt-4 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium min-h-[48px]"
              >
                {t('addExpense.recurrence.confirm')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_RECURRENCE_SELECTION };
