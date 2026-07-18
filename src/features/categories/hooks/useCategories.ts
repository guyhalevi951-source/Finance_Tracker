import { useContext } from 'react';
import {
  CategoriesContext,
  type CategoriesContextValue,
} from '../../../app/providers/CategoriesProvider';

export type UseCategoriesReturn = CategoriesContextValue;

export function useCategories(_userId: string | null): UseCategoriesReturn {
  void _userId;
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return context;
}
