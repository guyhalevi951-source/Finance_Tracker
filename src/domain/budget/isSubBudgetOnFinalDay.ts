/**
 * Temporary (sub) budgets have a stored end date. On that final calendar day,
 * actual-vs-planned data-mode controls are not relevant.
 */
export function isSubBudgetOnFinalDay(
  isMaster: boolean,
  endDateIso: string | null,
  todayIso: string,
): boolean {
  if (isMaster || endDateIso === null) return false;
  return endDateIso === todayIso;
}
