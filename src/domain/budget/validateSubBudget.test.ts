import { describe, expect, it } from 'vitest';
import { parseSubBudgetInput, type SubBudgetFormInput } from './validateSubBudget';

const temporaryForm: SubBudgetFormInput = {
  name: 'Vacation',
  totalAmount: '5000',
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  noTimeLimit: false,
  includeInMonthlyBudget: true,
};

describe('parseSubBudgetInput', () => {
  it('accepts valid input as a temporary budget', () => {
    const result = parseSubBudgetInput(temporaryForm, '2026-07-01');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe('temporary');
      expect(result.value.totalAmount).toBe(5000);
      expect(result.value.includeInMonthlyBudget).toBe(true);
    }
  });

  it('rejects end before start', () => {
    const result = parseSubBudgetInput(
      { ...temporaryForm, startDate: '2026-08-31', endDate: '2026-08-01' },
      '2026-07-01',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('END_BEFORE_START');
  });

  it('rejects empty name', () => {
    const result = parseSubBudgetInput({ ...temporaryForm, name: '  ' }, '2026-07-01');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NAME_REQUIRED');
  });

  it('allows end date on today', () => {
    const result = parseSubBudgetInput(
      { ...temporaryForm, startDate: '2026-09-01', endDate: '2026-09-03' },
      '2026-09-03',
    );
    expect(result.ok).toBe(true);
  });

  it('rejects end date in the past', () => {
    const result = parseSubBudgetInput(
      { ...temporaryForm, startDate: '2026-08-01', endDate: '2026-09-02' },
      '2026-09-03',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('END_IN_PAST');
  });

  it('produces a fixed budget and ignores dates when noTimeLimit is checked', () => {
    const result = parseSubBudgetInput(
      { ...temporaryForm, noTimeLimit: true, startDate: '', endDate: '2020-01-01' },
      '2026-09-03',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe('fixed');
      expect('startDate' in result.value).toBe(false);
      expect(result.value.totalAmount).toBe(5000);
    }
  });

  it('carries the isolated flag through', () => {
    const result = parseSubBudgetInput(
      { ...temporaryForm, includeInMonthlyBudget: false },
      '2026-07-01',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.includeInMonthlyBudget).toBe(false);
  });

  it('still validates name and amount for fixed budgets', () => {
    const result = parseSubBudgetInput(
      { ...temporaryForm, noTimeLimit: true, totalAmount: 'abc' },
      '2026-07-01',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('AMOUNT_INVALID');
  });
});
