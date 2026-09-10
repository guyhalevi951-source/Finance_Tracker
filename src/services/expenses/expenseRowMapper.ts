import { type Expense } from '../../types/expense';

export interface ExpenseRow {
  id: string;
  user_id: string;
  description: Expense['description'];
  amount: number;
  category: string;
  date: string;
  payment_method: string;
  attachment_url: string | null;
  recurrence_rule: Expense['recurrenceRule'] | null;
  recurrence_series_id: string | null;
  recurrence_end_date: string | null;
  recurrence_excluded_dates: string[] | null;
  recurrence_pending_basic_fields: Expense['recurrencePendingBasicFields'] | null;
  scheduled: boolean;
  original_category_id: string | null;
  original_sub_category_id: string | null;
  budget_id: string | null;
}

export function expenseToRow(userId: string, expense: Expense): ExpenseRow {
  return {
    id: expense.id,
    user_id: userId,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    payment_method: expense.paymentMethod,
    attachment_url: expense.attachmentUrl ?? null,
    recurrence_rule: expense.recurrenceRule ?? null,
    recurrence_series_id: expense.recurrenceSeriesId ?? null,
    recurrence_end_date: expense.recurrenceEndDate ?? null,
    recurrence_excluded_dates: expense.recurrenceExcludedDates ?? null,
    recurrence_pending_basic_fields: expense.recurrencePendingBasicFields ?? null,
    scheduled: expense.scheduled === true,
    original_category_id: expense.originalCategoryId ?? null,
    original_sub_category_id: expense.originalSubCategoryId ?? null,
    budget_id: expense.budgetId ?? null,
  };
}

export function expenseRowToRaw(row: ExpenseRow): Record<string, unknown> {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
    paymentMethod: row.payment_method,
    attachmentUrl: row.attachment_url,
    recurrenceRule: row.recurrence_rule,
    recurrenceSeriesId: row.recurrence_series_id,
    recurrenceEndDate: row.recurrence_end_date,
    recurrenceExcludedDates: row.recurrence_excluded_dates,
    recurrencePendingBasicFields: row.recurrence_pending_basic_fields,
    scheduled: row.scheduled,
    originalCategoryId: row.original_category_id,
    originalSubCategoryId: row.original_sub_category_id,
    budgetId: row.budget_id,
  };
}
