import { type MainCategoryRecord, type SubCategoryRecord } from '../../types/category';

export const PROTECTED_MAIN_CATEGORY_ID = 'other';

export function isProtectedMainCategoryId(mainId: string): boolean {
  return mainId === PROTECTED_MAIN_CATEGORY_ID;
}

export function reassignSubCategoriesToOther(
  subs: SubCategoryRecord[],
  deletedMainId: string,
  otherMain: MainCategoryRecord,
): SubCategoryRecord[] {
  return subs.map((sub) => {
    if (sub.parentId !== deletedMainId) return sub;
    return {
      ...sub,
      parentId: otherMain.id,
      color: otherMain.color,
    };
  });
}
