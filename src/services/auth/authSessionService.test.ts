import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type User } from '@supabase/supabase-js';
import { resolveAuthState } from './authSessionService';

const { migrateGuestData, consumeMigrateGuestOnSignIn } = vi.hoisted(() => ({
  migrateGuestData: vi.fn(async () => {}),
  consumeMigrateGuestOnSignIn: vi.fn(() => false),
}));

vi.mock('./migrateGuestData', () => ({
  migrateGuestData,
  hasGuestFinanceData: vi.fn(() => true),
}));

vi.mock('../../config/auth/migrateIntent', () => ({
  consumeMigrateGuestOnSignIn,
  setMigrateGuestOnSignIn: vi.fn(),
}));

vi.mock('../supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'user@example.com',
  user_metadata: {},
} as User;

beforeEach(() => {
  migrateGuestData.mockClear();
  consumeMigrateGuestOnSignIn.mockReset();
  consumeMigrateGuestOnSignIn.mockReturnValue(false);
});

describe('resolveAuthState migration gating', () => {
  it('does not migrate on INITIAL_SESSION even when guest data exists', async () => {
    consumeMigrateGuestOnSignIn.mockReturnValue(true);
    await resolveAuthState('INITIAL_SESSION', user);
    expect(migrateGuestData).not.toHaveBeenCalled();
    expect(consumeMigrateGuestOnSignIn).not.toHaveBeenCalled();
  });

  it('migrates on SIGNED_IN only when the intent flag is true', async () => {
    consumeMigrateGuestOnSignIn.mockReturnValue(true);
    await resolveAuthState('SIGNED_IN', user);
    expect(consumeMigrateGuestOnSignIn).toHaveBeenCalledTimes(1);
    expect(migrateGuestData).toHaveBeenCalledWith(user.id);
  });

  it('skips migrate on SIGNED_IN when the intent flag is false', async () => {
    consumeMigrateGuestOnSignIn.mockReturnValue(false);
    await resolveAuthState('SIGNED_IN', user);
    expect(consumeMigrateGuestOnSignIn).toHaveBeenCalledTimes(1);
    expect(migrateGuestData).not.toHaveBeenCalled();
  });
});
