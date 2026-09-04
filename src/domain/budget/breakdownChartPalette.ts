import { type CategoryBreakdownSliceKind } from './groupPeriodCategoryBreakdown';

/**
 * Premium vibrant hex palette for Graphic View doughnut slices (dark-theme friendly).
 */
export const BREAKDOWN_CHART_COLOR_PALETTE = [
  '#FF6B6B',
  '#A855F7',
  '#22D3EE',
  '#34D399',
  '#818CF8',
  '#F472B6',
  '#FBBF24',
  '#FB7185',
  '#4ADE80',
  '#60A5FA',
  '#C084FC',
  '#2DD4BF',
  '#F97316',
  '#E879F9',
  '#38BDF8',
  '#A3E635',
] as const;

function normalizeHex(hex: string): string {
  return hex.toUpperCase();
}

function buildSliceColorKey(kind: CategoryBreakdownSliceKind, id: string): string {
  return `${kind}:${id}`;
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

export interface BreakdownChartSliceDescriptor {
  kind: CategoryBreakdownSliceKind;
  id: string;
}

/**
 * Assigns a unique vibrant hex color to each breakdown slice for the Graphic View chart.
 * Categories are assigned first; sub-budgets prefer colors not already used by categories.
 */
export function assignBreakdownChartSliceColors(
  slices: readonly BreakdownChartSliceDescriptor[],
): Map<string, string> {
  const categories = slices
    .filter((slice) => slice.kind === 'category')
    .sort((a, b) => a.id.localeCompare(b.id));
  const subBudgets = slices
    .filter((slice) => slice.kind === 'subBudget')
    .sort((a, b) => a.id.localeCompare(b.id));

  const assigned = new Map<string, string>();
  const used = new Set<string>();
  let paletteIndex = 0;

  for (const slice of categories) {
    const picked = pickColor(BREAKDOWN_CHART_COLOR_PALETTE, paletteIndex, new Set(), used);
    const color =
      picked?.color ??
      BREAKDOWN_CHART_COLOR_PALETTE[
        categories.indexOf(slice) % BREAKDOWN_CHART_COLOR_PALETTE.length
      ]!;

    assigned.set(buildSliceColorKey(slice.kind, slice.id), color);
    used.add(normalizeHex(color));
    if (picked) paletteIndex = picked.nextIndex;
  }

  const occupiedByCategories = new Set(used);

  for (const slice of subBudgets) {
    const preferred = pickColor(
      BREAKDOWN_CHART_COLOR_PALETTE,
      paletteIndex,
      occupiedByCategories,
      used,
    );
    if (preferred) {
      assigned.set(buildSliceColorKey(slice.kind, slice.id), preferred.color);
      used.add(normalizeHex(preferred.color));
      paletteIndex = preferred.nextIndex;
      continue;
    }

    const fallback = pickColor(BREAKDOWN_CHART_COLOR_PALETTE, paletteIndex, new Set(), used);
    const color =
      fallback?.color ??
      BREAKDOWN_CHART_COLOR_PALETTE[
        subBudgets.indexOf(slice) % BREAKDOWN_CHART_COLOR_PALETTE.length
      ]!;

    assigned.set(buildSliceColorKey(slice.kind, slice.id), color);
    used.add(normalizeHex(color));
    if (fallback) paletteIndex = fallback.nextIndex;
  }

  return assigned;
}

export function resolveBreakdownChartSliceColor(
  colorMap: Map<string, string>,
  kind: CategoryBreakdownSliceKind,
  id: string,
): string {
  return (
    colorMap.get(buildSliceColorKey(kind, id)) ??
    BREAKDOWN_CHART_COLOR_PALETTE[0]
  );
}
