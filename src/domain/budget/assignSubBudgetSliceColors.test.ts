import { describe, expect, it } from 'vitest';
import { assignSubBudgetSliceColors } from './assignSubBudgetSliceColors';

describe('assignSubBudgetSliceColors', () => {
  it('assigns a unique color to each sub-budget id', () => {
    const colors = assignSubBudgetSliceColors(['sub-b', 'sub-a', 'sub-c'], []);

    expect(colors.size).toBe(3);
    expect(new Set(colors.values()).size).toBe(3);
    expect(colors.get('sub-a')).toBeDefined();
    expect(colors.get('sub-b')).toBeDefined();
    expect(colors.get('sub-c')).toBeDefined();
  });

  it('avoids category hex colors when palette has alternatives', () => {
    const occupied = ['#10B981', '#8B5CF6'];
    const colors = assignSubBudgetSliceColors(['sub-a'], occupied);

    expect(colors.get('sub-a')).not.toBe('#10B981');
    expect(colors.get('sub-a')).not.toBe('#8B5CF6');
  });

  it('is stable for the same ids', () => {
    const ids = ['sub-z', 'sub-a', 'sub-m'];
    const first = assignSubBudgetSliceColors(ids, []);
    const second = assignSubBudgetSliceColors(ids, []);

    expect([...first.entries()]).toEqual([...second.entries()]);
  });
});
