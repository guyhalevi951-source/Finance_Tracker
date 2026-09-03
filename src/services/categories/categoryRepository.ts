import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  type MainCategoryRecord,
  type SubCategoryRecord,
  type CategoryCatalog,
} from '../../types/category';
import { type BudgetProfileId } from '../../config/budgetProfile';
import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import { FIRESTORE_COLLECTIONS } from '../../config/firebase/collections';
import { db } from '../firebase';
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

const GUEST_SUB_STORAGE_KEY = 'customCategories';
const GUEST_MAIN_STORAGE_KEY = 'mainCategories';
const GUEST_DELETED_SUBS_KEY = 'deletedSubCategoryIds';

function guestMainKey(profileId: BudgetProfileId): string {
  return `${GUEST_MAIN_STORAGE_KEY}:${profileId}`;
}

function guestSubKey(profileId: BudgetProfileId): string {
  return `${GUEST_SUB_STORAGE_KEY}:${profileId}`;
}

function guestDeletedSubsKey(profileId: BudgetProfileId): string {
  return `${GUEST_DELETED_SUBS_KEY}:${profileId}`;
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

function profileMainCategoriesRef(
  firestoreDb: Firestore,
  userId: string,
  profileId: BudgetProfileId,
) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.budgetProfiles,
    profileId,
    FIRESTORE_COLLECTIONS.mainCategories,
  );
}

function profileSubCategoriesRef(
  firestoreDb: Firestore,
  userId: string,
  profileId: BudgetProfileId,
) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.budgetProfiles,
    profileId,
    FIRESTORE_COLLECTIONS.categories,
  );
}

function profileDeletedSubsRef(
  firestoreDb: Firestore,
  userId: string,
  profileId: BudgetProfileId,
) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.budgetProfiles,
    profileId,
    FIRESTORE_COLLECTIONS.deletedSubCategories,
  );
}

function legacyMainCategoriesRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.mainCategories,
  );
}

function legacySubCategoriesRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.categories,
  );
}

function legacyDeletedSubsRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.deletedSubCategories,
  );
}

async function loadAuthMainCategories(
  userId: string,
  profileId: BudgetProfileId,
): Promise<MainCategoryRecord[]> {
  const snap = await getDocs(profileMainCategoriesRef(db, userId, profileId));
  return snap.docs
    .map((d) => parseMainCategory(d.data()))
    .filter((c): c is MainCategoryRecord => c !== null);
}

async function loadAuthSubCategories(
  userId: string,
  profileId: BudgetProfileId,
): Promise<SubCategoryRecord[]> {
  const snap = await getDocs(profileSubCategoriesRef(db, userId, profileId));
  return snap.docs
    .map((d, index) => parseSubCategory(d.data(), index))
    .filter((c): c is SubCategoryRecord => c !== null);
}

async function loadLegacyAuthMainCategories(userId: string): Promise<MainCategoryRecord[]> {
  const snap = await getDocs(legacyMainCategoriesRef(db, userId));
  return snap.docs
    .map((d) => parseMainCategory(d.data()))
    .filter((c): c is MainCategoryRecord => c !== null);
}

async function loadLegacyAuthSubCategories(userId: string): Promise<SubCategoryRecord[]> {
  const snap = await getDocs(legacySubCategoriesRef(db, userId));
  return snap.docs
    .map((d, index) => parseSubCategory(d.data(), index))
    .filter((c): c is SubCategoryRecord => c !== null);
}

async function saveAuthMainCategory(
  userId: string,
  profileId: BudgetProfileId,
  category: MainCategoryRecord,
): Promise<void> {
  const ref = doc(profileMainCategoriesRef(db, userId, profileId), category.id);
  await setDoc(ref, category);
}

async function saveAuthSubCategory(
  userId: string,
  profileId: BudgetProfileId,
  category: SubCategoryRecord,
): Promise<void> {
  const ref = doc(profileSubCategoriesRef(db, userId, profileId), category.id);
  await setDoc(ref, category);
}

async function deleteAuthMainCategory(
  userId: string,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  const ref = doc(profileMainCategoriesRef(db, userId, profileId), categoryId);
  await deleteDoc(ref);
}

async function deleteAuthSubCategory(
  userId: string,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  const ref = doc(profileSubCategoriesRef(db, userId, profileId), categoryId);
  await deleteDoc(ref);
}

function loadGuestMainCategories(profileId: BudgetProfileId): MainCategoryRecord[] {
  return loadGuestJson(guestMainKey(profileId))
    .map((item) => parseMainCategory(item))
    .filter((c): c is MainCategoryRecord => c !== null);
}

function loadGuestSubCategories(profileId: BudgetProfileId): SubCategoryRecord[] {
  return loadGuestJson(guestSubKey(profileId))
    .map((item, index) => parseSubCategory(item, index))
    .filter((c): c is SubCategoryRecord => c !== null);
}

function loadLegacyGuestMainCategories(): MainCategoryRecord[] {
  return loadGuestJson(GUEST_MAIN_STORAGE_KEY)
    .map((item) => parseMainCategory(item))
    .filter((c): c is MainCategoryRecord => c !== null);
}

