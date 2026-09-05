import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from './nav';

describe('nav', () => {
  it('lists Expenses as the first primary nav item', () => {
    expect(NAV_ITEMS[0]?.id).toBe('expenses');
  });

  it('lists Expenses, Charts, then Budget in the primary nav', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(['expenses', 'charts', 'budget']);
  });

  it('matches Charts only on the overview path', () => {
    const charts = NAV_ITEMS.find((item) => item.id === 'charts');
    expect(charts?.end).toBe(true);
  });
});
