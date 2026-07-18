import { Fuel } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { getAllBuiltinSubCategoryIds, getParentCategoryId } from '../../domain/categories/hierarchy';
import {
  assertSubCategoryIconsComplete,
  getSubCategoryUI,
  PARENT_CATEGORY_UI,
  SUB_CATEGORY_ICONS,
} from './categoryUi';

describe('categoryUi', () => {
  it('defines a unique icon for every built-in sub-category', () => {
    expect(() => assertSubCategoryIconsComplete()).not.toThrow();
    expect(Object.keys(SUB_CATEGORY_ICONS)).toHaveLength(getAllBuiltinSubCategoryIds().length);
  });

  it('inherits parent color and uses sub-specific icon', () => {
    const transportSubs = getAllBuiltinSubCategoryIds().filter(
      (id) => getParentCategoryId(id) === 'transport',
    );

    for (const subId of transportSubs) {
      const { color, icon } = getSubCategoryUI(subId);
      expect(color).toBe(PARENT_CATEGORY_UI.transport.color);
      expect(icon).toBe(SUB_CATEGORY_ICONS[subId]);
    }

    const taxiIcon = getSubCategoryUI('transport.taxi').icon;
    const fuelIcon = getSubCategoryUI('transport.fuel').icon;
    expect(taxiIcon).not.toBe(fuelIcon);
  });

  it('uses Fuel icon with transport parent color for transport.fuel', () => {
    const { icon, color } = getSubCategoryUI('transport.fuel');
    expect(icon).toBe(Fuel);
    expect(color).toBe(PARENT_CATEGORY_UI.transport.color);
  });
});
