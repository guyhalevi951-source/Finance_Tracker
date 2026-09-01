/** sessionStorage key: set when Category Management is opened from Add Expense category grid */
export const CATEGORY_RETURN_TO_ADD_EXPENSE_KEY = 'categoryReturnToAddExpense';

/** sessionStorage key: parent main id when Subcategory Management is opened from Add Expense drill-down */
export const CATEGORY_RETURN_SUB_PARENT_KEY = 'categoryReturnSubParent';

export interface ExpensesLocationState {
  openAddExpenseCategories?: boolean;
  openAddExpenseSubCategories?: string;
}

export type PostCreateNavigation =
  | { destination: 'addExpense'; view: 'main' }
  | { destination: 'addExpense'; view: 'sub'; parentId: string }
  | { destination: 'management' }
  | { destination: 'subManagement'; mainId: string };

export function beginAddExpenseCategoryCreate(): void {
  sessionStorage.setItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY, '1');
  sessionStorage.removeItem(CATEGORY_RETURN_SUB_PARENT_KEY);
}

export function beginAddExpenseSubCategoryCreate(parentId: string): void {
  sessionStorage.setItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY, '1');
  sessionStorage.setItem(CATEGORY_RETURN_SUB_PARENT_KEY, parentId);
}

export function resolvePostMainCategoryCreateNavigation(): PostCreateNavigation {
  const returnToAddExpense = sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
  if (returnToAddExpense) {
    sessionStorage.removeItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
    sessionStorage.removeItem(CATEGORY_RETURN_SUB_PARENT_KEY);
    return { destination: 'addExpense', view: 'main' };
  }
  return { destination: 'management' };
}

export function resolvePostSubCategoryCreateNavigation(
  mainId: string,
): PostCreateNavigation {
  const returnToAddExpense = sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
  const returnParentId = sessionStorage.getItem(CATEGORY_RETURN_SUB_PARENT_KEY);

  if (returnToAddExpense) {
    sessionStorage.removeItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
    sessionStorage.removeItem(CATEGORY_RETURN_SUB_PARENT_KEY);
    return {
      destination: 'addExpense',
      view: 'sub',
      parentId: returnParentId ?? mainId,
    };
  }
  return { destination: 'subManagement', mainId };
}

/** Maps stored category bg swatch (bg-emerald-500) to matching text color for icons. */
export function categoryBgSwatchToTextClass(bgClass: string): string {
  if (bgClass.startsWith('bg-')) {
    return bgClass.replace(/^bg-/, 'text-');
  }
  return 'text-slate-500';
}
