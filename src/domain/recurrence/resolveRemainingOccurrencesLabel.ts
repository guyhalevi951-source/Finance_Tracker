import { type Expense } from '../../types/expense';
import { computeRemainingOccurrences } from './occurrencesRemaining';
import { countConsumedSeriesOccurrences } from './countSeriesOccurrences';

export interface RemainingOccurrencesLabelDescriptor {
  key: string;
  params?: Record<string, string | number>;
}

export function resolveRemainingOccurrencesLabelDescriptor(
  template: Expense,
  expenses: Expense[],
): RemainingOccurrencesLabelDescriptor {
  const rule = template.recurrenceRule;
  if (!rule) {
    return { key: 'profile.settings.recurring.unlimitedOccurrences' };
  }

  const consumedCount = countConsumedSeriesOccurrences(expenses, template);
  const remaining = computeRemainingOccurrences(rule.occurrences, consumedCount);

  if (remaining === null) {
    return { key: 'profile.settings.recurring.unlimitedOccurrences' };
  }

  return {
    key: 'profile.settings.recurring.remainingOccurrences',
    params: { count: remaining },
  };
}
