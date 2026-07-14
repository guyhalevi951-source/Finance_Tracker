import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { type CustomCategory } from '../../types/category';
import { FIRESTORE_COLLECTIONS } from '../../config/firebase/collections';
import { db } from '../firebase';

const GUEST_STORAGE_KEY = 'customCategories';

// ── Guest (localStorage) ──────────────────────────────────────────────────────

function loadGuestCategories(): CustomCategory[] {
  const raw = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('CORRUPTED_CATEGORIES');
  }

  if (!Array.isArray(parsed)) throw new Error('INVALID_CATEGORIES');
  if (!parsed.every(isValidCustomCategory)) throw new Error('INVALID_CATEGORIES');

  return parsed;
}

function saveGuestCategories(categories: CustomCategory[]): void {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(categories));
}

function isValidCustomCategory(v: unknown): v is CustomCategory {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.labels === 'object' &&
    obj.labels !== null &&
    typeof (obj.labels as Record<string, unknown>).en === 'string' &&
    typeof (obj.labels as Record<string, unknown>).he === 'string'
  );
}

// ── Authenticated (Firestore) ─────────────────────────────────────────────────

function userCategoriesRef(firestoreDb: Firestore, userId: string) {
  return collection(firestoreDb, FIRESTORE_COLLECTIONS.users, userId, FIRESTORE_COLLECTIONS.categories);
}

async function loadAuthCategories(userId: string): Promise<CustomCategory[]> {
  const snap = await getDocs(userCategoriesRef(db, userId));
  return snap.docs
    .map((d) => d.data() as unknown)
    .filter(isValidCustomCategory);
}

async function saveAuthCategory(userId: string, category: CustomCategory): Promise<void> {
  const ref = doc(userCategoriesRef(db, userId), category.id);
  await setDoc(ref, category);
}

async function deleteAuthCategory(userId: string, categoryId: string): Promise<void> {
  const ref = doc(userCategoriesRef(db, userId), categoryId);
  await deleteDoc(ref);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadCategories(userId: string | null): Promise<CustomCategory[]> {
  if (userId) return loadAuthCategories(userId);
  return loadGuestCategories();
}

export async function saveCategory(
  userId: string | null,
  category: CustomCategory,
): Promise<void> {
  if (userId) {
    await saveAuthCategory(userId, category);
  } else {
    const existing = loadGuestCategories();
    const updated = [...existing.filter((c) => c.id !== category.id), category];
    saveGuestCategories(updated);
  }
}

export async function deleteCategory(
  userId: string | null,
  categoryId: string,
): Promise<void> {
  if (userId) {
    await deleteAuthCategory(userId, categoryId);
  } else {
    const existing = loadGuestCategories();
    saveGuestCategories(existing.filter((c) => c.id !== categoryId));
  }
}
