/** Build a `YYYY-MM` key from a 0-indexed month (January = 0). */
export function toMonthKey(year: number, month: number): string {
  const monthPart = String(month + 1).padStart(2, '0');
  return `${year}-${monthPart}`;
}

/** Derive month key from the first ISO date of a period range. */
export function monthKeyFromRangeStart(startIso: string): string {
  return startIso.slice(0, 7);
}

/** Return the previous month's key, or null if at the earliest representable month. */
export function previousMonthKey(key: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) {
    return null;
  }

  let year = Number(match[1]);
  let month = Number(match[2]);

  if (year === 1 && month === 1) {
    return null;
  }

  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}
