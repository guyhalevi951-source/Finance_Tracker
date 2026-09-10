import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import {
  SUPABASE_STORAGE_BUCKETS,
  expenseAttachmentStoragePath,
} from '../../config/supabase/storage';
import { supabase } from '../supabase/client';
import { throwIfStorageError } from '../supabase/errors';

const GUEST_ATTACHMENTS_KEY = GUEST_FINANCE_STORAGE_KEYS.expenseAttachments;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

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

export function peekGuestAttachments(): Record<string, string> {
  return readGuestAttachments();
}

export function clearGuestAttachments(): void {
  localStorage.removeItem(GUEST_ATTACHMENTS_KEY);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('UPLOAD_FAILED'));
    reader.readAsDataURL(file);
  });
}

async function createSignedAttachmentUrl(userId: string, expenseId: string): Promise<string> {
  const path = expenseAttachmentStoragePath(userId, expenseId);
  const { data, error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKETS.expenseAttachments)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  throwIfStorageError(error, 'UPLOAD_FAILED');
  if (!data?.signedUrl) {
    throw new Error('UPLOAD_FAILED');
  }
  return data.signedUrl;
}

export async function resolveAuthAttachmentUrl(
  userId: string,
  expenseId: string,
  stored?: string,
): Promise<string | undefined> {
  try {
    return await createSignedAttachmentUrl(userId, expenseId);
  } catch {
    return stored;
  }
}

/**
 * Uploads an expense receipt image and returns a URL suitable for Expense.attachmentUrl.
 * Authenticated users: signed Supabase Storage URL.
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
    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKETS.expenseAttachments)
      .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: true });
    throwIfStorageError(error, 'UPLOAD_FAILED');
    return createSignedAttachmentUrl(userId, expenseId);
  }

  const dataUrl = await fileToDataUrl(file);
  const map = readGuestAttachments();
  map[expenseId] = dataUrl;
  writeGuestAttachments(map);
  return dataUrl;
}

export async function uploadExpenseAttachmentFromDataUrl(
  userId: string,
  expenseId: string,
  dataUrl: string,
): Promise<string> {
  const [header, base64] = dataUrl.split(',');
  if (!base64) {
    throw new Error('UPLOAD_FAILED');
  }
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const file = new File([bytes], expenseId, { type: mime });
  return uploadExpenseAttachment(userId, expenseId, file);
}

export async function deleteExpenseAttachment(
  userId: string | null,
  expenseId: string,
): Promise<void> {
  if (userId) {
    const path = expenseAttachmentStoragePath(userId, expenseId);
    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKETS.expenseAttachments)
      .remove([path]);
    if (error && !error.message.toLowerCase().includes('not found')) {
      throwIfStorageError(error, 'UPLOAD_FAILED');
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
