import { useTranslation } from 'react-i18next';
import {
  type OccurrencesLimitPreset,
} from '../../../types/recurrenceRule';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';

const OCCURRENCE_CHIP_PRESETS: OccurrencesLimitPreset[] = [
  '2',
  '3',
  '4',
  '5',
  'custom',
  'unlimited',
];

interface RecurrenceOccurrencesLimitFieldProps {
  occurrencesLimit: OccurrencesLimitPreset;
  customOccurrences: number;
  onOccurrencesLimitChange: (limit: OccurrencesLimitPreset) => void;
  onCustomOccurrencesChange: (value: number) => void;
  occurrencesTitleKey?: string;
  occurrencesCustomLabelKey?: string;
  minCustomOccurrences?: number;
}

export function RecurrenceOccurrencesLimitField({
  occurrencesLimit,
  customOccurrences,
  onOccurrencesLimitChange,
  onCustomOccurrencesChange,
  occurrencesTitleKey = 'addExpense.recurrence.occurrencesTitle',
  occurrencesCustomLabelKey = 'addExpense.recurrence.occurrencesCustomLabel',
  minCustomOccurrences = 2,
}: RecurrenceOccurrencesLimitFieldProps) {
  const { t } = useTranslation();

  const chipLabel = (preset: OccurrencesLimitPreset) => {
    if (preset === 'unlimited') return t('addExpense.recurrence.occurrencesUnlimited');
    if (preset === 'custom') return t('addExpense.recurrence.occurrencesCustom');
    return preset;
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-600">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {t(occurrencesTitleKey)}
      </p>

      <div className="flex flex-wrap gap-2">
        {OCCURRENCE_CHIP_PRESETS.map((preset) => {
          const isActive = occurrencesLimit === preset;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={isActive}
              onClick={() => onOccurrencesLimitChange(preset)}
              className={`min-h-[44px] px-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {chipLabel(preset)}
            </button>
          );
        })}
      </div>

      {occurrencesLimit === 'custom' && (
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-2">
            {t(occurrencesCustomLabelKey)}
          </label>
          <input
            type="number"
            min={minCustomOccurrences}
            value={customOccurrences}
            onChange={(event) =>
              onCustomOccurrencesChange(
                Math.max(minCustomOccurrences, Number(event.target.value) || minCustomOccurrences),
              )
            }
            onWheel={preventNumberInputScroll}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[44px]"
          />
        </div>
      )}
    </div>
  );
}

export function mergeOccurrencesIntoSelection(
  selection: RecurrenceSelection,
  occurrencesLimit: OccurrencesLimitPreset,
  customOccurrences: number,
): RecurrenceSelection {
  return {
    ...selection,
    occurrencesLimit,
    ...(occurrencesLimit === 'custom' ? { customOccurrences } : {}),
  };
}
