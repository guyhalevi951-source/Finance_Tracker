import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import {
  GUEST_FINANCE_STORAGE_KEYS,
  GUEST_LEGACY_CATEGORY_KEYS,
} from '../../config/storage/guestKeys';
import {
  peekGuestAttachments,
  clearGuestAttachments,
  uploadExpenseAttachmentFromDataUrl,
} from '../attachments/expenseAttachmentService';
import {
  loadBudgetStore,
  saveBudgetStore,
} from '../budgets/monthlyBudgetRepository';
import {
  loadSubBudgets,
  saveSubBudget,
  clearGuestSubBudgets,
} from '../budgets/subBudgetRepository';
import {
  clearAllGuestCategoryKeys,
  listGuestCategoryProfileIds,
  loadDeletedSubCategoryIds,
  loadMainCategories,
  loadSubCategories,
  rememberDeletedSubCategory,
  saveMainCategory,
  saveSubCategory,
} from '../categories/categoryRepository';
import {
  clearGuestExpenses,
  loadExpenses,
  saveExpense,
} from '../expenses/expenseRepository';
import {
  clearGuestActiveBudgetId,
  loadActiveBudgetId,
  saveActiveBudgetId,
} from '../storage/activeBudgetStorage';
import { clearGuestBudgetStore } from '../storage/budgetLocalStorage';

export function hasGuestFinanceData(): boolean {
  const keys = GUEST_FINANCE_STORAGE_KEYS;
  if (
    localStorage.getItem(keys.expenses) ||
    localStorage.getItem(keys.subBudgets) ||
    localStorage.getItem(keys.monthlyBudgetStore) ||
    localStorage.getItem(keys.monthlyBudgetLegacy) ||
    localStorage.getItem(keys.expenseAttachments) ||
    localStorage.getItem(keys.activeBudgetId)
  ) {
    return true;
  }

  if (listGuestCategoryProfileIds().length > 0) return true;
  return GUEST_LEGACY_CATEGORY_KEYS.some((key) => localStorage.getItem(key) !== null);
}

export async function migrateGuestData(userId: string): Promise<void> {
  if (!hasGuestFinanceData()) return;

  const budgets = await loadSubBudgets(null);
  for (const budget of budgets) {
    await saveSubBudget(userId, budget);
  }

  const attachments = peekGuestAttachments();
  const expenses = await loadExpenses(null);
  for (const expense of expenses) {
    const dataUrl =
      attachments[expense.id] ??
      (expense.attachmentUrl?.startsWith('data:') ? expense.attachmentUrl : undefined);
    const nextExpense = dataUrl
      ? {
          ...expense,
          attachmentUrl: await uploadExpenseAttachmentFromDataUrl(userId, expense.id, dataUrl),
        }
      : expense;
    await saveExpense(userId, nextExpense);
  }

  const monthly = await loadBudgetStore(null);
  if (!monthly.ok) {
    throw new Error('MIGRATION_FAILED');
  }
  await saveBudgetStore(userId, monthly.value);

  const profileIds = new Set<string>([
    MASTER_BUDGET_ID,
    ...budgets.map((budget) => budget.id),
    ...listGuestCategoryProfileIds(),
  ]);

  for (const profileId of profileIds) {
    const mains = await loadMainCategories(null, profileId);
    const subs = await loadSubCategories(null, profileId);
    const deleted = await loadDeletedSubCategoryIds(null, profileId);
    for (const main of mains) {
      await saveMainCategory(userId, profileId, main);
    }
    for (const sub of subs) {
      await saveSubCategory(userId, profileId, sub);
    }
    for (const deletedId of deleted) {
      await rememberDeletedSubCategory(userId, profileId, deletedId);
    }
  }

  const activeBudgetId = await loadActiveBudgetId(null);
  await saveActiveBudgetId(userId, activeBudgetId);

  clearGuestExpenses();
  clearGuestSubBudgets();
  clearGuestBudgetStore();
  clearGuestAttachments();
  clearGuestActiveBudgetId();
  clearAllGuestCategoryKeys();
}
