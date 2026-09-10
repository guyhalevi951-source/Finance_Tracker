import { type BudgetStore, type SubBudgetRecord } from '../../types/budget';

export interface SubBudgetRow {
  id: string;
  user_id: string;
  name: SubBudgetRecord['name'];
  total_amount: number | null;
  kind: SubBudgetRecord['kind'];
  start_date: string | null;
  end_date: string | null;
  include_in_monthly: boolean;
  sort_order: number;
  created_at: string;
  month_overrides: BudgetStore;
  purged_from_history: boolean;
}

export function subBudgetToRow(userId: string, budget: SubBudgetRecord): SubBudgetRow {
  return {
    id: budget.id,
    user_id: userId,
    name: budget.name,
    total_amount: budget.totalAmount,
    kind: budget.kind,
    start_date: budget.kind === 'temporary' ? budget.startDate : null,
    end_date: budget.kind === 'temporary' ? budget.endDate : null,
    include_in_monthly: budget.includeInMonthlyBudget,
    sort_order: budget.sortOrder,
    created_at: budget.createdAt,
    month_overrides: budget.kind === 'fixed' ? budget.monthOverrides : {},
    purged_from_history: budget.purgedFromHistory === true,
  };
}

export function subBudgetRowToRaw(row: SubBudgetRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    totalAmount: row.total_amount === null ? null : Number(row.total_amount),
    kind: row.kind,
    startDate: row.start_date,
    endDate: row.end_date,
    includeInMonthlyBudget: row.include_in_monthly,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    monthOverrides: row.month_overrides,
    purgedFromHistory: row.purged_from_history === true,
  };
}
