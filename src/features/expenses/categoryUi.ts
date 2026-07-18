import {
  Utensils,
  Heart,
  Film,
  Home,
  HelpCircle,
  Bus,
  ShoppingCart,
  Users,
  ShoppingBasket,
  UtensilsCrossed,
  Bike,
  Cookie,
  Wine,
  Car,
  Fuel,
  CarTaxiFront,
  KeyRound,
  Zap,
  Wrench,
  Sofa,
  Stethoscope,
  Pill,
  Dumbbell,
  Sparkles,
  Shirt,
  Smartphone,
  Gift,
  ShoppingBag,
  Clapperboard,
  Ticket,
  Palette,
  Tv,
  Plane,
  GraduationCap,
  PawPrint,
  HandHeart,
  PartyPopper,
  Baby,
  CircleEllipsis,
  Cigarette,
  Dices,
  type LucideIcon,
} from 'lucide-react';
import {
  BUILTIN_PARENT_CATEGORY_IDS,
  getAllBuiltinSubCategoryIds,
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

export const SUB_CATEGORY_ICONS: Record<string, LucideIcon> = {
  'food.groceries': ShoppingBasket,
  'food.restaurants': UtensilsCrossed,
  'food.delivery': Bike,
  'food.snacks': Cookie,
  'food.alcohol': Wine,
  'transport.publicTransit': Bus,
  'transport.car': Car,
  'transport.fuel': Fuel,
  'transport.taxi': CarTaxiFront,
  'housing.rent': KeyRound,
  'housing.utilities': Zap,
  'housing.maintenance': Wrench,
  'housing.homeGoods': Sofa,
  'health.medical': Stethoscope,
  'health.pharmacy': Pill,
  'health.fitness': Dumbbell,
  'health.beauty': Sparkles,
  'shopping.clothing': Shirt,
  'shopping.electronics': Smartphone,
  'shopping.gifts': Gift,
  'shopping.general': ShoppingBag,
  'entertainment.movies': Clapperboard,
  'entertainment.events': Ticket,
  'entertainment.hobbies': Palette,
  'entertainment.subscriptions': Tv,
  'entertainment.travel': Plane,
  'lifestyle.education': GraduationCap,
  'lifestyle.pets': PawPrint,
  'lifestyle.donations': HandHeart,
  'lifestyle.social': PartyPopper,
  'lifestyle.kids': Baby,
  'other.miscellaneous': CircleEllipsis,
  'other.cigarettes': Cigarette,
  'other.lottery': Dices,
  'other.phone': Smartphone,
};

export function getCategoryUI(id: string) {
  const parentId = isBuiltinParentCategoryId(id) ? id : getParentCategoryId(id);
  return PARENT_CATEGORY_UI[parentId];
}

export function getSubCategoryUI(subId: string) {
  const parentId = getParentCategoryId(subId);
  const { color, icon: parentIcon } = PARENT_CATEGORY_UI[parentId];
  const icon = SUB_CATEGORY_ICONS[subId] ?? parentIcon;
  return { icon, color };
}

export function getBuiltinParentCategoryIds() {
  return BUILTIN_PARENT_CATEGORY_IDS;
}

/** Ensures every built-in sub-category has a dedicated icon in the selection UI. */
export function assertSubCategoryIconsComplete(): void {
  for (const subId of getAllBuiltinSubCategoryIds()) {
    if (!SUB_CATEGORY_ICONS[subId]) {
      throw new Error(`Missing sub-category icon for ${subId}`);
    }
  }
}
