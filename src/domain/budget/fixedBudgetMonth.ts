import { type FixedSubBudgetRecord } from '../../types/budget';
import { resolveMonthBudget, type ResolvedMonthBudget } from './resolveMonthBudget';

/**
 * A fixed budget's `totalAmount` is its default monthly amount. Month overrides and
 * carry-over follow the exact master monthly-budget rules; the default only applies
 * when neither an explicit nor an inherited amount exists for the month.
 */
export function resolveFixedBudgetMonthAmount(
  budget: FixedSubBudgetRecord,
  monthKey: string,
): ResolvedMonthBudget {
  const resolved = resolveMonthBudget(budget.monthOverrides, monthKey);
  if (resolved.source !== 'none') {
    return resolved;
  }
  return { ...resolved, amount: budget.totalAmount, source: 'default' };
}
