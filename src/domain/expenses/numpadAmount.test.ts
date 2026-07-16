import { describe, expect, it } from 'vitest';
import {
  appendNumpadDigit,
  formatNumpadDisplay,
  numpadAmountToNumber,
  numpadBackspace,
} from './numpadAmount';

describe('numpadAmount', () => {
  it('appends digits', () => {
    expect(appendNumpadDigit('', '6')).toBe('6');
    expect(appendNumpadDigit('6', '6')).toBe('66');
  });

  it('replaces leading zero', () => {
    expect(appendNumpadDigit('0', '5')).toBe('5');
  });

  it('allows a single decimal point', () => {
    expect(appendNumpadDigit('12', '.')).toBe('12.');
    expect(appendNumpadDigit('12.', '.')).toBe('12.');
    expect(appendNumpadDigit('', '.')).toBe('0.');
  });

  it('backspaces last character', () => {
    expect(numpadBackspace('66')).toBe('6');
    expect(numpadBackspace('6')).toBe('');
  });

  it('formats empty as zero display', () => {
    expect(formatNumpadDisplay('')).toBe('0');
    expect(formatNumpadDisplay('66')).toBe('66');
  });

  it('parses to number for validation', () => {
    expect(numpadAmountToNumber('66')).toBe(66);
    expect(numpadAmountToNumber('12.5')).toBe(12.5);
    expect(Number.isNaN(numpadAmountToNumber(''))).toBe(true);
  });
});
