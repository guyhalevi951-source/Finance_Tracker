import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { expenseAttachmentStoragePath } from '../../config/firebase/storage';
import { storage } from '../firebase/firebaseApp';

const GUEST_ATTACHMENTS_KEY = 'expenseAttachments';

export const MAX_GUEST_ATTACHMENT_BYTES = 500 * 1024;

export type AttachmentError = 'FILE_TOO_LARGE' | 'UPLOAD_FAILED';

function readGuestAttachments(): Record<string, string> {
  const raw = localStorage.getItem(GUEST_ATTACHMENTS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeGuestAttachments(map: Record<string, string>): void {
  localStorage.setItem(GUEST_ATTACHMENTS_KEY, JSON.stringify(map));
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('UPLOAD_FAILED'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an expense receipt image and returns a URL suitable for Expense.attachmentUrl.
 * Authenticated users: Firebase Storage download URL.
 * Guests: base64 data URL stored in localStorage keyed by expense ID.
 */
export async function uploadExpenseAttachment(
  userId: string | null,
  expenseId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_GUEST_ATTACHMENT_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  if (userId) {
    const path = expenseAttachmentStoragePath(userId, expenseId);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  }

  const dataUrl = await fileToDataUrl(file);
  const map = readGuestAttachments();
  map[expenseId] = dataUrl;
  writeGuestAttachments(map);
  return dataUrl;
}

/**
 * Removes a stored expense attachment for the given expense id.
 */
export async function deleteExpenseAttachment(
  userId: string | null,
  expenseId: string,
): Promise<void> {
  if (userId) {
    const path = expenseAttachmentStoragePath(userId, expenseId);
    const storageRef = ref(storage, path);
    try {
      await deleteObject(storageRef);
    } catch {
      // Ignore missing object — attachment may already be absent.
    }
    return;
  }

  const map = readGuestAttachments();
  if (expenseId in map) {
    delete map[expenseId];
    writeGuestAttachments(map);
  }
}

/** Resolves guest attachment from localStorage when expense stores a guest reference key. */
export function resolveGuestAttachmentUrl(expenseId: string): string | null {
  return readGuestAttachments()[expenseId] ?? null;
}
