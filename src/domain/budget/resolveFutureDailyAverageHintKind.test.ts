import { describe, expect, it } from 'vitest';
import { resolveFutureDailyAverageHintKind } from './resolveFutureDailyAverageHintKind';

describe('resolveFutureDailyAverageHintKind', () => {
  it('keeps includingFuture when the timeframe toggle is not available', () => {
    expect(resolveFutureDailyAverageHintKind('monthly', false)).toBe('includingFuture');
    expect(resolveFutureDailyAverageHintKind('weekly', false)).toBe('includingFuture');
  });

  it('returns weekly when weekly view is selected', () => {
    expect(resolveFutureDailyAverageHintKind('weekly', true)).toBe('weekly');
  });

  it('returns monthly for monthly and daily when the timeframe toggle is available', () => {
    expect(resolveFutureDailyAverageHintKind('monthly', true)).toBe('monthly');
    expect(resolveFutureDailyAverageHintKind('daily', true)).toBe('monthly');
  });
});
