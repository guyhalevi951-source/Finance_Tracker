import { type SubCategoryRecord } from '../../types/category';
import { type SubBudgetRecord } from '../../types/budget';
import { type Expense } from '../../types/expense';
import { groupExpensesByCategory } from '../expenses/groupByCategory';
import { sumAmounts } from '../money/arithmetic';

export type CategoryBreakdownSliceKind = 'category' | 'subBudget';

export interface CategoryBreakdownSlice {
  id: string;
  kind: CategoryBreakdownSliceKind;
  total: number;
}

export interface CategoryBreakdownSliceWithPercent extends CategoryBreakdownSlice {
  percent: number;
}

export interface GroupPeriodCategoryBreakdownInput {
  expenses: Expense[];
  subCategories: SubCategoryRecord[];
  subBudgets: SubBudgetRecord[];
  isMaster: boolean;
}

function buildSubBudgetIdSet(subBudgets: SubBudgetRecord[]): Set<string> {
  return new Set(subBudgets.map((budget) => budget.id));
}

function groupBySubBudget(
  expenses: Expense[],
  subBudgetIds: Set<string>,
): CategoryBreakdownSlice[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    if (!expense.budgetId || !subBudgetIds.has(expense.budgetId)) continue;
    const existing = totals.get(expense.budgetId) ?? 0;
    totals.set(expense.budgetId, sumAmounts([existing, expense.amount]));
  }

  return Array.from(totals.entries()).map(([id, total]) => ({
    id,
    kind: 'subBudget' as const,
    total,
  }));
}

function groupMasterDirectCategories(
  expenses: Expense[],
  subCategories: SubCategoryRecord[],
  subBudgetIds: Set<string>,
): CategoryBreakdownSlice[] {
  const directExpenses = expenses.filter(
    (expense) => !expense.budgetId || !subBudgetIds.has(expense.budgetId),
  );

  return groupExpensesByCategory(directExpenses, subCategories).map((group) => ({
    id: group.categoryId,
    kind: 'category' as const,
    total: group.total,
  }));
}

function sortByTotalThenId(a: CategoryBreakdownSlice, b: CategoryBreakdownSlice): number {
  return b.total - a.total || a.id.localeCompare(b.id);
}

function sortSlices(slices: CategoryBreakdownSlice[]): CategoryBreakdownSlice[] {
  return [...slices].sort(sortByTotalThenId);
}

/** Master view: sub-budget slices first, then category slices (each group sorted by total). */
function sortMasterClusteredSlices(slices: CategoryBreakdownSlice[]): CategoryBreakdownSlice[] {
  const subBudgetSlices = slices.filter((slice) => slice.kind === 'subBudget').sort(sortByTotalThenId);
  const categorySlices = slices.filter((slice) => slice.kind === 'category').sort(sortByTotalThenId);
  return [...subBudgetSlices, ...categorySlices];
}

export function groupPeriodCategoryBreakdown({
  expenses,
  subCategories,
  subBudgets,
  isMaster,
}: GroupPeriodCategoryBreakdownInput): CategoryBreakdownSlice[] {
  if (expenses.length === 0) return [];

  if (!isMaster) {
    return sortSlices(
      groupExpensesByCategory(expenses, subCategories).map((group) => ({
        id: group.categoryId,
        kind: 'category' as const,
        total: group.total,
      })),
    );
  }

  const subBudgetIds = buildSubBudgetIdSet(subBudgets);
  const subBudgetSlices = groupBySubBudget(expenses, subBudgetIds);
  const categorySlices = groupMasterDirectCategories(expenses, subCategories, subBudgetIds);

  return sortMasterClusteredSlices([...subBudgetSlices, ...categorySlices]);
}

export function attachCategoryBreakdownPercents(
  slices: CategoryBreakdownSlice[],
): CategoryBreakdownSliceWithPercent[] {
  const grandTotal = sumAmounts(slices.map((slice) => slice.total));
  if (grandTotal <= 0) return [];

  return slices.map((slice) => ({
    ...slice,
    percent: (slice.total / grandTotal) * 100,
  }));
}
