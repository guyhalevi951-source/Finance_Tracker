import { type MainCategoryRecord, type SubCategoryRecord } from '../../types/category';

export interface CategoryRow {
  id: string;
  user_id: string;
  profile_id: string;
  parent_id: string | null;
  labels: MainCategoryRecord['labels'];
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export function mainCategoryToRow(
  userId: string,
  profileId: string,
  category: MainCategoryRecord,
): CategoryRow {
  return {
    id: category.id,
    user_id: userId,
    profile_id: profileId,
    parent_id: null,
    labels: category.labels,
    icon: category.icon,
    color: category.color,
    sort_order: category.sortOrder,
    created_at: category.createdAt,
  };
}

export function subCategoryToRow(
  userId: string,
  profileId: string,
  category: SubCategoryRecord,
): CategoryRow {
  return {
    id: category.id,
    user_id: userId,
    profile_id: profileId,
    parent_id: category.parentId,
    labels: category.labels,
    icon: category.icon,
    color: category.color,
    sort_order: category.sortOrder,
    created_at: category.createdAt,
  };
}

export function categoryRowToRaw(row: CategoryRow): Record<string, unknown> {
  return {
    id: row.id,
    parentId: row.parent_id,
    labels: row.labels,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
