import { type SubCategoryRecord } from '../../types/category';

/**
 * Upserts sub-category records by id without dropping unrelated entries.
 */
export function mergeSubCategoryRecords(
  existing: SubCategoryRecord[],
  updates: SubCategoryRecord[],
): SubCategoryRecord[] {
  const byId = new Map(existing.map((record) => [record.id, record]));
  for (const update of updates) {
    byId.set(update.id, update);
  }
  return [...byId.values()];
}
