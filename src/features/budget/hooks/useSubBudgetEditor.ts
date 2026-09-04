import { useContext } from 'react';
import {
  SubBudgetEditorContext,
  type SubBudgetEditorContextValue,
} from '../../../app/providers/SubBudgetEditorProvider';

export type UseSubBudgetEditorReturn = SubBudgetEditorContextValue;

export function useSubBudgetEditor(): UseSubBudgetEditorReturn {
  const context = useContext(SubBudgetEditorContext);
  if (!context) {
    throw new Error('useSubBudgetEditor must be used within SubBudgetEditorProvider');
  }
  return context;
}
