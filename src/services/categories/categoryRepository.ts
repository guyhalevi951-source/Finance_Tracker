import {
  type MainCategoryRecord,
  type SubCategoryRecord,
  type CategoryCatalog,
} from '../../types/category';
import { type BudgetProfileId } from '../../config/budgetProfile';
import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import {
  GUEST_CATEGORY_KEY_PREFIXES,
  GUEST_LEGACY_CATEGORY_KEYS,
} from '../../config/storage/guestKeys';
import { SUPABASE_TABLES } from '../../config/supabase/tables';
import { buildDefaultCategorySeed } from '../../domain/categories/seedDefaultCategories';
import {
  DEFAULT_CATEGORY_ICON_KEY,
  BUILTIN_PARENT_COLORS,
} from '../../domain/categories/categoryIconLibrary';
import { DEFAULT_CATEGORY_COLOR } from '../../domain/categories/categoryColorPalette';
import { PROTECTED_MAIN_CATEGORY_ID } from '../../domain/categories/reassignSubCategoriesOnDelete';
import { mergeSubCategoryRecords } from '../../domain/categories/mergeSubCategoryRecords';
import { missingBuiltinSubsToRestore } from '../../domain/categories/deleteSubCategory';
import { getFactoryDefaultCategoryCatalog } from '../../domain/categories/factoryCategoryCatalog';
import { supabase } from '../supabase/client';
import { throwIfPostgrestError } from '../supabase/errors';
import {
  categoryRowToRaw,
  mainCategoryToRow,
  subCategoryToRow,
  type CategoryRow,
} from './categoryRowMapper';

const GUEST_SUB_STORAGE_KEY = GUEST_LEGACY_CATEGORY_KEYS[1];
const GUEST_MAIN_STORAGE_KEY = GUEST_LEGACY_CATEGORY_KEYS[0];
const GUEST_DELETED_SUBS_KEY = GUEST_LEGACY_CATEGORY_KEYS[2];

function guestMainKey(profileId: BudgetProfileId): string {
  return `${GUEST_CATEGORY_KEY_PREFIXES[0]}${profileId}`;
}

function guestSubKey(profileId: BudgetProfileId): string {
  return `${GUEST_CATEGORY_KEY_PREFIXES[1]}${profileId}`;
}

