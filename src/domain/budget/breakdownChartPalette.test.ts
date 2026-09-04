import { describe, expect, it } from 'vitest';
import {
  assignBreakdownChartSliceColors,
  BREAKDOWN_CHART_COLOR_PALETTE,
  resolveBreakdownChartSliceColor,
} from './breakdownChartPalette';

describe('assignBreakdownChartSliceColors', () => {
  it('assigns a unique color to each slice', () => {
    const colors = assignBreakdownChartSliceColors([
      { kind: 'category', id: 'food' },
      { kind: 'category', id: 'rent' },
      { kind: 'subBudget', id: 'sub-a' },
    ]);

    expect(colors.size).toBe(3);
    expect(new Set(colors.values()).size).toBe(3);
  });

  it('avoids category colors for sub-budgets when palette has alternatives', () => {
    const slices = BREAKDOWN_CHART_COLOR_PALETTE.slice(0, 2).map((_, index) => ({
      kind: 'category' as const,
      id: `cat-${index}`,
    }));

    const colors = assignBreakdownChartSliceColors([
      ...slices,
      { kind: 'subBudget', id: 'sub-a' },
    ]);

    const categoryColors = new Set(
      slices.map((slice) => colors.get(`category:${slice.id}`)),
    );
    expect(categoryColors.has(colors.get('subBudget:sub-a'))).toBe(false);
  });

  it('is stable for the same slice descriptors', () => {
    const descriptors = [
      { kind: 'category' as const, id: 'food' },
      { kind: 'subBudget' as const, id: 'sub-z' },
      { kind: 'subBudget' as const, id: 'sub-a' },
    ];
    const first = assignBreakdownChartSliceColors(descriptors);
    const second = assignBreakdownChartSliceColors(descriptors);

    expect([...first.entries()]).toEqual([...second.entries()]);
  });
});

describe('resolveBreakdownChartSliceColor', () => {
  it('returns mapped color or palette fallback', () => {
    const map = assignBreakdownChartSliceColors([{ kind: 'category', id: 'food' }]);

    expect(resolveBreakdownChartSliceColor(map, 'category', 'food')).toBe(
      map.get('category:food'),
    );
    expect(resolveBreakdownChartSliceColor(map, 'category', 'missing')).toBe(
      BREAKDOWN_CHART_COLOR_PALETTE[0],
    );
  });
});
