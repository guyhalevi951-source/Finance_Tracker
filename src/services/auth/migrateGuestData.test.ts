import { describe, expect, it, beforeEach } from 'vitest';
import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import { hasGuestFinanceData, migrateGuestData } from './migrateGuestData';

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

beforeEach(() => localStorageMock.clear());

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
    await migrateGuestData('11111111-1111-1111-1111-111111111111');
    expect(localStorage.getItem('locale')).toBe('en');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
