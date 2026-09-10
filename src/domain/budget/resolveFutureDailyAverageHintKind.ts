import { type TimeGranularity } from '../expenses/periods';

export type FutureDailyAverageHintKind = 'monthly' | 'weekly' | 'includingFuture';

/**
 * Subtitle under the planned daily-average KPI.
 * Timeframe labels apply only when monthly/weekly overview toggle is available.
 */
export function resolveFutureDailyAverageHintKind(
  granularity: TimeGranularity,
  timeframeSelectable: boolean,
): FutureDailyAverageHintKind {
  if (!timeframeSelectable) return 'includingFuture';
  return granularity === 'weekly' ? 'weekly' : 'monthly';
}
