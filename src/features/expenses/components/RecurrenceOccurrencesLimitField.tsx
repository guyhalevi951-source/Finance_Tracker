import { useTranslation } from 'react-i18next';
import {
  type OccurrencesLimitPreset,
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import { resolveOccurrencesLimitChipLabelDescriptor } from '../../../domain/recurrence/resolveOccurrencesLimitLabelKey';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';
import { expenseCompactChipClass } from './expenseCompactButtonStyles';

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
  variant?: 'modal' | 'inline';
}

export function RecurrenceOccurrencesLimitField({
  occurrencesLimit,
  customOccurrences,
  onOccurrencesLimitChange,
  onCustomOccurrencesChange,
  occurrencesTitleKey = 'addExpense.recurrence.occurrencesTitle',
  occurrencesCustomLabelKey = 'addExpense.recurrence.occurrencesCustomLabel',
  minCustomOccurrences = 2,
  variant = 'modal',
}: RecurrenceOccurrencesLimitFieldProps) {
  const { t } = useTranslation();

  const chipLabel = (preset: OccurrencesLimitPreset) => {
    const descriptor = resolveOccurrencesLimitChipLabelDescriptor(preset);
    if (descriptor.literal) return descriptor.literal;
    return t(descriptor.key, descriptor.params);
  };

  const wrapperClass =
    variant === 'inline'
      ? 'space-y-2'
      : 'space-y-2 pt-2 border-t border-slate-200 dark:border-slate-600';

  return (
    <div className={wrapperClass}>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {t(occurrencesTitleKey)}
      </p>

      <div className="flex flex-wrap gap-1">
        {OCCURRENCE_CHIP_PRESETS.map((preset) => {
          const isActive = occurrencesLimit === preset;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={isActive}
              onClick={() => onOccurrencesLimitChange(preset)}
              className={`flex-1 min-w-0 min-h-[44px] px-1 py-1.5 rounded-xl ${expenseCompactChipClass} transition-colors ${
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
