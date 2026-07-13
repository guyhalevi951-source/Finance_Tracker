import { DEFAULT_DECIMAL_SCALE } from './constants';

/**
 * Convert a decimal amount to integer minor units (e.g. 1.23 → 123 agorot).
 * Rounds to avoid any pre-existing float drift before the integer conversion.
 */
export function toMinorUnits(amount: number, scale = DEFAULT_DECIMAL_SCALE): number {
  return Math.round(amount * Math.pow(10, scale));
}

/**
 * Convert integer minor units back to a decimal amount (e.g. 123 → 1.23).
 */
export function fromMinorUnits(minor: number, scale = DEFAULT_DECIMAL_SCALE): number {
  return minor / Math.pow(10, scale);
}

/**
 * Sum an array of decimal amounts without floating-point drift.
 * All addition is performed in integer minor units.
 */
export function sumAmounts(amounts: number[], scale = DEFAULT_DECIMAL_SCALE): number {
  const totalMinor = amounts.reduce((sum, a) => sum + toMinorUnits(a, scale), 0);
  return fromMinorUnits(totalMinor, scale);
}

/**
 * Subtract b from a in minor units to avoid float drift.
 */
export function subtractAmounts(a: number, b: number, scale = DEFAULT_DECIMAL_SCALE): number {
  return fromMinorUnits(toMinorUnits(a, scale) - toMinorUnits(b, scale), scale);
}
