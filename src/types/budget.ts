import { type BilingualText } from './bilingual';

export interface MonthBudgetEntry {
  /** null = not explicitly set by user for this month */
  amount: number | null;
  /** When true, month N+1 inherits this month's resolved amount */
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
