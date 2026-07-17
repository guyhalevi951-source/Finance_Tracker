import {
  type OccurrencesLimitPreset,
  type RecurrenceRule,
  type RecurrenceSelection,
} from '../../types/recurrenceRule';

export function remainingOccurrencesToRuleLimit(
  remaining: number | null,
  currentCount: number,
): number | null {
  if (remaining === null) {
    return null;
  }

  return currentCount + remaining;
}

export function computeRemainingOccurrences(
  ruleLimit: number | null,
  currentCount: number,
): number | null {
  if (ruleLimit === null) {
    return null;
  }

  return Math.max(0, ruleLimit - currentCount);
}

export function ruleLimitToRemainingSelection(
  rule: RecurrenceRule,
  currentCount: number,
): Pick<RecurrenceSelection, 'occurrencesLimit' | 'customOccurrences'> {
  const remaining = computeRemainingOccurrences(rule.occurrences, currentCount);

  if (remaining === null) {
    return { occurrencesLimit: 'unlimited' };
  }

  if (remaining >= 2 && remaining <= 5) {
    return { occurrencesLimit: String(remaining) as OccurrencesLimitPreset };
  }

  return {
    occurrencesLimit: 'custom',
    customOccurrences: remaining,
  };
}
