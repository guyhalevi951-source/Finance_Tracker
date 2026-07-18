/**
 * SSOT for category icon keys (kebab-case lucide icon names).
 * UI resolves keys to LucideIcon components via features/categories/iconRegistry.ts.
 */

export interface IconLibraryGroup {
  id: string;
  labelKey: string;
  iconKeys: readonly string[];
}

export const CATEGORY_ICON_GROUPS: readonly IconLibraryGroup[] = [
  {
    id: 'life',
    labelKey: 'category.iconGroup.life',
    iconKeys: [
      'coffee', 'flashlight', 'bath', 'tv', 'tree-pine', 'fan', 'umbrella',
      'pill', 'camera', 'bed', 'armchair', 'piano', 'lamp', 'home',
      'shovel', 'calculator', 'scissors', 'hanger',
    ],
  },
  {
    id: 'food',
    labelKey: 'category.iconGroup.food',
    iconKeys: [
      'utensils', 'utensils-crossed', 'coffee', 'wine', 'beer', 'pizza',
      'sandwich', 'cookie', 'cake', 'apple', 'carrot', 'fish', 'egg-fried',
      'cup-soda', 'ice-cream-cone', 'chef-hat',
    ],
  },
  {
    id: 'shopping',
    labelKey: 'category.iconGroup.shopping',
    iconKeys: [
      'shopping-bag', 'shopping-cart', 'shopping-basket', 'shirt', 'footprints',
      'flower-2', 'sock', 'gem', 'watch', 'glasses', 'lipstick', 'tag',
      'hand', 'wallet', 'gift', 'smartphone', 'laptop', 'headphones',
    ],
  },
  {
    id: 'home',
    labelKey: 'category.iconGroup.home',
    iconKeys: [
      'home', 'sofa', 'lamp', 'bed', 'bath', 'wrench', 'hammer', 'paint-bucket',
      'key-round', 'door-open', 'fence', 'lightbulb', 'plug', 'refrigerator',
      'microwave', 'armchair',
    ],
  },
  {
    id: 'transport',
    labelKey: 'category.iconGroup.transport',
    iconKeys: [
      'bus', 'car', 'car-taxi-front', 'fuel', 'bike', 'plane', 'train-front',
      'ship', 'truck', 'motorbike', 'navigation', 'map-pin', 'parking-circle',
      'traffic-cone', 'sailboat', 'rocket',
    ],
  },
  {
    id: 'health',
    labelKey: 'category.iconGroup.health',
    iconKeys: [
      'heart', 'stethoscope', 'pill', 'dumbbell', 'sparkles', 'syringe',
      'activity', 'brain', 'eye', 'smile', 'scissors', 'thermometer',
      'hospital', 'accessibility', 'bandage', 'leaf',
    ],
  },
  {
    id: 'finance',
    labelKey: 'category.iconGroup.finance',
    iconKeys: [
      'wallet', 'credit-card', 'banknote', 'coins', 'receipt', 'landmark',
      'piggy-bank', 'chart-line', 'chart-pie', 'calculator', 'badge-dollar-sign',
      'hand-coins', 'scale', 'trending-up', 'trending-down', 'briefcase',
    ],
  },
  {
    id: 'entertainment',
    labelKey: 'category.iconGroup.entertainment',
    iconKeys: [
      'film', 'clapperboard', 'ticket', 'palette', 'tv', 'music', 'music-2',
      'gamepad-2', 'dices', 'party-popper', 'mic', 'headphones', 'camera',
      'popcorn', 'theater', 'sparkle',
    ],
  },
  {
    id: 'education',
    labelKey: 'category.iconGroup.education',
    iconKeys: [
      'graduation-cap', 'book', 'book-open', 'library', 'school', 'pencil',
      'pen', 'notebook-pen', 'microscope', 'globe', 'languages', 'backpack',
      'presentation', 'calculator', 'brain',
    ],
  },
  {
    id: 'sports',
    labelKey: 'category.iconGroup.sports',
    iconKeys: [
      'dumbbell', 'bike', 'footprints', 'trophy', 'medal', 'target',
      'volleyball', 'mountain', 'camping', 'fish', 'wind',
    ],
  },
  {
    id: 'nature',
    labelKey: 'category.iconGroup.nature',
    iconKeys: [
      'tree-pine', 'flower-2', 'leaf', 'sun', 'moon', 'cloud', 'droplets',
      'paw-print', 'bird', 'fish', 'bug', 'mountain', 'waves', 'wind',
      'sprout', 'earth',
    ],
  },
  {
    id: 'work',
    labelKey: 'category.iconGroup.work',
    iconKeys: [
      'briefcase', 'laptop', 'monitor', 'smartphone', 'printer', 'file-text',
      'folder', 'mail', 'phone', 'video', 'calendar', 'clock', 'building-2',
      'users', 'user', 'network',
    ],
  },
  {
    id: 'travel',
    labelKey: 'category.iconGroup.travel',
    iconKeys: [
      'plane', 'luggage', 'map', 'map-pin', 'compass', 'camera', 'binoculars',
      'tent', 'sun', 'tree-pine', 'ship', 'train-front', 'car', 'globe',
      'backpack', 'ticket',
    ],
  },
  {
    id: 'other',
    labelKey: 'category.iconGroup.other',
    iconKeys: [
      'help-circle', 'circle-ellipsis', 'more-horizontal', 'star', 'heart',
      'smile', 'cigarette', 'baby', 'hand-heart', 'users', 'zap', 'shield',
      'bell', 'settings', 'plus',
    ],
  },
] as const;

