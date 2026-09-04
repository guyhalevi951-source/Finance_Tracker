import { type BilingualText } from './bilingual';

export interface MonthBudgetEntry {
  /** null = unset or inherited via carryover; non-null = user typed and saved */
  amount: number | null;
  /** When true (user opt-in), month N+1 inherits this month's resolved amount. Defaults to false. */
  carryOverToNext: boolean;
}

/** Indexed by month key `YYYY-MM` */
export type BudgetStore = Record<string, MonthBudgetEntry>;

export interface SubBudgetRecord {
  id: string;
  name: BilingualText;
  totalAmount: number;
  startDate: string;
  endDate: string;
  sortOrder: number;
  createdAt: string;
  /** When true, budget is hidden from History UI but kept for expense tag resolution */
  purgedFromHistory?: boolean;
}

export interface SubBudgetInput {
  name: BilingualText;
  totalAmount: number;
  startDate: string;
  endDate: string;
}
