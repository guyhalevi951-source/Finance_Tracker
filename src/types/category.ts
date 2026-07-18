import { type BilingualText } from './bilingual';

export interface CategoryRecord {
  id: string;
  parentId: string | null;
  labels: BilingualText;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export type MainCategoryRecord = CategoryRecord & { parentId: null };
export type SubCategoryRecord = CategoryRecord & { parentId: string };

/** @deprecated Use SubCategoryRecord — kept for gradual migration at call sites. */
export type CustomCategory = SubCategoryRecord;

export interface CategoryCatalog {
  mainCategories: MainCategoryRecord[];
  subCategories: SubCategoryRecord[];
}

export interface MainCategoryInput {
  labels: BilingualText;
  icon: string;
  color: string;
}

export interface SubCategoryInput {
  labels: BilingualText;
  icon: string;
}