function guestDeletedSubsKey(profileId: BudgetProfileId): string {
  return `${GUEST_CATEGORY_KEY_PREFIXES[2]}${profileId}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseLabels(v: unknown): { en: string; he: string } | null {
  if (!isRecord(v)) return null;
  if (typeof v.en !== 'string' || typeof v.he !== 'string') return null;
  return { en: v.en, he: v.he };
}

function parseMainCategory(v: unknown): MainCategoryRecord | null {
  if (!isRecord(v)) return null;
  const labels = parseLabels(v.labels);
  if (
    typeof v.id !== 'string' ||
    v.parentId !== null ||
    !labels ||
    typeof v.icon !== 'string' ||
    typeof v.color !== 'string' ||
    typeof v.sortOrder !== 'number' ||
    typeof v.createdAt !== 'string'
  ) {
    return null;
  }
  return {
    id: v.id,
    parentId: null,
    labels,
    icon: v.icon,
    color: v.color,
    sortOrder: v.sortOrder,
    createdAt: v.createdAt,
  };
}

function parseSubCategory(v: unknown, fallbackSortOrder: number): SubCategoryRecord | null {
  if (!isRecord(v)) return null;
  const labels = parseLabels(v.labels);
  if (typeof v.id !== 'string' || !labels || typeof v.createdAt !== 'string') {
    return null;
  }

  const parentId =
    typeof v.parentId === 'string' ? v.parentId : PROTECTED_MAIN_CATEGORY_ID;
  const icon = typeof v.icon === 'string' ? v.icon : DEFAULT_CATEGORY_ICON_KEY;
  const color =
    typeof v.color === 'string'
      ? v.color
      : (BUILTIN_PARENT_COLORS[PROTECTED_MAIN_CATEGORY_ID] ?? DEFAULT_CATEGORY_COLOR);
  const sortOrder = typeof v.sortOrder === 'number' ? v.sortOrder : fallbackSortOrder;

  return {
    id: v.id,
    parentId,
    labels,
    icon,
    color,
    sortOrder,
    createdAt: v.createdAt,
  };
}

function loadGuestJson(key: string): unknown[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error('CORRUPTED_CATEGORIES');
  }
}

function saveGuestJson(key: string, value: unknown[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listGuestCategoryProfileIds(): string[] {
  const ids = new Set<string>();
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    for (const prefix of GUEST_CATEGORY_KEY_PREFIXES) {
      if (key.startsWith(prefix) && key.length > prefix.length) {
        ids.add(key.slice(prefix.length));
      }
    }
  }
  return [...ids];
}

export function clearAllGuestCategoryKeys(): void {
  const toRemove = new Set<string>(GUEST_LEGACY_CATEGORY_KEYS);
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (GUEST_CATEGORY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      toRemove.add(key);
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key);
  }
}

async function loadAuthCategoryRows(
  userId: string,
  profileId: BudgetProfileId,
): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.categories)
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId);
  throwIfPostgrestError(error, 'LOAD_CATEGORIES_FAILED');
  return (data ?? []) as CategoryRow[];
}

async function loadAuthMainCategories(
  userId: string,
  profileId: BudgetProfileId,
): Promise<MainCategoryRecord[]> {
  const rows = await loadAuthCategoryRows(userId, profileId);
  return rows
    .filter((row) => row.parent_id === null)
    .map((row) => parseMainCategory(categoryRowToRaw(row)))
    .filter((category): category is MainCategoryRecord => category !== null);
}

async function loadAuthSubCategories(
  userId: string,
  profileId: BudgetProfileId,
): Promise<SubCategoryRecord[]> {
  const rows = await loadAuthCategoryRows(userId, profileId);
  return rows
    .filter((row) => row.parent_id !== null)
    .map((row, index) => parseSubCategory(categoryRowToRaw(row), index))
    .filter((category): category is SubCategoryRecord => category !== null);
}

async function saveAuthMainCategory(
  userId: string,
  profileId: BudgetProfileId,
  category: MainCategoryRecord,
): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLES.categories)
    .upsert(mainCategoryToRow(userId, profileId, category), {
      onConflict: 'user_id,profile_id,id',
    });
  throwIfPostgrestError(error, 'SAVE_CATEGORY_FAILED');
}

async function saveAuthSubCategory(
  userId: string,
  profileId: BudgetProfileId,
  category: SubCategoryRecord,
): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLES.categories)
    .upsert(subCategoryToRow(userId, profileId, category), {
      onConflict: 'user_id,profile_id,id',
    });
  throwIfPostgrestError(error, 'SAVE_CATEGORY_FAILED');
}

async function deleteAuthCategory(
  userId: string,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_TABLES.categories)
    .delete()
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('id', categoryId);
  throwIfPostgrestError(error, 'DELETE_CATEGORY_FAILED');
}

function loadGuestMainCategories(profileId: BudgetProfileId): MainCategoryRecord[] {
  return loadGuestJson(guestMainKey(profileId))
    .map((item) => parseMainCategory(item))
    .filter((category): category is MainCategoryRecord => category !== null);
}

function loadGuestSubCategories(profileId: BudgetProfileId): SubCategoryRecord[] {
  return loadGuestJson(guestSubKey(profileId))
    .map((item, index) => parseSubCategory(item, index))
    .filter((category): category is SubCategoryRecord => category !== null);
}

function loadLegacyGuestMainCategories(): MainCategoryRecord[] {
  return loadGuestJson(GUEST_MAIN_STORAGE_KEY)
    .map((item) => parseMainCategory(item))
    .filter((category): category is MainCategoryRecord => category !== null);
}

function loadLegacyGuestSubCategories(): SubCategoryRecord[] {
  return loadGuestJson(GUEST_SUB_STORAGE_KEY)
    .map((item, index) => parseSubCategory(item, index))
    .filter((category): category is SubCategoryRecord => category !== null);
}

function saveGuestMainCategories(
  profileId: BudgetProfileId,
  categories: MainCategoryRecord[],
): void {
  saveGuestJson(guestMainKey(profileId), categories);
}

function saveGuestSubCategories(
  profileId: BudgetProfileId,
  categories: SubCategoryRecord[],
): void {
  saveGuestJson(guestSubKey(profileId), categories);
}

function loadGuestDeletedSubIds(profileId: BudgetProfileId): string[] {
  const raw = localStorage.getItem(guestDeletedSubsKey(profileId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function loadLegacyGuestDeletedSubIds(): string[] {
  const raw = localStorage.getItem(GUEST_DELETED_SUBS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

async function migrateLegacyToProfileIfNeeded(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<void> {
  if (userId || profileId !== MASTER_BUDGET_ID) return;

  const mains = loadGuestMainCategories(profileId);
  const subs = loadGuestSubCategories(profileId);
  if (mains.length > 0 || subs.length > 0) return;

  const legacyMains = loadLegacyGuestMainCategories();
  const legacySubs = loadLegacyGuestSubCategories();
  if (legacyMains.length === 0 && legacySubs.length === 0) return;

  await persistSeed(null, profileId, { mains: legacyMains, subs: legacySubs });

  for (const subId of loadLegacyGuestDeletedSubIds()) {
    await rememberDeletedSubCategory(null, profileId, subId);
  }
}

export async function loadDeletedSubCategoryIds(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<string[]> {
  if (userId) {
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.deletedSubcategories)
      .select('category_id')
      .eq('user_id', userId)
      .eq('profile_id', profileId);
    throwIfPostgrestError(error, 'LOAD_DELETED_SUBCATEGORIES_FAILED');
    return (data ?? []).map((row) => row.category_id as string);
  }
  return loadGuestDeletedSubIds(profileId);
}

export async function rememberDeletedSubCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  subId: string,
): Promise<void> {
  if (userId) {
    const { error } = await supabase.from(SUPABASE_TABLES.deletedSubcategories).upsert(
      { user_id: userId, profile_id: profileId, category_id: subId },
      { onConflict: 'user_id,profile_id,category_id' },
    );
    throwIfPostgrestError(error, 'SAVE_DELETED_SUBCATEGORY_FAILED');
    return;
  }
  const existing = loadGuestDeletedSubIds(profileId);
  if (existing.includes(subId)) return;
  saveGuestJson(guestDeletedSubsKey(profileId), [...existing, subId]);
}

export async function clearDeletedSubCategoryIds(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.deletedSubcategories)
      .delete()
      .eq('user_id', userId)
      .eq('profile_id', profileId);
    throwIfPostgrestError(error, 'CLEAR_DELETED_SUBCATEGORIES_FAILED');
    return;
  }
  localStorage.removeItem(guestDeletedSubsKey(profileId));
}

interface CategorySeedBundle {
  mains: MainCategoryRecord[];
  subs: SubCategoryRecord[];
}

async function persistSeed(
  userId: string | null,
  profileId: BudgetProfileId,
  seed: CategorySeedBundle,
): Promise<void> {
  if (userId) {
    const rows = [
      ...seed.mains.map((main) => mainCategoryToRow(userId, profileId, main)),
      ...seed.subs.map((sub) => subCategoryToRow(userId, profileId, sub)),
    ];
    if (rows.length === 0) return;
    const { error } = await supabase
      .from(SUPABASE_TABLES.categories)
      .upsert(rows, { onConflict: 'user_id,profile_id,id' });
    throwIfPostgrestError(error, 'SAVE_CATEGORY_FAILED');
    return;
  }

  saveGuestMainCategories(profileId, seed.mains);
  saveGuestSubCategories(profileId, seed.subs);
}

export async function loadMainCategories(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<MainCategoryRecord[]> {
  await migrateLegacyToProfileIfNeeded(userId, profileId);
  if (userId) return loadAuthMainCategories(userId, profileId);
  return loadGuestMainCategories(profileId);
}

export async function loadSubCategories(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<SubCategoryRecord[]> {
  await migrateLegacyToProfileIfNeeded(userId, profileId);
  if (userId) return loadAuthSubCategories(userId, profileId);
  return loadGuestSubCategories(profileId);
}

export async function ensureDefaultCategoriesSeeded(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<CategoryCatalog> {
  await migrateLegacyToProfileIfNeeded(userId, profileId);

  const mains = userId
    ? await loadAuthMainCategories(userId, profileId)
    : loadGuestMainCategories(profileId);
  const existingSubs = userId
    ? await loadAuthSubCategories(userId, profileId)
    : loadGuestSubCategories(profileId);

  if (mains.length > 0) {
    const seed = buildDefaultCategorySeed();
    const existingIds = new Set(existingSubs.map((sub) => sub.id));
    const deletedIds = new Set(await loadDeletedSubCategoryIds(userId, profileId));
    const missingBuiltinSubs = missingBuiltinSubsToRestore(seed.subs, existingIds, deletedIds);

    if (missingBuiltinSubs.length > 0) {
      const repairedSubs = mergeSubCategoryRecords(existingSubs, missingBuiltinSubs);
      if (userId) {
        await saveSubCategories(userId, profileId, missingBuiltinSubs);
      } else {
        saveGuestSubCategories(profileId, repairedSubs);
      }
      return { mainCategories: mains, subCategories: repairedSubs };
    }

    return { mainCategories: mains, subCategories: existingSubs };
  }

  const seed = buildDefaultCategorySeed();
  const seedSubIds = new Set(seed.subs.map((sub) => sub.id));
  const legacyCustomSubs = existingSubs.filter((sub) => !seedSubIds.has(sub.id));
  const mergedSubs = [...seed.subs, ...legacyCustomSubs];

  await persistSeed(userId, profileId, { mains: seed.mains, subs: mergedSubs });
  return { mainCategories: seed.mains, subCategories: mergedSubs };
}

export async function saveMainCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  category: MainCategoryRecord,
): Promise<void> {
  if (userId) {
    await saveAuthMainCategory(userId, profileId, category);
    return;
  }
  const existing = loadGuestMainCategories(profileId);
  saveGuestMainCategories(
    profileId,
    [...existing.filter((item) => item.id !== category.id), category],
  );
}

export async function saveMainCategoriesOrder(
  userId: string | null,
  profileId: BudgetProfileId,
  categories: MainCategoryRecord[],
): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.categories)
      .upsert(
        categories.map((category) => mainCategoryToRow(userId, profileId, category)),
        { onConflict: 'user_id,profile_id,id' },
      );
    throwIfPostgrestError(error, 'SAVE_CATEGORY_FAILED');
    return;
  }
  saveGuestMainCategories(profileId, categories);
}

export async function deleteMainCategoryRecord(
  userId: string | null,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthCategory(userId, profileId, categoryId);
    return;
  }
  const existing = loadGuestMainCategories(profileId);
  saveGuestMainCategories(profileId, existing.filter((item) => item.id !== categoryId));
}

export async function saveSubCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  category: SubCategoryRecord,
): Promise<void> {
  if (userId) {
    await saveAuthSubCategory(userId, profileId, category);
    return;
  }
  const existing = loadGuestSubCategories(profileId);
  saveGuestSubCategories(
    profileId,
    [...existing.filter((item) => item.id !== category.id), category],
  );
}

export async function saveSubCategories(
  userId: string | null,
  profileId: BudgetProfileId,
  categories: SubCategoryRecord[],
): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.categories)
      .upsert(
        categories.map((category) => subCategoryToRow(userId, profileId, category)),
        { onConflict: 'user_id,profile_id,id' },
      );
    throwIfPostgrestError(error, 'SAVE_CATEGORY_FAILED');
    return;
  }
  const existing = loadGuestSubCategories(profileId);
  saveGuestSubCategories(profileId, mergeSubCategoryRecords(existing, categories));
}

export async function deleteSubCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthCategory(userId, profileId, categoryId);
    return;
  }
  const existing = loadGuestSubCategories(profileId);
  saveGuestSubCategories(profileId, existing.filter((item) => item.id !== categoryId));
}

export async function resetCategoriesToDefaults(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<CategoryCatalog> {
  const catalog = getFactoryDefaultCategoryCatalog();
  const seedMainIds = new Set(catalog.mainCategories.map((main) => main.id));
  const seedSubIds = new Set(catalog.subCategories.map((sub) => sub.id));

  if (userId) {
    const existingMains = await loadAuthMainCategories(userId, profileId);
    const existingSubs = await loadAuthSubCategories(userId, profileId);

    for (const main of existingMains) {
      if (!seedMainIds.has(main.id)) {
        await deleteAuthCategory(userId, profileId, main.id);
      }
    }
    for (const sub of existingSubs) {
      if (!seedSubIds.has(sub.id)) {
        await deleteAuthCategory(userId, profileId, sub.id);
      }
    }
    await persistSeed(userId, profileId, {
      mains: catalog.mainCategories,
      subs: catalog.subCategories,
    });
  } else {
    saveGuestMainCategories(profileId, catalog.mainCategories);
    saveGuestSubCategories(profileId, catalog.subCategories);
  }

  await clearDeletedSubCategoryIds(userId, profileId);

  return catalog;
}

/** @deprecated Use loadSubCategories */
export async function loadCategories(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<SubCategoryRecord[]> {
  return loadSubCategories(userId, profileId);
}

/** @deprecated Use saveSubCategory */
export async function saveCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  category: SubCategoryRecord,
): Promise<void> {
  return saveSubCategory(userId, profileId, category);
}

/** @deprecated Use deleteSubCategory */
export async function deleteCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  return deleteSubCategory(userId, profileId, categoryId);
}
