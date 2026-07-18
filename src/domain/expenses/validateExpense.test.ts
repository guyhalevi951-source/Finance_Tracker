import { describe, it, expect } from 'vitest';
import { validateExpenseInput } from './validateExpense';

describe('validateExpenseInput', () => {
  const todayIso = '2026-07-19';
  const valid = {
    description: 'Coffee',
    amount: '12.5',
    category: 'food',
    paymentMethod: 'cash',
    date: '2026-07-10',
  };

  it('accepts valid input with payment method and date', () => {
    const result = validateExpenseInput(valid, todayIso);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.paymentMethod).toBe('cash');
      expect(result.value.date).toBe('2026-07-10');
    }
  });

  it('accepts today as the expense date', () => {
    const result = validateExpenseInput({ ...valid, date: todayIso }, todayIso);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.date).toBe(todayIso);
  });

  it('accepts empty description', () => {
    const result = validateExpenseInput({ ...valid, description: '' }, todayIso);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBe('');
  });

  it('rejects invalid payment method', () => {
    const result = validateExpenseInput({ ...valid, paymentMethod: 'bitcoin' }, todayIso);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('PAYMENT_METHOD_INVALID');
  });

  it('rejects invalid date', () => {
    const result = validateExpenseInput({ ...valid, date: '10/07/2026' }, todayIso);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('DATE_INVALID');
  });

  it('rejects future dates', () => {
    const result = validateExpenseInput({ ...valid, date: '2026-07-20' }, todayIso);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('DATE_IN_FUTURE');
  });
});
