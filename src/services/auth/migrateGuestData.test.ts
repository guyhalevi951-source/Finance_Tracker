import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import { hasGuestFinanceData, migrateGuestData } from './migrateGuestData';

const USER_ID = '11111111-1111-1111-1111-111111111111';

const {
  getSession,
  loadSubBudgets,
  saveSubBudget,
  loadBudgetStore,
  saveBudgetStore,
  loadExpenses,
  saveExpense,
  loadActiveBudgetId,
  saveActiveBudgetId,
} = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({
    data: { session: { user: { id: '11111111-1111-1111-1111-111111111111' } } },
    error: null,
  })),
  loadSubBudgets: vi.fn(async () => []),
  saveSubBudget: vi.fn(async () => {}),
  loadBudgetStore: vi.fn(async () => ({ ok: true as const, value: {} })),
  saveBudgetStore: vi.fn(async () => {}),
  loadExpenses: vi.fn(async () => []),
  saveExpense: vi.fn(async () => {}),
  loadActiveBudgetId: vi.fn(async () => 'master'),
  saveActiveBudgetId: vi.fn(async () => {}),
}));

vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      getSession,
    },
  },
}));

vi.mock('../budgets/subBudgetRepository', () => ({
  loadSubBudgets,
  saveSubBudget,
}));

vi.mock('../budgets/monthlyBudgetRepository', () => ({
  loadBudgetStore,
  saveBudgetStore,
}));

vi.mock('../categories/categoryRepository', () => ({
  listGuestCategoryProfileIds: () => {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      for (const prefix of ['mainCategories:', 'customCategories:', 'deletedSubCategoryIds:']) {
        if (key.startsWith(prefix) && key.length > prefix.length) {
          ids.push(key.slice(prefix.length));
        }
      }
    }
    return ids;
  },
  loadDeletedSubCategoryIds: vi.fn(async () => []),
  loadMainCategories: vi.fn(async () => []),
  loadSubCategories: vi.fn(async () => []),
  rememberDeletedSubCategory: vi.fn(async () => {}),
  saveMainCategory: vi.fn(async () => {}),
  saveSubCategory: vi.fn(async () => {}),
}));

vi.mock('../expenses/expenseRepository', () => ({
  loadExpenses,
  saveExpense,
}));

vi.mock('../storage/activeBudgetStorage', () => ({
  loadActiveBudgetId,
  saveActiveBudgetId,
}));

vi.mock('../attachments/expenseAttachmentService', () => ({
  peekGuestAttachments: () => ({}),
  uploadExpenseAttachmentFromDataUrl: vi.fn(),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  getSession.mockClear();
  loadSubBudgets.mockClear();
  saveSubBudget.mockClear();
  loadExpenses.mockClear();
  saveExpense.mockClear();
  loadBudgetStore.mockClear();
  saveBudgetStore.mockClear();
  loadActiveBudgetId.mockClear();
  saveActiveBudgetId.mockClear();
});

describe('hasGuestFinanceData', () => {
  it('is false when only locale and theme are stored', () => {
    localStorage.setItem('locale', 'he');
    localStorage.setItem('theme', 'dark');
    expect(hasGuestFinanceData()).toBe(false);
  });

  it('is true when guest expenses exist', () => {
    localStorage.setItem(GUEST_FINANCE_STORAGE_KEYS.expenses, '[]');
    expect(hasGuestFinanceData()).toBe(true);
  });

  it('is true when a profile-scoped category key exists', () => {
    localStorage.setItem('mainCategories:master', '[]');
    expect(hasGuestFinanceData()).toBe(true);
  });
});

describe('migrateGuestData', () => {
  it('is a no-op when there is no guest finance data', async () => {
    localStorage.setItem('locale', 'en');
    localStorage.setItem('theme', 'light');
    await migrateGuestData(USER_ID);
    expect(localStorage.getItem('locale')).toBe('en');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(getSession).not.toHaveBeenCalled();
  });

  it('copies guest finance keys without removing them', async () => {
    localStorage.setItem(GUEST_FINANCE_STORAGE_KEYS.expenses, '[]');
    localStorage.setItem(GUEST_FINANCE_STORAGE_KEYS.subBudgets, '[]');
    localStorage.setItem(GUEST_FINANCE_STORAGE_KEYS.monthlyBudgetStore, '{}');
    localStorage.setItem(GUEST_FINANCE_STORAGE_KEYS.activeBudgetId, 'master');

    await migrateGuestData(USER_ID);

    expect(getSession).toHaveBeenCalled();
    expect(saveActiveBudgetId).toHaveBeenCalledWith(USER_ID, 'master');
    expect(localStorage.getItem(GUEST_FINANCE_STORAGE_KEYS.expenses)).toBe('[]');
    expect(localStorage.getItem(GUEST_FINANCE_STORAGE_KEYS.subBudgets)).toBe('[]');
    expect(localStorage.getItem(GUEST_FINANCE_STORAGE_KEYS.monthlyBudgetStore)).toBe('{}');
    expect(localStorage.getItem(GUEST_FINANCE_STORAGE_KEYS.activeBudgetId)).toBe('master');
  });
});
