export function canGenerateOccurrence(
  limit: number | null,
  currentCount: number,
  pendingCreateCount: number,
): boolean {
  if (limit === null) {
    return true;
  }

  return currentCount + pendingCreateCount < limit;
}