function loadLegacyGuestSubCategories(): SubCategoryRecord[] {
  return loadGuestJson(GUEST_SUB_STORAGE_KEY)
    .map((item, index) => parseSubCategory(item, index))
    .filter((c): c is SubCategoryRecord => c !== null);
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

async function loadLegacyDeletedSubCategoryIds(userId: string | null): Promise<string[]> {
  if (userId) {
    const snap = await getDocs(legacyDeletedSubsRef(db, userId));
    return snap.docs.map((d) => d.id);
  }
  return loadLegacyGuestDeletedSubIds();
}

async function migrateLegacyToProfileIfNeeded(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<void> {
  if (profileId !== MASTER_BUDGET_ID) return;

  const mains = userId
    ? await loadAuthMainCategories(userId, profileId)
    : loadGuestMainCategories(profileId);
  const subs = userId
    ? await loadAuthSubCategories(userId, profileId)
    : loadGuestSubCategories(profileId);

  if (mains.length > 0 || subs.length > 0) return;

  const legacyMains = userId
    ? await loadLegacyAuthMainCategories(userId)
    : loadLegacyGuestMainCategories();
  const legacySubs = userId
    ? await loadLegacyAuthSubCategories(userId)
    : loadLegacyGuestSubCategories();

  if (legacyMains.length === 0 && legacySubs.length === 0) return;

  await persistSeed(userId, profileId, { mains: legacyMains, subs: legacySubs });

  const legacyDeleted = await loadLegacyDeletedSubCategoryIds(userId);
  for (const subId of legacyDeleted) {
    await rememberDeletedSubCategory(userId, profileId, subId);
  }
}

export async function loadDeletedSubCategoryIds(
  userId: string | null,
  profileId: BudgetProfileId,
): Promise<string[]> {
  if (userId) {
    const snap = await getDocs(profileDeletedSubsRef(db, userId, profileId));
    return snap.docs.map((d) => d.id);
  }
  return loadGuestDeletedSubIds(profileId);
}

export async function rememberDeletedSubCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  subId: string,
): Promise<void> {
  if (userId) {
    await setDoc(doc(profileDeletedSubsRef(db, userId, profileId), subId), { id: subId });
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
    const snap = await getDocs(profileDeletedSubsRef(db, userId, profileId));
    if (snap.empty) return;
    const batch = writeBatch(db);
    for (const deleted of snap.docs) {
      batch.delete(deleted.ref);
    }
    await batch.commit();
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
    const batch = writeBatch(db);
    for (const main of seed.mains) {
      batch.set(doc(profileMainCategoriesRef(db, userId, profileId), main.id), main);
    }
    for (const sub of seed.subs) {
      batch.set(doc(profileSubCategoriesRef(db, userId, profileId), sub.id), sub);
    }
    await batch.commit();
  } else {
    saveGuestMainCategories(profileId, seed.mains);
    saveGuestSubCategories(profileId, seed.subs);
  }
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

  const mains = await loadMainCategories(userId, profileId);
  const existingSubs = await loadSubCategories(userId, profileId);

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
  } else {
    const existing = loadGuestMainCategories(profileId);
    const updated = [...existing.filter((c) => c.id !== category.id), category];
    saveGuestMainCategories(profileId, updated);
  }
}

export async function saveMainCategoriesOrder(
  userId: string | null,
  profileId: BudgetProfileId,
  categories: MainCategoryRecord[],
): Promise<void> {
  if (userId) {
    const batch = writeBatch(db);
    for (const category of categories) {
      batch.set(doc(profileMainCategoriesRef(db, userId, profileId), category.id), category);
    }
    await batch.commit();
  } else {
    saveGuestMainCategories(profileId, categories);
  }
}

export async function deleteMainCategoryRecord(
  userId: string | null,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthMainCategory(userId, profileId, categoryId);
  } else {
    const existing = loadGuestMainCategories(profileId);
    saveGuestMainCategories(profileId, existing.filter((c) => c.id !== categoryId));
  }
}

export async function saveSubCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  category: SubCategoryRecord,
): Promise<void> {
  if (userId) {
    await saveAuthSubCategory(userId, profileId, category);
  } else {
    const existing = loadGuestSubCategories(profileId);
    const updated = [...existing.filter((c) => c.id !== category.id), category];
    saveGuestSubCategories(profileId, updated);
  }
}

export async function saveSubCategories(
  userId: string | null,
  profileId: BudgetProfileId,
  categories: SubCategoryRecord[],
): Promise<void> {
  if (userId) {
    const batch = writeBatch(db);
    for (const category of categories) {
      batch.set(doc(profileSubCategoriesRef(db, userId, profileId), category.id), category);
    }
    await batch.commit();
  } else {
    const existing = loadGuestSubCategories(profileId);
    const merged = mergeSubCategoryRecords(existing, categories);
    saveGuestSubCategories(profileId, merged);
  }
}

export async function deleteSubCategory(
  userId: string | null,
  profileId: BudgetProfileId,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthSubCategory(userId, profileId, categoryId);
  } else {
    const existing = loadGuestSubCategories(profileId);
    saveGuestSubCategories(profileId, existing.filter((c) => c.id !== categoryId));
  }
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
        await deleteAuthMainCategory(userId, profileId, main.id);
      }
    }
    for (const sub of existingSubs) {
      if (!seedSubIds.has(sub.id)) {
        await deleteAuthSubCategory(userId, profileId, sub.id);
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
