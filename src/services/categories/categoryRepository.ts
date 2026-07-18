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
import { FIRESTORE_COLLECTIONS } from '../../config/firebase/collections';
import { db } from '../firebase';
import { buildDefaultCategorySeed } from '../../domain/categories/seedDefaultCategories';
import {
  DEFAULT_CATEGORY_ICON_KEY,
  BUILTIN_PARENT_COLORS,
} from '../../domain/categories/categoryIconLibrary';
import { DEFAULT_CATEGORY_COLOR } from '../../domain/categories/categoryColorPalette';
import { PROTECTED_MAIN_CATEGORY_ID } from '../../domain/categories/reassignSubCategoriesOnDelete';

const GUEST_SUB_STORAGE_KEY = 'customCategories';
const GUEST_MAIN_STORAGE_KEY = 'mainCategories';

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

function loadGuestJson<T>(key: string): unknown[] {
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

function userMainCategoriesRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.mainCategories,
  );
}

function userSubCategoriesRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.categories,
  );
}

async function loadAuthMainCategories(userId: string): Promise<MainCategoryRecord[]> {
  const snap = await getDocs(userMainCategoriesRef(db, userId));
  return snap.docs
    .map((d) => parseMainCategory(d.data()))
    .filter((c): c is MainCategoryRecord => c !== null);
}

async function loadAuthSubCategories(userId: string): Promise<SubCategoryRecord[]> {
  const snap = await getDocs(userSubCategoriesRef(db, userId));
  return snap.docs
    .map((d, index) => parseSubCategory(d.data(), index))
    .filter((c): c is SubCategoryRecord => c !== null);
}

async function saveAuthMainCategory(userId: string, category: MainCategoryRecord): Promise<void> {
  const ref = doc(userMainCategoriesRef(db, userId), category.id);
  await setDoc(ref, category);
}

async function saveAuthSubCategory(userId: string, category: SubCategoryRecord): Promise<void> {
  const ref = doc(userSubCategoriesRef(db, userId), category.id);
  await setDoc(ref, category);
}

async function deleteAuthMainCategory(userId: string, categoryId: string): Promise<void> {
  const ref = doc(userMainCategoriesRef(db, userId), categoryId);
  await deleteDoc(ref);
}

async function deleteAuthSubCategory(userId: string, categoryId: string): Promise<void> {
  const ref = doc(userSubCategoriesRef(db, userId), categoryId);
  await deleteDoc(ref);
}

function loadGuestMainCategories(): MainCategoryRecord[] {
  return loadGuestJson(GUEST_MAIN_STORAGE_KEY)
    .map((item) => parseMainCategory(item))
    .filter((c): c is MainCategoryRecord => c !== null);
}

function loadGuestSubCategories(): SubCategoryRecord[] {
  return loadGuestJson(GUEST_SUB_STORAGE_KEY)
    .map((item, index) => parseSubCategory(item, index))
    .filter((c): c is SubCategoryRecord => c !== null);
}

function saveGuestMainCategories(categories: MainCategoryRecord[]): void {
  saveGuestJson(GUEST_MAIN_STORAGE_KEY, categories);
}

function saveGuestSubCategories(categories: SubCategoryRecord[]): void {
  saveGuestJson(GUEST_SUB_STORAGE_KEY, categories);
}

async function persistSeed(userId: string | null, seed: CategoryCatalog): Promise<void> {
  if (userId) {
    const batch = writeBatch(db);
    for (const main of seed.mains) {
      batch.set(doc(userMainCategoriesRef(db, userId), main.id), main);
    }
    for (const sub of seed.subs) {
      batch.set(doc(userSubCategoriesRef(db, userId), sub.id), sub);
    }
    await batch.commit();
  } else {
    saveGuestMainCategories(seed.mains);
    saveGuestSubCategories(seed.subs);
  }
}

export async function loadMainCategories(userId: string | null): Promise<MainCategoryRecord[]> {
  if (userId) return loadAuthMainCategories(userId);
  return loadGuestMainCategories();
}

export async function loadSubCategories(userId: string | null): Promise<SubCategoryRecord[]> {
  if (userId) return loadAuthSubCategories(userId);
  return loadGuestSubCategories();
}

export async function ensureDefaultCategoriesSeeded(
  userId: string | null,
): Promise<CategoryCatalog> {
  const mains = await loadMainCategories(userId);
  const existingSubs = await loadSubCategories(userId);

  if (mains.length > 0) {
    return { mainCategories: mains, subCategories: existingSubs };
  }

  const seed = buildDefaultCategorySeed();
  const seedSubIds = new Set(seed.subs.map((sub) => sub.id));
  const legacyCustomSubs = existingSubs.filter((sub) => !seedSubIds.has(sub.id));
  const mergedSubs = [...seed.subs, ...legacyCustomSubs];

  await persistSeed(userId, { mains: seed.mains, subs: mergedSubs });
  return { mainCategories: seed.mains, subCategories: mergedSubs };
}

export async function saveMainCategory(
  userId: string | null,
  category: MainCategoryRecord,
): Promise<void> {
  if (userId) {
    await saveAuthMainCategory(userId, category);
  } else {
    const existing = loadGuestMainCategories();
    const updated = [...existing.filter((c) => c.id !== category.id), category];
    saveGuestMainCategories(updated);
  }
}

export async function saveMainCategoriesOrder(
  userId: string | null,
  categories: MainCategoryRecord[],
): Promise<void> {
  if (userId) {
    const batch = writeBatch(db);
    for (const category of categories) {
      batch.set(doc(userMainCategoriesRef(db, userId), category.id), category);
    }
    await batch.commit();
  } else {
    saveGuestMainCategories(categories);
  }
}

export async function deleteMainCategoryRecord(
  userId: string | null,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthMainCategory(userId, categoryId);
  } else {
    const existing = loadGuestMainCategories();
    saveGuestMainCategories(existing.filter((c) => c.id !== categoryId));
  }
}

export async function saveSubCategory(
  userId: string | null,
  category: SubCategoryRecord,
): Promise<void> {
  if (userId) {
    await saveAuthSubCategory(userId, category);
  } else {
    const existing = loadGuestSubCategories();
    const updated = [...existing.filter((c) => c.id !== category.id), category];
    saveGuestSubCategories(updated);
  }
}

export async function saveSubCategories(
  userId: string | null,
  categories: SubCategoryRecord[],
): Promise<void> {
  if (userId) {
    const batch = writeBatch(db);
    for (const category of categories) {
      batch.set(doc(userSubCategoriesRef(db, userId), category.id), category);
    }
    await batch.commit();
  } else {
    saveGuestSubCategories(categories);
  }
}

export async function deleteSubCategory(
  userId: string | null,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthSubCategory(userId, categoryId);
  } else {
    const existing = loadGuestSubCategories();
    saveGuestSubCategories(existing.filter((c) => c.id !== categoryId));
  }
}

/** @deprecated Use loadSubCategories */
export async function loadCategories(userId: string | null): Promise<SubCategoryRecord[]> {
  return loadSubCategories(userId);
}

/** @deprecated Use saveSubCategory */
export async function saveCategory(
  userId: string | null,
  category: SubCategoryRecord,
): Promise<void> {
  return saveSubCategory(userId, category);
}

/** @deprecated Use deleteSubCategory */
export async function deleteCategory(
  userId: string | null,
  categoryId: string,
): Promise<void> {
  return deleteSubCategory(userId, categoryId);
}
