/**
 * SSOT for Supabase Storage buckets and object paths.
 */

export const SUPABASE_STORAGE_BUCKETS = {
  expenseAttachments: 'expense-attachments',
} as const;

export const EXPENSE_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
] as const;

const ALLOWED_MIME = new Set<string>(EXPENSE_ATTACHMENT_MIME_TYPES);

export function resolveExpenseAttachmentContentType(mime: string | undefined): string {
  if (mime && ALLOWED_MIME.has(mime)) return mime;
  return 'image/jpeg';
}

export function expenseAttachmentStoragePath(userId: string, expenseId: string): string {
  return `${userId}/${expenseId}`;
}
