import { type Expense } from '../../types/expense';
import { hasBilingualTextContent } from '../i18n/buildBilingualText';
import { resolveBilingualText } from '../i18n/resolveBilingualText';
import { type AppLocale } from '../../config/app';

export function resolveExpenseDisplayLabel(
  expense: Expense,
  locale: AppLocale,
  categoryLabel: string,
): string {
  if (hasBilingualTextContent(expense.description)) {
    return resolveBilingualText(expense.description, locale);
  }

  return categoryLabel;
}
