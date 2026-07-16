import {
  Utensils,
  Heart,
  Film,
  Home,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { BUILTIN_CATEGORY_IDS, type BuiltinCategoryId } from '../../domain/categories/constants';
import { isBuiltinCategoryId } from '../../domain/categories/resolveCategoryLabel';

export const CATEGORY_UI: Record<BuiltinCategoryId, { icon: LucideIcon; color: string }> = {
  food: { icon: Utensils, color: 'bg-amber-500' },
  health: { icon: Heart, color: 'bg-rose-500' },
  entertainment: { icon: Film, color: 'bg-purple-500' },
  rent: { icon: Home, color: 'bg-cyan-500' },
  other: { icon: HelpCircle, color: 'bg-gray-500' },
};

export function getCategoryUI(id: string) {
  if (isBuiltinCategoryId(id)) return CATEGORY_UI[id];
  return CATEGORY_UI['other'];
}

export function getBuiltinCategoryIds() {
  return BUILTIN_CATEGORY_IDS;
}
