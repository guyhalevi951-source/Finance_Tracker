/**
 * SSOT for category values used in domain logic and persistence.
 * Icons and colors are UI concerns and live in the presentation layer.
 */
export const CATEGORY_VALUES = [
  'אוכל',
  'בריאות',
  'בילויים',
  'שכר דירה',
  'אחר',
] as const;

export type CategoryValue = (typeof CATEGORY_VALUES)[number];

export const DEFAULT_CATEGORY: CategoryValue = 'אוכל';
