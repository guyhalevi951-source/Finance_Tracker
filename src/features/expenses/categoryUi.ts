import { type LucideIcon } from 'lucide-react';
import {
  type MainCategoryRecord,
  type SubCategoryRecord,
} from '../../types/category';
import { getCategoryIconComponent } from '../categories/iconRegistry';
import {
  DEFAULT_CATEGORY_ICON_KEY,
  BUILTIN_PARENT_COLORS,
  BUILTIN_PARENT_ICON_KEYS,
} from '../../domain/categories/categoryIconLibrary';
import { DEFAULT_CATEGORY_COLOR } from '../../domain/categories/categoryColorPalette';
import { PROTECTED_MAIN_CATEGORY_ID } from '../../domain/categories/reassignSubCategoriesOnDelete';
import { resolveParentCategoryId } from '../../domain/categories/resolveParentCategoryId';
import { isBuiltinParentCategoryId } from '../../domain/categories/hierarchy';

export interface CategoryUiPresentation {
  icon: LucideIcon;
  color: string;
}

function findMain(
  mainCategories: MainCategoryRecord[],
  mainId: string,
): MainCategoryRecord | undefined {
  return mainCategories.find((main) => main.id === mainId);
}

function findSub(
  subCategories: SubCategoryRecord[],
  subId: string,
): SubCategoryRecord | undefined {
  return subCategories.find((sub) => sub.id === subId);
}

function fallbackMain(mainCategories: MainCategoryRecord[]): MainCategoryRecord | undefined {
  return findMain(mainCategories, PROTECTED_MAIN_CATEGORY_ID);
}

export function getMainCategoryUI(
  mainId: string,
  mainCategories: MainCategoryRecord[],
): CategoryUiPresentation {
  const main = findMain(mainCategories, mainId) ?? fallbackMain(mainCategories);
  if (main) {
    return {
      icon: getCategoryIconComponent(main.icon),
      color: main.color,
    };
  }

  if (isBuiltinParentCategoryId(mainId)) {
    return {
      icon: getCategoryIconComponent(BUILTIN_PARENT_ICON_KEYS[mainId] ?? DEFAULT_CATEGORY_ICON_KEY),
      color: BUILTIN_PARENT_COLORS[mainId] ?? DEFAULT_CATEGORY_COLOR,
    };
  }

  return {
    icon: getCategoryIconComponent(DEFAULT_CATEGORY_ICON_KEY),
    color: DEFAULT_CATEGORY_COLOR,
  };
}

export function getSubCategoryUI(
  subId: string,
  mainCategories: MainCategoryRecord[],
  subCategories: SubCategoryRecord[],
): CategoryUiPresentation {
  const sub = findSub(subCategories, subId);
  if (sub) {
    return {
      icon: getCategoryIconComponent(sub.icon),
      color: sub.color,
    };
  }

  const parentId = resolveParentCategoryId(subId, subCategories);
  return getMainCategoryUI(parentId, mainCategories);
}

export function getCategoryUI(
  categoryId: string,
  mainCategories: MainCategoryRecord[],
  subCategories: SubCategoryRecord[],
): CategoryUiPresentation {
  const asMain = findMain(mainCategories, categoryId);
  if (asMain) return getMainCategoryUI(categoryId, mainCategories);
  return getSubCategoryUI(categoryId, mainCategories, subCategories);
}
