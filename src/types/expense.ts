import { type BilingualText } from './bilingual';
import { type PaymentMethodId } from './paymentMethod';
import { type RecurrenceRule } from './recurrenceRule';

/** Basic fields scheduled to apply from effectiveFromIso onward (Settings edits). */
export interface RecurrencePendingBasicFields {
  effectiveFromIso: string;
  description: BilingualText;
  amount: number;
  category: string;
  paymentMethod: PaymentMethodId;
}

export interface Expense {
  id: string;
  description: BilingualText;
  amount: number;
  /** Builtin sub-category ID (e.g. 'food.groceries') or custom category UUID */
  category: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  paymentMethod: PaymentMethodId;
  /** Optional receipt image URL or guest data-URL reference */
  attachmentUrl?: string;
  /** Recurrence template rule — only on the originating expense */
  recurrenceRule?: RecurrenceRule;
  /** Links generated instances back to the template expense id */
  recurrenceSeriesId?: string;
  /** Last ISO date this template may generate occurrences through (inclusive) */
  recurrenceEndDate?: string;
  /** ISO dates the template must never auto-generate (manual instance deletions) */
  recurrenceExcludedDates?: string[];
  /**
   * Settings-scheduled field changes for dates on/after effectiveFromIso.
   * Does not materialize those dates until sync runs when the calendar reaches them.
   */
  recurrencePendingBasicFields?: RecurrencePendingBasicFields;
}
