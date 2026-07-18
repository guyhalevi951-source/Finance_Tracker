import { describe, expect, it } from 'vitest';
import { getFactoryDefaultCategoryCatalog } from './factoryCategoryCatalog';
import { buildDefaultCategorySeed } from './seedDefaultCategories';
import {
  BUILTIN_PARENT_CATEGORY_IDS,
  getAllBuiltinSubCategoryIds,
} from './hierarchy';

describe('getFactoryDefaultCategoryCatalog', () => {
  it('matches buildDefaultCategorySeed mains and subs', () => {
    const factory = getFactoryDefaultCategoryCatalog();
    const seed = buildDefaultCategorySeed();

    expect(factory.mainCategories.map((m) => m.id)).toEqual(seed.mains.map((m) => m.id));
    expect(factory.subCategories.map((s) => s.id).sort()).toEqual(
      seed.subs.map((s) => s.id).sort(),
    );
  });

  it('contains exactly built-in main and sub category ids', () => {
    const { mainCategories, subCategories } = getFactoryDefaultCategoryCatalog();
    const builtinSubIds = getAllBuiltinSubCategoryIds();

    expect(mainCategories).toHaveLength(BUILTIN_PARENT_CATEGORY_IDS.length);
    expect(subCategories).toHaveLength(builtinSubIds.length);

    for (const mainId of BUILTIN_PARENT_CATEGORY_IDS) {
      expect(mainCategories.some((m) => m.id === mainId)).toBe(true);
    }
    for (const subId of builtinSubIds) {
      expect(subCategories.some((s) => s.id === subId)).toBe(true);
    }
  });

  it('excludes custom-only category ids from the factory catalog', () => {
    const { mainCategories, subCategories } = getFactoryDefaultCategoryCatalog();
    const customMainId = 'custom-main-uuid';
    const customSubId = 'custom-sub-uuid';

    expect(mainCategories.some((m) => m.id === customMainId)).toBe(false);
    expect(subCategories.some((s) => s.id === customSubId)).toBe(false);
  });
});
