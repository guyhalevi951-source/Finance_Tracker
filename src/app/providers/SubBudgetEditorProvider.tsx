import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../config/app';
import { SubBudgetEditorModal } from '../../features/budget/components/SubBudgetEditorModal';
import { useBudgets } from '../../features/budget/hooks/useBudgets';
import { type SubBudgetInput, type SubBudgetRecord } from '../../types/budget';

export interface SubBudgetEditorContextValue {
  open: boolean;
  openAddSubBudget: () => void;
  openEditSubBudget: (budget: SubBudgetRecord) => void;
  closeSubBudgetEditor: () => void;
}

export const SubBudgetEditorContext = createContext<SubBudgetEditorContextValue | null>(null);

export function SubBudgetEditorProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { addSubBudget, updateSubBudget } = useBudgets();
  const [open, setOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<SubBudgetRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openAddSubBudget = useCallback(() => {
    setEditingBudget(null);
    setOpen(true);
  }, []);

  const openEditSubBudget = useCallback((budget: SubBudgetRecord) => {
    setEditingBudget(budget);
    setOpen(true);
  }, []);

  const closeSubBudgetEditor = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSave = useCallback(
    async (input: SubBudgetInput) => {
      setIsSaving(true);
      try {
        if (editingBudget) {
          await updateSubBudget(editingBudget.id, input);
        } else {
          await addSubBudget(input);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [addSubBudget, editingBudget, updateSubBudget],
  );

  const value = useMemo(
    () => ({
      open,
      openAddSubBudget,
      openEditSubBudget,
      closeSubBudgetEditor,
    }),
    [open, openAddSubBudget, openEditSubBudget, closeSubBudgetEditor],
  );

  return (
    <SubBudgetEditorContext.Provider value={value}>
      {children}
      <SubBudgetEditorModal
        open={open}
        locale={locale}
        editingBudget={editingBudget}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={closeSubBudgetEditor}
      />
    </SubBudgetEditorContext.Provider>
  );
}
