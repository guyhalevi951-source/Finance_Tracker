export interface MonthBudgetEntry {
  /** null = not explicitly set by user for this month */
  amount: number | null;
  /** When true, month N+1 inherits this month's resolved amount */
  carryOverToNext: boolean;
}

/** Indexed by month key `YYYY-MM` */
export type BudgetStore = Record<string, MonthBudgetEntry>;
