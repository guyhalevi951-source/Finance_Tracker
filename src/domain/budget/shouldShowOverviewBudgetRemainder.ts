import { type TimeGranularity } from '../expenses/periods';

/**
 * Remaining / overspent KPIs are only valid when the overview window has a
 * dedicated budget cap (monthly). Weekly slices do not.
 */
export function shouldShowOverviewBudgetRemainder(granularity: TimeGranularity): boolean {
  return granularity !== 'weekly';
}
