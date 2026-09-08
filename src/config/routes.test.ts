import { describe, expect, it } from 'vitest';
import { ROUTES, budgetHistoryChartsPath, budgetHistoryDetailPath } from './routes';

describe('budget history routes', () => {
  it('builds the historical charts path from a budget id', () => {
    expect(budgetHistoryChartsPath('abc-123')).toBe('/budget/history/abc-123/charts');
  });

  it('keeps historical charts distinct from history detail', () => {
    expect(ROUTES.budgetHistoryCharts).toBe('/budget/history/:id/charts');
    expect(budgetHistoryChartsPath('abc-123')).not.toBe(budgetHistoryDetailPath('abc-123'));
  });
});
