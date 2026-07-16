/** Append a digit or decimal point to numpad amount string. */
export function appendNumpadDigit(current: string, key: string): string {
  if (key === '.') {
    if (current.includes('.')) return current;
    return current === '' || current === '0' ? '0.' : `${current}.`;
  }

  if (!/^\d$/.test(key)) return current;

  if (current === '0') return key;
  return current + key;
}

export function numpadBackspace(current: string): string {
  if (current.length <= 1) return '';
  return current.slice(0, -1);
}

export function formatNumpadDisplay(current: string): string {
  return current === '' ? '0' : current;
}

export function numpadAmountToNumber(current: string): number {
  if (current === '' || current === '.') return NaN;
  return parseFloat(current);
}
