/** sessionStorage key: set when Category Management is opened from Add Expense category grid */
export const CATEGORY_RETURN_TO_ADD_EXPENSE_KEY = 'categoryReturnToAddExpense';

/** sessionStorage key: parent main id when Subcategory Management is opened from Add Expense drill-down */
export const CATEGORY_RETURN_SUB_PARENT_KEY = 'categoryReturnSubParent';

export interface ExpensesLocationState {
  openAddExpenseCategories?: boolean;
  openAddExpenseSubCategories?: string;
}
