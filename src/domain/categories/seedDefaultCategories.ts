import {
  BUILTIN_PARENT_CATEGORY_IDS,
  getSubCategoriesForParent,
  type BuiltinParentCategoryId,
} from './hierarchy';
import {
  BUILTIN_PARENT_COLORS,
  BUILTIN_PARENT_ICON_KEYS,
  BUILTIN_SUB_CATEGORY_ICON_KEYS,
} from './categoryIconLibrary';
import { type MainCategoryRecord, type SubCategoryRecord } from '../../types/category';
import { type BilingualText } from '../../types/bilingual';
import en from '../../i18n/locales/en.json';
import he from '../../i18n/locales/he.json';

const SEED_CREATED_AT = '1970-01-01T00:00:00.000Z';

type ParentLabels = Record<string, string>;
type SubLabels = Record<string, Record<string, string>>;

function parentLabel(parentId: BuiltinParentCategoryId): BilingualText {
  const enParent = (en.category.parent as ParentLabels)[parentId];
  const heParent = (he.category.parent as ParentLabels)[parentId];
  return { en: enParent, he: heParent };
}

function subLabel(parentId: BuiltinParentCategoryId, subKey: string): BilingualText {
  const enSub = (en.category.sub as SubLabels)[parentId]?.[subKey] ?? subKey;
  const heSub = (he.category.sub as SubLabels)[parentId]?.[subKey] ?? subKey;
  return { en: enSub, he: heSub };
}

function subKeyFromId(subId: string): string {
  const dot = subId.indexOf('.');
  return dot >= 0 ? subId.slice(dot + 1) : subId;
}

export function buildDefaultCategorySeed(): {
  mains: MainCategoryRecord[];
  subs: SubCategoryRecord[];
} {
  const mains: MainCategoryRecord[] = BUILTIN_PARENT_CATEGORY_IDS.map((parentId, index) => ({
    id: parentId,
    parentId: null,
    labels: parentLabel(parentId),
    icon: BUILTIN_PARENT_ICON_KEYS[parentId],
    color: BUILTIN_PARENT_COLORS[parentId],
    sortOrder: index,
    createdAt: SEED_CREATED_AT,
  }));

  const subs: SubCategoryRecord[] = BUILTIN_PARENT_CATEGORY_IDS.flatMap((parentId) => {
    const parentColor = BUILTIN_PARENT_COLORS[parentId];
    return getSubCategoriesForParent(parentId).map((subId, subIndex) => {
      const subKey = subKeyFromId(subId);
      return {
        id: subId,
        parentId,
        labels: subLabel(parentId, subKey),
        icon: BUILTIN_SUB_CATEGORY_ICON_KEYS[subId] ?? BUILTIN_PARENT_ICON_KEYS[parentId],
        color: parentColor,
        sortOrder: subIndex,
        createdAt: SEED_CREATED_AT,
      };
    });
  });

  return { mains, subs };
}

export function sortMainCategories(mains: MainCategoryRecord[]): MainCategoryRecord[] {
  return [...mains].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function sortSubCategoriesForParent(
  subs: SubCategoryRecord[],
  parentId: string,
): SubCategoryRecord[] {
  return subs
    .filter((sub) => sub.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}
