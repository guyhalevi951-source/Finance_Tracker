import { useContext } from 'react';
import { BudgetsContext, type BudgetsContextValue } from '../../../app/providers/BudgetsProvider';

export type UseBudgetsReturn = BudgetsContextValue;

export function useBudgets(): UseBudgetsReturn {
  const context = useContext(BudgetsContext);
  if (!context) {
    throw new Error('useBudgets must be used within BudgetsProvider');
  }
  return context;
}
