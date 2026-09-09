import { type BilingualText } from './bilingual';

export interface MonthBudgetEntry {
  /** null = unset or inherited via carryover; non-null = user typed and saved */
  amount: number | null;
  /** When true (user opt-in), month N+1 inherits this month's resolved amount. Defaults to false. */
  carryOverToNext: boolean;
}

/** Indexed by month key `YYYY-MM` */
export type BudgetStore = Record<string, MonthBudgetEntry>;

/**
 * `temporary` = date-bounded budget that archives after its end date.
 * `fixed` = open-ended budget that navigates month-by-month like the master monthly budget.
 */
export type SubBudgetKind = 'temporary' | 'fixed';

interface SubBudgetBase {
  id: string;
  name: BilingualText;
  totalAmount: number;
  sortOrder: number;
  createdAt: string;
  /** When false, this budget's expenses are isolated from the master monthly ledger. */
  includeInMonthlyBudget: boolean;
  /** When true, budget is hidden from History UI but kept for expense tag resolution */
  purgedFromHistory?: boolean;
}

export interface TemporarySubBudgetRecord extends SubBudgetBase {
  kind: 'temporary';
  startDate: string;
  endDate: string;
}

export interface FixedSubBudgetRecord extends SubBudgetBase {
  kind: 'fixed';
  /** Per-month overrides of `totalAmount` (the default monthly amount), with carry-over flags. */
  monthOverrides: BudgetStore;
}

export type SubBudgetRecord = TemporarySubBudgetRecord | FixedSubBudgetRecord;

interface SubBudgetInputBase {
  name: BilingualText;
  totalAmount: number;
  includeInMonthlyBudget: boolean;
}

export interface TemporarySubBudgetInput extends SubBudgetInputBase {
  kind: 'temporary';
  startDate: string;
  endDate: string;
}

export interface FixedSubBudgetInput extends SubBudgetInputBase {
  kind: 'fixed';
}

export type SubBudgetInput = TemporarySubBudgetInput | FixedSubBudgetInput;
