import { type BilingualText } from './bilingual';
import { type PaymentMethodId } from './paymentMethod';

export interface Expense {
  id: string;
  description: BilingualText;
  amount: number;
  /** Builtin category ID (e.g. 'food') or custom category UUID */
  category: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  paymentMethod: PaymentMethodId;
}
