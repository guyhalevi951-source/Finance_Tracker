/**
 * SSOT for selectable main-category theme colors (Tailwind bg-* classes).
 */
export const CATEGORY_COLOR_SWATCHES = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-gray-500',
  'bg-slate-500',
  'bg-stone-500',
] as const;

export type CategoryColorSwatch = (typeof CATEGORY_COLOR_SWATCHES)[number];

export const DEFAULT_CATEGORY_COLOR: CategoryColorSwatch = 'bg-gray-500';

/** Hex fills for Recharts slices keyed by Tailwind bg-* swatch class. */
export const CATEGORY_COLOR_HEX: Record<CategoryColorSwatch, string> = {
  'bg-red-500': '#EF4444',
  'bg-orange-500': '#F97316',
  'bg-amber-500': '#F59E0B',
  'bg-yellow-500': '#EAB308',
  'bg-lime-500': '#84CC16',
  'bg-green-500': '#22C55E',
  'bg-emerald-500': '#10B981',
  'bg-teal-500': '#14B8A6',
  'bg-cyan-500': '#06B6D4',
  'bg-sky-500': '#0EA5E9',
  'bg-blue-500': '#3B82F6',
  'bg-indigo-500': '#6366F1',
  'bg-violet-500': '#8B5CF6',
  'bg-purple-500': '#A855F7',
  'bg-fuchsia-500': '#D946EF',
  'bg-pink-500': '#EC4899',
  'bg-rose-500': '#F43F5E',
  'bg-gray-500': '#6B7280',
  'bg-slate-500': '#64748B',
  'bg-stone-500': '#78716C',
};

export function resolveCategoryColorHex(color: string): string {
  if (isValidCategoryColor(color)) {
    return CATEGORY_COLOR_HEX[color];
  }
  return CATEGORY_COLOR_HEX[DEFAULT_CATEGORY_COLOR];
}

export function isValidCategoryColor(color: string): boolean {
  return (CATEGORY_COLOR_SWATCHES as readonly string[]).includes(color);
}
