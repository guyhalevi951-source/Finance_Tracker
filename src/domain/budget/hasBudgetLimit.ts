/**
 * Whether a budget amount is an active numeric cap.
 * `null`/`undefined` = no limit; `0` is treated as unset (same as master monthly).
 */
export function hasBudgetLimit(amount: number | null | undefined): amount is number {
  return typeof amount === 'number' && amount > 0;
}
