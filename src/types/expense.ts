import { type BilingualText } from './bilingual';
import { type PaymentMethodId } from './paymentMethod';

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
}
