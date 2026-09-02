import { describe, expect, it } from 'vitest';
import {
  isProfileNavSecondToLast,
  isSettingsNavLast,
  NAV_ITEMS,
} from './nav';

describe('nav', () => {
  it('keeps Settings as the last nav item', () => {
    expect(isSettingsNavLast(NAV_ITEMS)).toBe(true);
    expect(NAV_ITEMS[NAV_ITEMS.length - 1]?.id).toBe('settings');
  });

  it('keeps Profile as the second-to-last nav item', () => {
    expect(isProfileNavSecondToLast(NAV_ITEMS)).toBe(true);
    expect(NAV_ITEMS[NAV_ITEMS.length - 2]?.id).toBe('profile');
  });
});
