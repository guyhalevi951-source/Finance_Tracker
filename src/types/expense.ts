import { type BilingualText } from './bilingual';

export interface Expense {
  id: string;
  description: BilingualText;
  amount: number;
  /** Builtin category ID (e.g. 'food') or custom category UUID */
  category: string;
  date: string;
}
