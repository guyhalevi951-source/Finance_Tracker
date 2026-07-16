import {
  Utensils,
  Heart,
  Film,
  Home,
  HelpCircle,
  Bus,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  BUILTIN_PARENT_CATEGORY_IDS,
  getParentCategoryId,
  isBuiltinParentCategoryId,
  type BuiltinParentCategoryId,
} from '../../domain/categories/hierarchy';

export const PARENT_CATEGORY_UI: Record<BuiltinParentCategoryId, { icon: LucideIcon; color: string }> = {
  food: { icon: Utensils, color: 'bg-amber-500' },
  transport: { icon: Bus, color: 'bg-blue-500' },
  housing: { icon: Home, color: 'bg-cyan-500' },
  health: { icon: Heart, color: 'bg-rose-500' },
  shopping: { icon: ShoppingCart, color: 'bg-indigo-500' },
  entertainment: { icon: Film, color: 'bg-purple-500' },
  lifestyle: { icon: Users, color: 'bg-teal-500' },
  other: { icon: HelpCircle, color: 'bg-gray-500' },
};

export function getCategoryUI(id: string) {
  const parentId = isBuiltinParentCategoryId(id) ? id : getParentCategoryId(id);
  return PARENT_CATEGORY_UI[parentId];
}

export function getBuiltinParentCategoryIds() {
  return BUILTIN_PARENT_CATEGORY_IDS;
}
