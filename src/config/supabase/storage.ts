/**
 * SSOT for Supabase Storage buckets and object paths.
 */

export const SUPABASE_STORAGE_BUCKETS = {
  expenseAttachments: 'expense-attachments',
} as const;

export function expenseAttachmentStoragePath(userId: string, expenseId: string): string {
  return `${userId}/${expenseId}`;
}
