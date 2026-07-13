/**
 * Generate a collision-safe unique ID for a new expense.
 * Uses crypto.randomUUID() which is available in all modern browsers and Node 14.17+.
 */
export function generateExpenseId(): string {
  return crypto.randomUUID();
}
