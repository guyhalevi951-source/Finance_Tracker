import type { WheelEvent } from 'react';

/** Blur on wheel so scroll does not change the focused number input value. */
export function preventNumberInputScroll(e: WheelEvent<HTMLInputElement>): void {
  e.currentTarget.blur();
}
