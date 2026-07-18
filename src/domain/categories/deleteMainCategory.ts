import {
  type MainCategoryRecord,
  type SubCategoryRecord,
  type MainCategoryInput,
} from '../../types/category';
import { PROTECTED_MAIN_CATEGORY_ID, reassignSubCategoriesToOther } from './reassignSubCategoriesOnDelete';

export type DeleteMainCategoryError = 'cannotDeleteOther';

export interface DeleteMainCategoryResult {
  mains: MainCategoryRecord[];
  subs: SubCategoryRecord[];
}

export function deleteMainCategory(
  mains: MainCategoryRecord[],
  subs: SubCategoryRecord[],
  mainId: string,
): DeleteMainCategoryResult | DeleteMainCategoryError {
  if (mainId === PROTECTED_MAIN_CATEGORY_ID) {
    return 'cannotDeleteOther';
  }

  const otherMain = mains.find((main) => main.id === PROTECTED_MAIN_CATEGORY_ID);
  if (!otherMain) {
    throw new Error('Missing protected "other" main category');
  }

  const updatedSubs = reassignSubCategoriesToOther(subs, mainId, otherMain);
  const updatedMains = mains.filter((main) => main.id !== mainId);

  return { mains: updatedMains, subs: updatedSubs };
}

export interface NewMainCategoryBundle {
  main: MainCategoryRecord;
  sub: SubCategoryRecord;
}

export function buildNewMainCategoryWithDefaultSub(
  input: MainCategoryInput,
  mainId: string,
  subId: string,
  sortOrder: number,
  createdAt: string,
): NewMainCategoryBundle {
  const main: MainCategoryRecord = {
    id: mainId,
    parentId: null,
    labels: input.labels,
    icon: input.icon,
    color: input.color,
    sortOrder,
    createdAt,
  };

  const sub: SubCategoryRecord = {
    id: subId,
    parentId: mainId,
    labels: input.labels,
    icon: input.icon,
    color: input.color,
    sortOrder: 0,
    createdAt,
  };

  return { main, sub };
}

export function reorderMainCategories(
  mains: MainCategoryRecord[],
  orderedIds: string[],
): MainCategoryRecord[] {
  const byId = new Map(mains.map((main) => [main.id, main]));
  const reordered: MainCategoryRecord[] = [];

  for (const id of orderedIds) {
    const main = byId.get(id);
    if (main) reordered.push(main);
  }

  for (const main of mains) {
    if (!orderedIds.includes(main.id)) {
      reordered.push(main);
    }
  }

  return reordered.map((main, index) => ({ ...main, sortOrder: index }));
}
