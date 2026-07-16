/** SSOT for Firebase Storage paths for expense attachments. */

export function expenseAttachmentStoragePath(userId: string, expenseId: string): string {
  return `users/${userId}/expense-attachments/${expenseId}`;
}
