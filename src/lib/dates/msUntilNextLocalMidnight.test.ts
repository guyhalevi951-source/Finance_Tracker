import { describe, expect, it } from 'vitest';
import { msUntilNextLocalMidnight } from './msUntilNextLocalMidnight';

describe('msUntilNextLocalMidnight', () => {
  it('returns positive ms from a midday timestamp', () => {
    const from = new Date(2026, 6, 17, 12, 0, 0);
    const ms = msUntilNextLocalMidnight(from);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it('returns ~1s when from is 23:59:59', () => {
    const from = new Date(2026, 6, 17, 23, 59, 59);
    expect(msUntilNextLocalMidnight(from)).toBe(1000);
  });

  it('next midnight rolls to the following calendar day', () => {
    const from = new Date(2026, 6, 17, 23, 59, 59);
    const next = new Date(from.getTime() + msUntilNextLocalMidnight(from));
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(18);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
  });
});
