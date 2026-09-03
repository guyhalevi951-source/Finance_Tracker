import { type TFunction } from 'i18next';
import { type AppLocale } from '../../config/app';
import { type SubBudgetRecord } from '../../types/budget';
import { resolveBilingualText } from '../i18n/resolveBilingualText';
import { MASTER_BUDGET_ID } from './constants';

export function resolveBudgetLabel(
  budget: SubBudgetRecord | { id: typeof MASTER_BUDGET_ID },
  locale: AppLocale,
  t: TFunction,
): string {
  if (budget.id === MASTER_BUDGET_ID) {
    return t('budget.monthlyBudgetTitle');
  }
  return resolveBilingualText(budget.name, locale);
}