const ICON_KEY_SET = new Set(
  CATEGORY_ICON_GROUPS.flatMap((group) => group.iconKeys),
);

export const ALL_CATEGORY_ICON_KEYS: readonly string[] = [...ICON_KEY_SET];

export const DEFAULT_CATEGORY_ICON_KEY = 'help-circle';

export function isValidCategoryIconKey(key: string): boolean {
  return ICON_KEY_SET.has(key);
}

/** Maps built-in sub-category IDs to icon keys for seeding. */
export const BUILTIN_SUB_CATEGORY_ICON_KEYS: Record<string, string> = {
  'food.groceries': 'shopping-basket',
  'food.restaurants': 'utensils-crossed',
  'food.delivery': 'bike',
  'food.snacks': 'cookie',
  'food.alcohol': 'wine',
  'transport.publicTransit': 'bus',
  'transport.car': 'car',
  'transport.fuel': 'fuel',
  'transport.taxi': 'car-taxi-front',
  'housing.rent': 'key-round',
  'housing.utilities': 'zap',
  'housing.maintenance': 'wrench',
  'housing.homeGoods': 'sofa',
  'health.medical': 'stethoscope',
  'health.pharmacy': 'pill',
  'health.fitness': 'dumbbell',
  'health.beauty': 'sparkles',
  'shopping.clothing': 'shirt',
  'shopping.electronics': 'smartphone',
  'shopping.gifts': 'gift',
  'shopping.general': 'shopping-bag',
  'entertainment.movies': 'clapperboard',
  'entertainment.events': 'ticket',
  'entertainment.hobbies': 'palette',
  'entertainment.subscriptions': 'tv',
  'entertainment.travel': 'plane',
  'lifestyle.education': 'graduation-cap',
  'lifestyle.pets': 'paw-print',
  'lifestyle.donations': 'hand-heart',
  'lifestyle.social': 'party-popper',
  'lifestyle.kids': 'baby',
  'other.miscellaneous': 'circle-ellipsis',
  'other.cigarettes': 'cigarette',
  'other.lottery': 'dices',
  'other.phone': 'smartphone',
};

/** Maps built-in parent category IDs to icon keys for seeding. */
export const BUILTIN_PARENT_ICON_KEYS: Record<string, string> = {
  food: 'utensils',
  transport: 'bus',
  housing: 'home',
  health: 'heart',
  shopping: 'shopping-cart',
  entertainment: 'film',
  lifestyle: 'users',
  other: 'help-circle',
};

/** Maps built-in parent category IDs to colors for seeding. */
export const BUILTIN_PARENT_COLORS: Record<string, string> = {
  food: 'bg-amber-500',
  transport: 'bg-blue-500',
  housing: 'bg-cyan-500',
  health: 'bg-rose-500',
  shopping: 'bg-indigo-500',
  entertainment: 'bg-purple-500',
  lifestyle: 'bg-teal-500',
  other: 'bg-gray-500',
};

/** Re-export for callers that import default color alongside icon keys. SSOT: categoryColorPalette.ts */
export { DEFAULT_CATEGORY_COLOR } from './categoryColorPalette';
