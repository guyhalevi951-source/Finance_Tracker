import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import {
  GUEST_FINANCE_STORAGE_KEYS,
  GUEST_LEGACY_CATEGORY_KEYS,
} from '../../config/storage/guestKeys';
import {
  peekGuestAttachments,
  uploadExpenseAttachmentFromDataUrl,
} from '../attachments/expenseAttachmentService';
import {
  loadBudgetStore,
  saveBudgetStore,
} from '../budgets/monthlyBudgetRepository';
import { loadSubBudgets, saveSubBudget } from '../budgets/subBudgetRepository';
import {
  listGuestCategoryProfileIds,
  loadDeletedSubCategoryIds,
  loadMainCategories,
  loadSubCategories,
  rememberDeletedSubCategory,
  saveMainCategory,
  saveSubCategory,
} from '../categories/categoryRepository';
import { loadExpenses, saveExpense } from '../expenses/expenseRepository';
import { loadActiveBudgetId, saveActiveBudgetId } from '../storage/activeBudgetStorage';
import { supabase } from '../supabase/client';
import { type Expense } from '../../types/expense';

let inFlight: Promise<void> | null = null;

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

async function assertSessionReady(userId: string): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[migrateGuestData] getSession failed:', error.message);
    throw new Error('MIGRATION_FAILED');
  }
  if (data.session?.user.id !== userId) {
    console.error('[migrateGuestData] session user does not match migration target');
    throw new Error('MIGRATION_FAILED');
  }
}

async function copyExpenseWithOptionalAttachment(
  userId: string,
  expense: Expense,
  attachments: Record<string, string>,
): Promise<void> {
  const dataUrl =
    attachments[expense.id] ??
    (expense.attachmentUrl?.startsWith('data:') ? expense.attachmentUrl : undefined);

  if (!dataUrl) {
    await saveExpense(userId, expense);
    return;
  }

  try {
    const uploadedUrl = await uploadExpenseAttachmentFromDataUrl(userId, expense.id, dataUrl);
    await saveExpense(userId, { ...expense, attachmentUrl: uploadedUrl });
  } catch (error) {
    console.error('[migrateGuestData] attachment upload failed; saving expense without cloud file', error);
    await saveExpense(userId, expense);
  }
}

async function runMigrate(userId: string): Promise<void> {
  if (!hasGuestFinanceData()) return;

  await assertSessionReady(userId);

  const budgets = await loadSubBudgets(null);
  for (const budget of budgets) {
    await saveSubBudget(userId, budget);
  }

  const attachments = peekGuestAttachments();
  const expenses = await loadExpenses(null);
  for (const expense of expenses) {
    await copyExpenseWithOptionalAttachment(userId, expense, attachments);
  }

  const monthly = await loadBudgetStore(null);
  if (monthly.ok) {
    await saveBudgetStore(userId, monthly.value);
  } else {
    console.error('[migrateGuestData] skipping monthly store:', monthly.error);
  }

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
}

/** Copies guest finance localStorage into the signed-in account. Does not clear guest keys. */
export async function migrateGuestData(userId: string): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = runMigrate(userId).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
