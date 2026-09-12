import { describe, expect, it } from 'vitest';
import { sortSelectedBreakdownItems } from './sortSelectedBreakdownItems';

const items = [
  { segmentKey: 'category:food', label: 'Food' },
  { segmentKey: 'category:health', label: 'Health' },
  { segmentKey: 'category:rent', label: 'Rent' },
  { segmentKey: 'category:other', label: 'Other' },
];

function keysOf(result: typeof items): string[] {
  return result.map((item) => item.segmentKey);
}

describe('sortSelectedBreakdownItems', () => {
  it('returns the original list when nothing is selected', () => {
    const result = sortSelectedBreakdownItems(items, [], (item) => item.segmentKey);

    expect(result).toBe(items);
    expect(keysOf(result)).toEqual([
      'category:food',
      'category:health',
      'category:rent',
      'category:other',
    ]);
  });

  it('moves a single selected item to the top and keeps relative order of the rest', () => {
    const result = sortSelectedBreakdownItems(
      items,
      ['category:rent'],
      (item) => item.segmentKey,
    );

    expect(keysOf(result)).toEqual([
      'category:rent',
      'category:food',
      'category:health',
      'category:other',
    ]);
  });

  it('pins multiple selected items to the top in their original relative order', () => {
    const result = sortSelectedBreakdownItems(
      items,
      ['category:other', 'category:health'],
      (item) => item.segmentKey,
    );

    expect(keysOf(result)).toEqual([
      'category:health',
      'category:other',
      'category:food',
      'category:rent',
    ]);
  });

  it('restores original order when selection is cleared', () => {
    const selected = sortSelectedBreakdownItems(
      items,
      ['category:other'],
      (item) => item.segmentKey,
    );
    const restored = sortSelectedBreakdownItems(items, [], (item) => item.segmentKey);

    expect(keysOf(selected)).toEqual([
      'category:other',
      'category:food',
      'category:health',
      'category:rent',
    ]);
    expect(restored).toBe(items);
  });
});
