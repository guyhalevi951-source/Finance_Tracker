import {
  type RecurrenceSelection,
} from '../../types/recurrenceRule';
import { computeSeriesOccurrenceDates } from './computeSeriesOccurrenceDates';
import { resolveOccurrencesFromSelection, selectionToRule } from './presets';

export interface SubBudgetOccurrenceCapEvaluation {
  maxAllowed: number;
  requested: number | null;
  exceedsCap: boolean;
  capEndDateIso: string;
}

export function computeMaxOccurrencesInSubBudgetWindow(
  startDateIso: string,
  selection: RecurrenceSelection,
  capEndDateIso: string,
): number {
  if (startDateIso > capEndDateIso || selection.preset === 'never') {
    return 0;
  }

  const rule = selectionToRule(selection);
  if (!rule) return 0;

  return computeSeriesOccurrenceDates(
    startDateIso,
    { ...rule, occurrences: null },
    { capEndDateIso },
  ).length;
}

export function resolveRequestedOccurrenceCount(
  selection: RecurrenceSelection,
): number | null {
  if (selection.preset === 'never') return null;
  return resolveOccurrencesFromSelection(selection);
}

export function exceedsSubBudgetOccurrenceCap(
  startDateIso: string,
  selection: RecurrenceSelection,
  capEndDateIso: string,
): boolean {
  const maxAllowed = computeMaxOccurrencesInSubBudgetWindow(startDateIso, selection, capEndDateIso);
  const requested = resolveRequestedOccurrenceCount(selection);
  if (maxAllowed === 0) return true;
  if (requested === null) return true;
  return requested > maxAllowed;
}

export function evaluateSubBudgetOccurrenceCap(
  startDateIso: string,
  selection: RecurrenceSelection,
  capEndDateIso: string,
): SubBudgetOccurrenceCapEvaluation {
  const maxAllowed = computeMaxOccurrencesInSubBudgetWindow(startDateIso, selection, capEndDateIso);
  const requested = resolveRequestedOccurrenceCount(selection);
  return {
    maxAllowed,
    requested,
    exceedsCap: exceedsSubBudgetOccurrenceCap(startDateIso, selection, capEndDateIso),
    capEndDateIso,
  };
}
