import { describe, expect, it } from 'vitest';
import { buildDefaultCategorySeed } from './seedDefaultCategories';
import { BUILTIN_SUB_CATEGORY_ICON_KEYS } from './categoryIconLibrary';
import { getAllBuiltinSubCategoryIds } from './hierarchy';

describe('buildDefaultCategorySeed', () => {
  it('seeds 8 main categories and all built-in sub categories', () => {
    const { mains, subs } = buildDefaultCategorySeed();
    expect(mains).toHaveLength(8);
    expect(subs.length).toBe(getAllBuiltinSubCategoryIds().length);
  });

  it('assigns bilingual labels and icon keys to every built-in sub', () => {
    const { subs } = buildDefaultCategorySeed();
    for (const subId of getAllBuiltinSubCategoryIds()) {
      const sub = subs.find((s) => s.id === subId);
      expect(sub).toBeDefined();
      expect(sub!.labels.en.length).toBeGreaterThan(0);
      expect(sub!.labels.he.length).toBeGreaterThan(0);
      expect(sub!.icon).toBe(BUILTIN_SUB_CATEGORY_ICON_KEYS[subId]);
    }
  });
});
