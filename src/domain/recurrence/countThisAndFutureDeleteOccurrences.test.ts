import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { countThisAndFutureDeleteOccurrences } from './countThisAndFutureDeleteOccurrences';
import { terminateRecurrenceSeries } from './terminateRecurrenceSeries';

const dailyRule = { type: 'daily' as const, interval: 1, occurrences: null };

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'id' | 'date'>): Expense {
  return {
    id: overrides.id,
    date: overrides.date,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 100,
    category: 'food.groceries',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('countThisAndFutureDeleteOccurrences', () => {
  it('returns 1 for a non-recurring expense', () => {
    const expense = makeExpense({ id: 'e1', date: '2026-03-01' });
    expect(countThisAndFutureDeleteOccurrences([expense], expense, '2026-03-01')).toBe(1);
  });

  it('counts materialized future instances from split date', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const split = makeExpense({ id: 'i2', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i3', date: '2026-03-06', recurrenceSeriesId: 't1' });

    expect(
      countThisAndFutureDeleteOccurrences(
        [template, past, split, future],
        split,
        '2026-03-05',
      ),
    ).toBeGreaterThanOrEqual(2);
  });

  it('includes projected due dates not yet materialized', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
    });

    expect(countThisAndFutureDeleteOccurrences([template], template, '2026-03-01')).toBe(5);
  });

  it('respects occurrence limit when counting projected dates', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 3 },
    });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(
      countThisAndFutureDeleteOccurrences([template, instance], template, '2026-03-01'),
    ).toBe(3);
  });

  it('treats excluded dates as consumed slots so deleted days are not backfilled', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 4 },
      recurrenceExcludedDates: ['2026-03-02'],
    });
    const a = makeExpense({ id: 'i1', date: '2026-03-03', recurrenceSeriesId: 't1' });
    const b = makeExpense({ id: 'i2', date: '2026-03-04', recurrenceSeriesId: 't1' });

    // 3 materialized + 1 excluded = 4 consumed; no projected backfill.
    expect(
      countThisAndFutureDeleteOccurrences([template, a, b], a, '2026-03-03'),
    ).toBe(2);
  });

  it('projects remaining scheduled dates from last visible instance', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 4 },
    });
    const lastVisible = makeExpense({ id: 'i1', date: '2026-03-03', recurrenceSeriesId: 't1' });

    // series count 2; from Mar 3 projects Mar 3 (existing skip) + Mar 4 + ... until limit
    expect(
      countThisAndFutureDeleteOccurrences([template, lastVisible], lastVisible, '2026-03-03'),
    ).toBe(3);
  });

  it('counts template plus future instances when deleting template', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const future = makeExpense({ id: 'i1', date: '2026-03-05', recurrenceSeriesId: 't1' });

    expect(
      countThisAndFutureDeleteOccurrences([template, future], template, '2026-03-01'),
    ).toBeGreaterThanOrEqual(2);
  });

  it('includes same-series materialized instances past recurrenceEndDate on cascade delete', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-03-04',
    });
    const historical = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const orphanedFuture = makeExpense({ id: 'i2', date: '2026-03-10', recurrenceSeriesId: 't1' });

    expect(
      countThisAndFutureDeleteOccurrences(
        [template, historical, orphanedFuture],
        historical,
        '2026-03-10',
      ),
    ).toBe(2);
  });

  it('counts post-endDate sibling so penultimate delete is not silent', () => {
    // Mirrors production: template capped at Jul 17 while Jul 18 instance still exists.
    const template = makeExpense({
      id: 't1',
      date: '2026-07-12',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 9 },
      recurrenceEndDate: '2026-07-17',
    });
    const penultimate = makeExpense({ id: 'i5', date: '2026-07-17', recurrenceSeriesId: 't1' });
    const absoluteLast = makeExpense({ id: 'i6', date: '2026-07-18', recurrenceSeriesId: 't1' });

    expect(
      countThisAndFutureDeleteOccurrences(
        [template, penultimate, absoluteLast],
        penultimate,
        '2026-07-18',
      ),
    ).toBe(2);
  });

  it('includes post-endDate absolute last when deleting two slots before the end', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-12',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 9 },
      recurrenceEndDate: '2026-07-17',
    });
    const twoBefore = makeExpense({ id: 'i4', date: '2026-07-16', recurrenceSeriesId: 't1' });
    const penultimate = makeExpense({ id: 'i5', date: '2026-07-17', recurrenceSeriesId: 't1' });
    const absoluteLast = makeExpense({ id: 'i6', date: '2026-07-18', recurrenceSeriesId: 't1' });

    expect(
      countThisAndFutureDeleteOccurrences(
        [template, twoBefore, penultimate, absoluteLast],
        twoBefore,
        '2026-07-18',
      ),
    ).toBe(3);
  });

  it('counts orphan siblings after Settings terminate so cascade can clear them', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const withinWindow = makeExpense({ id: 'i2', date: '2026-03-08', recurrenceSeriesId: 't1' });
    const orphanedFuture = makeExpense({ id: 'i3', date: '2026-03-15', recurrenceSeriesId: 't1' });
    const todayIso = '2026-03-10';

    const terminated = terminateRecurrenceSeries(
      [template, past, withinWindow, orphanedFuture],
      template,
      todayIso,
    );

    expect(countThisAndFutureDeleteOccurrences(terminated, withinWindow, todayIso)).toBe(2);
    expect(countThisAndFutureDeleteOccurrences(terminated, orphanedFuture, todayIso)).toBe(1);
  });
});
