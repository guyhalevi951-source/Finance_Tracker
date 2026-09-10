import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import { SUPABASE_TABLES } from '../../config/supabase/tables';
import { supabase } from '../supabase/client';
import { throwIfPostgrestError } from '../supabase/errors';

const ACTIVE_BUDGET_KEY = GUEST_FINANCE_STORAGE_KEYS.activeBudgetId;

function loadGuestActiveBudgetId(): string {
  return localStorage.getItem(ACTIVE_BUDGET_KEY) ?? MASTER_BUDGET_ID;
}

function saveGuestActiveBudgetId(budgetId: string): void {
  localStorage.setItem(ACTIVE_BUDGET_KEY, budgetId);
}

export function clearGuestActiveBudgetId(): void {
  localStorage.removeItem(ACTIVE_BUDGET_KEY);
}

export async function loadActiveBudgetId(userId: string | null): Promise<string> {
  if (!userId) return loadGuestActiveBudgetId();

  const { data, error } = await supabase
    .from(SUPABASE_TABLES.userPrefs)
    .select('active_budget_id')
    .eq('user_id', userId)
    .maybeSingle();
  throwIfPostgrestError(error, 'LOAD_ACTIVE_BUDGET_FAILED');
  return data?.active_budget_id ?? MASTER_BUDGET_ID;
}

export async function saveActiveBudgetId(
  userId: string | null,
  budgetId: string,
): Promise<void> {
  if (!userId) {
    saveGuestActiveBudgetId(budgetId);
    return;
  }

  const { error } = await supabase.from(SUPABASE_TABLES.userPrefs).upsert(
    { user_id: userId, active_budget_id: budgetId },
    { onConflict: 'user_id' },
  );
  throwIfPostgrestError(error, 'SAVE_ACTIVE_BUDGET_FAILED');
}
