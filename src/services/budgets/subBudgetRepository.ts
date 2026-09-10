import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import { SUPABASE_TABLES } from '../../config/supabase/tables';
import { parseBudgetStoreValue } from '../../domain/budget/parseBudgetStore';
import { type BudgetStore, type SubBudgetRecord } from '../../types/budget';
import { supabase } from '../supabase/client';
import { throwIfPostgrestError } from '../supabase/errors';
import { subBudgetRowToRaw, subBudgetToRow, type SubBudgetRow } from './subBudgetRowMapper';

const GUEST_SUB_BUDGETS_KEY = GUEST_FINANCE_STORAGE_KEYS.subBudgets;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseLabels(v: unknown): { en: string; he: string } | null {
  if (!isRecord(v)) return null;
  if (typeof v.en !== 'string' || typeof v.he !== 'string') return null;
  return { en: v.en, he: v.he };
}

function parseMonthOverrides(v: unknown): BudgetStore | null {
  if (v === undefined) return {};
  const parsed = parseBudgetStoreValue(v);
  return parsed.ok ? parsed.value : null;
}

/**
 * Legacy documents (pre-kind) are date-bounded and linked to the monthly budget,
 * so missing `kind` => 'temporary' and missing `includeInMonthlyBudget` => true.
 */
function parseSubBudget(v: unknown, fallbackSortOrder: number): SubBudgetRecord | null {
  if (!isRecord(v)) return null;
  const labels = parseLabels(v.name);
  if (
    typeof v.id !== 'string' ||
    !labels ||
    (typeof v.totalAmount !== 'number' && v.totalAmount !== null) ||
    typeof v.createdAt !== 'string'
  ) {
    return null;
  }

  const base = {
    id: v.id,
    name: labels,
    totalAmount: v.totalAmount,
    includeInMonthlyBudget: v.includeInMonthlyBudget !== false,
    sortOrder: typeof v.sortOrder === 'number' ? v.sortOrder : fallbackSortOrder,
    createdAt: v.createdAt,
    ...(v.purgedFromHistory === true ? { purgedFromHistory: true } : {}),
  };

  if (v.kind === 'fixed') {
    const monthOverrides = parseMonthOverrides(v.monthOverrides);
    if (monthOverrides === null) return null;
    return { ...base, kind: 'fixed', monthOverrides };
  }

  if (v.kind !== undefined && v.kind !== 'temporary') return null;
  if (typeof v.startDate !== 'string' || typeof v.endDate !== 'string') return null;

  return { ...base, kind: 'temporary', startDate: v.startDate, endDate: v.endDate };
}

function loadGuestSubBudgets(): SubBudgetRecord[] {
  const raw = localStorage.getItem(GUEST_SUB_BUDGETS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => parseSubBudget(item, index))
      .filter((item): item is SubBudgetRecord => item !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    throw new Error('CORRUPTED_SUB_BUDGETS');
  }
}

function saveGuestSubBudgets(budgets: SubBudgetRecord[]): void {
  localStorage.setItem(GUEST_SUB_BUDGETS_KEY, JSON.stringify(budgets));
}

export function clearGuestSubBudgets(): void {
  localStorage.removeItem(GUEST_SUB_BUDGETS_KEY);
}

async function loadAuthSubBudgets(userId: string): Promise<SubBudgetRecord[]> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.budgets)
    .select('*')
    .eq('user_id', userId);
  throwIfPostgrestError(error, 'LOAD_SUB_BUDGETS_FAILED');

  return (data as SubBudgetRow[])
    .map((row, index) => parseSubBudget(subBudgetRowToRaw(row), index))
    .filter((item): item is SubBudgetRecord => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function loadSubBudgets(userId: string | null): Promise<SubBudgetRecord[]> {
  if (userId) return loadAuthSubBudgets(userId);
  return loadGuestSubBudgets();
}

export async function saveSubBudget(
  userId: string | null,
  budget: SubBudgetRecord,
): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.budgets)
      .upsert(subBudgetToRow(userId, budget), { onConflict: 'user_id,id' });
    throwIfPostgrestError(error, 'SAVE_SUB_BUDGET_FAILED');
    return;
  }

  const current = loadGuestSubBudgets();
  const index = current.findIndex((item) => item.id === budget.id);
  if (index >= 0) {
    current[index] = budget;
  } else {
    current.push(budget);
  }
  saveGuestSubBudgets(current);
}

export async function deleteSubBudget(
  userId: string | null,
  budgetId: string,
): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.budgets)
      .delete()
      .eq('user_id', userId)
      .eq('id', budgetId);
    throwIfPostgrestError(error, 'DELETE_SUB_BUDGET_FAILED');
    return;
  }

  const current = loadGuestSubBudgets().filter((item) => item.id !== budgetId);
  saveGuestSubBudgets(current);
}

export async function saveSubBudgetsOrder(
  userId: string | null,
  budgets: SubBudgetRecord[],
): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.budgets)
      .upsert(budgets.map((budget) => subBudgetToRow(userId, budget)), {
        onConflict: 'user_id,id',
      });
    throwIfPostgrestError(error, 'SAVE_SUB_BUDGETS_FAILED');
    return;
  }

  const byId = new Map(budgets.map((budget) => [budget.id, budget]));
  const current = loadGuestSubBudgets().map((budget) => byId.get(budget.id) ?? budget);
  saveGuestSubBudgets(current);
}
