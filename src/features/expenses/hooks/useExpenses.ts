import { useContext } from 'react';
import { ExpensesContext, type ExpensesContextValue } from '../../../app/providers/ExpensesProvider';

export type UseExpensesReturn = ExpensesContextValue;

export function useExpenses(): UseExpensesReturn {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpenses must be used within ExpensesProvider');
  }
  return context;
}
