export function buildBudgetScopedTitle(
  budgetLabel: string,
  pageTitle: string,
  isMaster: boolean,
): string {
  if (isMaster) {
    return pageTitle;
  }
  return `${budgetLabel} - ${pageTitle}`;
}
