import { SUPABASE_TABLES } from '../../config/supabase/tables';
import { type BudgetStore } from '../../types/budget';
import { Result, ok } from '../../types/result';
import {
  loadBudgetStore as loadGuestBudgetStore,
  saveBudgetStore as saveGuestBudgetStore,
  type LoadBudgetStoreError,
} from '../storage/budgetLocalStorage';
import { supabase } from '../supabase/client';
import { throwIfPostgrestError } from '../supabase/errors';

interface MonthlyBudgetEntryRow {
  user_id: string;
  month_key: string;
  amount: number | null;
  carry_over_to_next: boolean;
}

function rowsToStore(rows: MonthlyBudgetEntryRow[]): BudgetStore {
  const store: BudgetStore = {};
  for (const row of rows) {
    store[row.month_key] = {
      amount: row.amount === null ? null : Number(row.amount),
      carryOverToNext: row.carry_over_to_next === true,
    };
  }
  return store;
}

function storeToRows(userId: string, store: BudgetStore): MonthlyBudgetEntryRow[] {
  return Object.entries(store).map(([monthKey, entry]) => ({
    user_id: userId,
    month_key: monthKey,
    amount: entry.amount,
    carry_over_to_next: entry.carryOverToNext,
  }));
}

async function loadAuthBudgetStore(userId: string): Promise<Result<BudgetStore, LoadBudgetStoreError>> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.monthlyBudgetEntries)
    .select('*')
    .eq('user_id', userId);
  throwIfPostgrestError(error, 'LOAD_BUDGET_STORE_FAILED');
  return ok(rowsToStore((data ?? []) as MonthlyBudgetEntryRow[]));
}

async function saveAuthBudgetStore(userId: string, store: BudgetStore): Promise<void> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.monthlyBudgetEntries)
    .select('month_key')
    .eq('user_id', userId);
  throwIfPostgrestError(error, 'LOAD_BUDGET_STORE_FAILED');

  const nextKeys = new Set(Object.keys(store));
  const toDelete = (data ?? [])
    .map((row) => row.month_key as string)
    .filter((key) => !nextKeys.has(key));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from(SUPABASE_TABLES.monthlyBudgetEntries)
      .delete()
      .eq('user_id', userId)
      .in('month_key', toDelete);
    throwIfPostgrestError(deleteError, 'SAVE_BUDGET_STORE_FAILED');
  }

  const rows = storeToRows(userId, store);
  if (rows.length === 0) return;

  const { error: upsertError } = await supabase
    .from(SUPABASE_TABLES.monthlyBudgetEntries)
    .upsert(rows, { onConflict: 'user_id,month_key' });
  throwIfPostgrestError(upsertError, 'SAVE_BUDGET_STORE_FAILED');
}

export async function loadBudgetStore(
  userId: string | null,
): Promise<Result<BudgetStore, LoadBudgetStoreError>> {
  if (userId) return loadAuthBudgetStore(userId);
  return loadGuestBudgetStore();
}

export async function saveBudgetStore(
  userId: string | null,
  store: BudgetStore,
): Promise<void> {
  if (userId) {
    await saveAuthBudgetStore(userId, store);
    return;
  }
  saveGuestBudgetStore(store);
}
