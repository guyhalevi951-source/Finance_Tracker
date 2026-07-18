import { type CategoryCatalog } from '../../types/category';
import { buildDefaultCategorySeed } from './seedDefaultCategories';

/** SSOT factory-default category catalog returned by reset-to-defaults. */
export function getFactoryDefaultCategoryCatalog(): CategoryCatalog {
  const { mains, subs } = buildDefaultCategorySeed();
  return { mainCategories: mains, subCategories: subs };
}
