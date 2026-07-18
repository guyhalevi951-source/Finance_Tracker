import { type Expense } from '../../types/expense';

export function stripRecurrenceFields(expense: Expense): Expense {
  const {
    recurrenceRule: _rule,
    recurrenceSeriesId: _seriesId,
    recurrenceEndDate: _endDate,
    recurrenceExcludedDates: _excluded,
    ...rest
  } = expense;
  return rest;
}
