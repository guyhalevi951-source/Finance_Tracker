import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import {
  isSubBudgetArchived,
  listActiveSubBudgets,
  listArchivedSubBudgets,
  purgeArchivedSubBudget,
} from './subBudgetLifecycle';

const budget: SubBudgetRecord = {
  id: 'b1',
  name: { en: 'Vacation', he: 'חופשה' },
  totalAmount: 5000,
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

describe('subBudgetLifecycle', () => {
  it('archives when endDate is before today', () => {
    expect(isSubBudgetArchived(budget, '2026-09-01')).toBe(true);
  });

  it('stays active on endDate boundary', () => {
    expect(isSubBudgetArchived(budget, '2026-08-31')).toBe(false);
  });

  it('archives the day after end date (Sep 3 end, Sep 4 archive)', () => {
    const shortBudget: SubBudgetRecord = {
      ...budget,
      id: 'b-short',
      endDate: '2026-09-03',
    };
    expect(isSubBudgetArchived(shortBudget, '2026-09-03')).toBe(false);
    expect(isSubBudgetArchived(shortBudget, '2026-09-04')).toBe(true);
  });

  it('splits active and archived lists', () => {
    const archived = { ...budget, id: 'b2', endDate: '2026-06-30', sortOrder: 1 };
    const active = listActiveSubBudgets([budget, archived], '2026-08-15');
    const history = listArchivedSubBudgets([budget, archived], '2026-08-15');

    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('b1');
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('b2');
  });

  it('excludes purged budgets from history list but keeps them in storage', () => {
    const archived = { ...budget, id: 'b2', endDate: '2026-06-30', sortOrder: 1 };
    const purged = purgeArchivedSubBudget([budget, archived], 'b2', '2026-08-15');

    expect(listArchivedSubBudgets(purged, '2026-08-15')).toHaveLength(0);
    expect(purged.find((item) => item.id === 'b2')?.purgedFromHistory).toBe(true);
  });
});
