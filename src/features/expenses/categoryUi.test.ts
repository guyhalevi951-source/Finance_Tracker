import { describe, expect, it } from 'vitest';
import { buildDefaultCategorySeed } from '../../domain/categories/seedDefaultCategories';
import { getSubCategoryUI, getMainCategoryUI } from './categoryUi';
import { assertCategoryIconRegistryComplete } from '../categories/iconRegistry';

describe('categoryUi', () => {
  it('icon registry covers every library key', () => {
    expect(() => assertCategoryIconRegistryComplete()).not.toThrow();
  });

  it('resolves sub category color from live catalog', () => {
    const { mains, subs } = buildDefaultCategorySeed();
    const { color, icon } = getSubCategoryUI('transport.fuel', mains, subs);
    const transport = mains.find((m) => m.id === 'transport')!;
    expect(color).toBe(transport.color);
    expect(icon).toBeDefined();
  });

  it('resolves main category UI from live catalog', () => {
    const { mains } = buildDefaultCategorySeed();
    const { color, icon } = getMainCategoryUI('health', mains);
    const health = mains.find((m) => m.id === 'health')!;
    expect(color).toBe(health.color);
    expect(icon).toBeDefined();
  });
});
