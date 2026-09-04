import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from './nav';

describe('nav', () => {
  it('lists Expenses as the first primary nav item', () => {
    expect(NAV_ITEMS[0]?.id).toBe('expenses');
  });

  it('includes only Expenses and Budget in the primary nav list', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(['expenses', 'budget']);
  });
});
