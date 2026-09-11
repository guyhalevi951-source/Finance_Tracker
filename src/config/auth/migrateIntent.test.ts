import { beforeEach, describe, expect, it } from 'vitest';
import {
  consumeMigrateGuestOnSignIn,
  MIGRATE_GUEST_ON_SIGN_IN_KEY,
  setMigrateGuestOnSignIn,
} from './migrateIntent';

const sessionStorageMock = (() => {
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
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock });

beforeEach(() => sessionStorageMock.clear());

describe('migrate guest intent', () => {
  it('consumes a true flag once', () => {
    setMigrateGuestOnSignIn(true);
    expect(sessionStorage.getItem(MIGRATE_GUEST_ON_SIGN_IN_KEY)).toBe('true');
    expect(consumeMigrateGuestOnSignIn()).toBe(true);
    expect(consumeMigrateGuestOnSignIn()).toBe(false);
    expect(sessionStorage.getItem(MIGRATE_GUEST_ON_SIGN_IN_KEY)).toBeNull();
  });

  it('consumes a false flag as skip', () => {
    setMigrateGuestOnSignIn(false);
    expect(consumeMigrateGuestOnSignIn()).toBe(false);
    expect(consumeMigrateGuestOnSignIn()).toBe(false);
  });

  it('is false when no flag was set', () => {
    expect(consumeMigrateGuestOnSignIn()).toBe(false);
  });
});
