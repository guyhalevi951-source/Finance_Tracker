import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import {
  findArchivedSubBudget,
  isSubBudgetArchived,
  listActiveSubBudgets,
  listArchivedSubBudgets,
  purgeArchivedSubBudget,
} from './subBudgetLifecycle';

const budget: SubBudgetRecord = {
  id: 'b1',
  kind: 'temporary',
  name: { en: 'Vacation', he: 'חופשה' },
  totalAmount: 5000,
  includeInMonthlyBudget: true,
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

const fixedBudget: SubBudgetRecord = {
  id: 'fixed-1',
  kind: 'fixed',
  name: { en: 'Groceries', he: 'מכולת' },
  totalAmount: 1500,
  includeInMonthlyBudget: true,
  monthOverrides: {},
  sortOrder: 2,
  createdAt: '2020-01-01T00:00:00.000Z',
};

describe('subBudgetLifecycle', () => {
  it('archives when endDate is before today', () => {
    expect(isSubBudgetArchived(budget, '2026-09-01')).toBe(true);
  });

  it('never archives fixed budgets and excludes them from history', () => {
    expect(isSubBudgetArchived(fixedBudget, '2099-12-31')).toBe(false);
    expect(listActiveSubBudgets([fixedBudget, budget], '2099-12-31').map((b) => b.id)).toEqual([
      'fixed-1',
    ]);
    expect(listArchivedSubBudgets([fixedBudget, budget], '2099-12-31').map((b) => b.id)).toEqual([
      'b1',
    ]);
    expect(purgeArchivedSubBudget([fixedBudget], 'fixed-1', '2099-12-31')).toEqual([fixedBudget]);
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

  it('finds an archived budget by id and ignores active or purged ones', () => {
    const archived = { ...budget, id: 'b2', endDate: '2026-06-30', sortOrder: 1 };
    const purged = { ...budget, id: 'b3', endDate: '2026-05-01', purgedFromHistory: true };

    expect(findArchivedSubBudget([budget, archived, purged], 'b2', '2026-08-15')?.id).toBe('b2');
    expect(findArchivedSubBudget([budget, archived, purged], 'b1', '2026-08-15')).toBeNull();
    expect(findArchivedSubBudget([budget, archived, purged], 'b3', '2026-08-15')).toBeNull();
    expect(findArchivedSubBudget([budget, archived, purged], 'missing', '2026-08-15')).toBeNull();
  });

  it('excludes purged budgets from history list but keeps them in storage', () => {
    const archived = { ...budget, id: 'b2', endDate: '2026-06-30', sortOrder: 1 };
    const purged = purgeArchivedSubBudget([budget, archived], 'b2', '2026-08-15');

    expect(listArchivedSubBudgets(purged, '2026-08-15')).toHaveLength(0);
    expect(purged.find((item) => item.id === 'b2')?.purgedFromHistory).toBe(true);
  });
});
