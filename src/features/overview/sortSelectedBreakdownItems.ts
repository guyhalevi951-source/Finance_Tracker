/** Stable presentation-layer sort: selected items first, original order otherwise. */
export function sortSelectedBreakdownItems<T>(
  items: T[],
  selectedSegments: string[],
  getSegmentKey: (item: T) => string,
): T[] {
  if (selectedSegments.length === 0) return items;

  const selected = new Set(selectedSegments);
  return [...items].sort((a, b) => {
    const aSelected = selected.has(getSegmentKey(a));
    const bSelected = selected.has(getSegmentKey(b));
    if (aSelected === bSelected) return 0;
    return aSelected ? -1 : 1;
  });
}
