/**
 * Dedicated hex palette for sub-budget doughnut slices.
 * Prefers colors outside builtin parent category fills (amber, blue, cyan, rose, indigo, purple, teal, gray).
 */
export const SUB_BUDGET_SLICE_COLOR_PALETTE = [
  '#10B981',
  '#8B5CF6',
  '#F97316',
  '#84CC16',
  '#EC4899',
  '#0EA5E9',
  '#D946EF',
  '#EAB308',
  '#22C55E',
  '#78716C',
  '#EF4444',
  '#6366F1',
] as const;

function normalizeHex(hex: string): string {
  return hex.toUpperCase();
}

function pickColor(
  palette: readonly string[],
  startIndex: number,
  occupied: Set<string>,
  used: Set<string>,
): { color: string; nextIndex: number } | null {
  for (let offset = 0; offset < palette.length; offset++) {
    const index = (startIndex + offset) % palette.length;
    const candidate = palette[index]!;
    const normalized = normalizeHex(candidate);
    if (occupied.has(normalized) || used.has(normalized)) continue;
    return { color: candidate, nextIndex: index + 1 };
  }
  return null;
}

/**
 * Assigns a unique hex color to each sub-budget slice id.
 * Skips category hexes when the palette still has unused colors.
 */
export function assignSubBudgetSliceColors(
  subBudgetIds: readonly string[],
  occupiedCategoryHexes: readonly string[],
): Map<string, string> {
  const sortedIds = [...subBudgetIds].sort((a, b) => a.localeCompare(b));
  const occupied = new Set(occupiedCategoryHexes.map(normalizeHex));
  const used = new Set<string>();
  const assigned = new Map<string, string>();
  let paletteIndex = 0;

  for (const id of sortedIds) {
    const preferred = pickColor(SUB_BUDGET_SLICE_COLOR_PALETTE, paletteIndex, occupied, used);
    if (preferred) {
      assigned.set(id, preferred.color);
      used.add(normalizeHex(preferred.color));
      paletteIndex = preferred.nextIndex;
      continue;
    }

    const fallback = pickColor(SUB_BUDGET_SLICE_COLOR_PALETTE, paletteIndex, new Set(), used);
    const color =
      fallback?.color ??
      SUB_BUDGET_SLICE_COLOR_PALETTE[sortedIds.indexOf(id) % SUB_BUDGET_SLICE_COLOR_PALETTE.length]!;

    assigned.set(id, color);
    used.add(normalizeHex(color));
    if (fallback) paletteIndex = fallback.nextIndex;
  }

  return assigned;
}
