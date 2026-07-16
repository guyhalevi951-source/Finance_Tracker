import { type RecurrenceRule, type RecurrenceSelection } from '../../types/recurrenceRule';
import { selectionToRule } from './presets';

export interface RecurrenceLabelDescriptor {
  key: string;
  params?: Record<string, string | number>;
}

export function resolveRecurrenceLabelDescriptor(
  selection: RecurrenceSelection,
): RecurrenceLabelDescriptor {
  if (selection.preset === 'never') {
    return { key: 'addExpense.recurrence.never' };
  }

  if (selection.preset === 'custom') {
    if (selection.customMode === 'intervalDays') {
      return {
        key: 'addExpense.recurrence.everyDays',
        params: { count: selection.customIntervalDays ?? 1 },
      };
    }
    return { key: 'addExpense.recurrence.customWeekdays' };
  }

  return { key: `addExpense.recurrence.${selection.preset}` };
}

export function resolveRecurrenceLabelDescriptorFromRule(
  rule: RecurrenceRule,
): RecurrenceLabelDescriptor {
  if (rule.type === 'daily' && rule.interval === 1) {
    return { key: 'addExpense.recurrence.daily' };
  }

  if (rule.type === 'daily' && rule.interval !== 1) {
    return { key: 'addExpense.recurrence.everyDays', params: { count: rule.interval } };
  }

  if (rule.type === 'weekly') {
    const days = rule.customDays ?? [];
    if (days.length === 0) {
      return { key: 'addExpense.recurrence.weekly' };
    }
    if (days.length === 5 && [0, 1, 2, 3, 4].every((d) => days.includes(d))) {
      return { key: 'addExpense.recurrence.weekday' };
    }
    if (days.length === 2 && [5, 6].every((d) => days.includes(d))) {
      return { key: 'addExpense.recurrence.weekend' };
    }
    return { key: 'addExpense.recurrence.customWeekdays' };
  }

  if (rule.type === 'monthly') {
    return { key: 'addExpense.recurrence.monthly' };
  }

  return { key: 'addExpense.recurrence.yearly' };
}

export function isRecurrenceActive(selection: RecurrenceSelection): boolean {
  return selectionToRule(selection) !== null;
}
