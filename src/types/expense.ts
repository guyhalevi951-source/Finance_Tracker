import { type BilingualText } from './bilingual';
import { type PaymentMethodId } from './paymentMethod';
import { type RecurrenceRule } from './recurrenceRule';

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
}
