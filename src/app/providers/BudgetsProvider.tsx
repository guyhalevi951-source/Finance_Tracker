import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import {
  collectSubBudgetExpenseIds,
  detachExpensesFromBudget,
} from '../../domain/budget/deleteSubBudgetPolicy';
import { capExpensesRecurrenceToSubBudgetEnd } from '../../domain/budget/subBudgetExpenseWindow';
import { reorderSubBudgets } from '../../domain/budget/reorderSubBudgets';
import {
  listActiveSubBudgets,
  listArchivedSubBudgets,
  purgeArchivedSubBudget,
} from '../../domain/budget/subBudgetLifecycle';
import { applyExpenseBatch } from '../../services/expenses/expenseRepository';
import {
  deleteSubBudget,
  loadSubBudgets,
  saveSubBudget,
  saveSubBudgetsOrder,
} from '../../services/budgets/subBudgetRepository';
import {
  loadActiveBudgetId,
  saveActiveBudgetId,
} from '../../services/storage/activeBudgetStorage';
import { isFixedSubBudget, isTemporarySubBudget } from '../../domain/budget/subBudgetKind';
import {
  type BudgetStore,
  type SubBudgetInput,
  type SubBudgetRecord,
  type TemporarySubBudgetRecord,
} from '../../types/budget';
import { useAuthSession } from '../../features/auth/hooks/useAuthSession';
import { useTodayIso } from '../../lib/hooks/useTodayIso';
import { useExpenses } from '../../features/expenses/hooks/useExpenses';

export interface BudgetsContextValue {
  subBudgets: SubBudgetRecord[];
  activeSubBudgets: SubBudgetRecord[];
  /** Only temporary budgets archive; fixed budgets are open-ended. */
  archivedSubBudgets: TemporarySubBudgetRecord[];
  activeBudgetId: string;
  activeBudget: SubBudgetRecord | { id: typeof MASTER_BUDGET_ID };
  isMaster: boolean;
  loadError: boolean;
  actionError: string | null;
  setActiveBudgetId: (budgetId: string) => void;
  addSubBudget: (input: SubBudgetInput) => Promise<void>;
  updateSubBudget: (id: string, input: SubBudgetInput) => Promise<void>;
  updateFixedBudgetMonthOverrides: (id: string, monthOverrides: BudgetStore) => Promise<void>;
  deleteSubBudgetAction: (id: string, deleteExpenses: boolean) => Promise<void>;
  deleteArchivedSubBudgetAction: (id: string) => Promise<void>;
  reorderSubBudgetsAction: (orderedIds: string[]) => Promise<void>;
  reload: () => Promise<void>;
}

export const BudgetsContext = createContext<BudgetsContextValue | null>(null);

function generateSubBudgetId(): string {
  return crypto.randomUUID();
}

interface BudgetsProviderProps {
  children: ReactNode;
}

export function BudgetsProvider({ children }: BudgetsProviderProps) {
  const { userId } = useAuthSession();
  const todayIso = useTodayIso();
  const { expenses, reload: reloadExpenses } = useExpenses();
  const [subBudgets, setSubBudgets] = useState<SubBudgetRecord[]>([]);
  const [activeBudgetId, setActiveBudgetIdState] = useState<string>(MASTER_BUDGET_ID);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeSubBudgets = useMemo(
    () => listActiveSubBudgets(subBudgets, todayIso),
    [subBudgets, todayIso],
  );

  const archivedSubBudgets = useMemo(
    () => listArchivedSubBudgets(subBudgets, todayIso),
    [subBudgets, todayIso],
  );

  const isMaster = activeBudgetId === MASTER_BUDGET_ID;

  const activeBudget = useMemo(() => {
    if (isMaster) return { id: MASTER_BUDGET_ID as typeof MASTER_BUDGET_ID };
    return (
      subBudgets.find((budget) => budget.id === activeBudgetId) ?? {
        id: MASTER_BUDGET_ID as typeof MASTER_BUDGET_ID,
      }
    );
  }, [activeBudgetId, isMaster, subBudgets]);

  const reload = useCallback(async () => {
    try {
      const loaded = await loadSubBudgets(userId);
      setSubBudgets(loaded);
      setLoadError(false);

      const storedId = await loadActiveBudgetId(userId);
      const activeIds = new Set(
        listActiveSubBudgets(loaded, todayIso).map((budget) => budget.id),
      );
      const isValid =
        storedId === MASTER_BUDGET_ID ||
        activeIds.has(storedId);
      const nextId = isValid ? storedId : MASTER_BUDGET_ID;
      setActiveBudgetIdState(nextId);
      if (!isValid) await saveActiveBudgetId(userId, MASTER_BUDGET_ID);
    } catch {
      setLoadError(true);
      setSubBudgets([]);
    }
  }, [userId, todayIso]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setActiveBudgetId = useCallback((budgetId: string) => {
    setActiveBudgetIdState(budgetId);
    void saveActiveBudgetId(userId, budgetId);
  }, [userId]);

  const addSubBudget = useCallback(
    async (input: SubBudgetInput) => {
      setActionError(null);
      const base = {
        id: generateSubBudgetId(),
        name: input.name,
        totalAmount: input.totalAmount,
        includeInMonthlyBudget: input.includeInMonthlyBudget,
        sortOrder: subBudgets.length,
        createdAt: new Date().toISOString(),
      };
      const budget: SubBudgetRecord =
        input.kind === 'fixed'
          ? { ...base, kind: 'fixed', monthOverrides: {} }
          : { ...base, kind: 'temporary', startDate: input.startDate, endDate: input.endDate };
      try {
        await saveSubBudget(userId, budget);
        await reload();
      } catch {
        setActionError('saveFailed');
      }
    },
    [userId, subBudgets.length, reload],
  );

  const updateSubBudget = useCallback(
    async (id: string, input: SubBudgetInput) => {
      setActionError(null);
      const existing = subBudgets.find((budget) => budget.id === id);
      if (!existing) return;
      // Kind is locked after creation; only the shared fields (and dates for temporary) change.
      const shared = {
        name: input.name,
        totalAmount: input.totalAmount,
        includeInMonthlyBudget: input.includeInMonthlyBudget,
      };
      const updated: SubBudgetRecord =
        isTemporarySubBudget(existing) && input.kind === 'temporary'
          ? { ...existing, ...shared, startDate: input.startDate, endDate: input.endDate }
          : { ...existing, ...shared };
      try {
        await saveSubBudget(userId, updated);
        if (
          isTemporarySubBudget(existing) &&
          input.kind === 'temporary' &&
          input.endDate !== existing.endDate
        ) {
          const cappedExpenses = capExpensesRecurrenceToSubBudgetEnd(expenses, id, input.endDate);
          await applyExpenseBatch(userId, cappedExpenses);
          await reloadExpenses();
        }
        await reload();
      } catch {
        setActionError('saveFailed');
      }
    },
    [userId, subBudgets, expenses, reload, reloadExpenses],
  );

  const updateFixedBudgetMonthOverrides = useCallback(
    async (id: string, monthOverrides: BudgetStore) => {
      setActionError(null);
      const existing = subBudgets.find((budget) => budget.id === id);
      if (!existing || !isFixedSubBudget(existing)) return;
      const updated: SubBudgetRecord = { ...existing, monthOverrides };
      setSubBudgets((prev) => prev.map((budget) => (budget.id === id ? updated : budget)));
      try {
        await saveSubBudget(userId, updated);
      } catch {
        setActionError('saveFailed');
        await reload();
      }
    },
    [userId, subBudgets, reload],
  );

  const deleteSubBudgetAction = useCallback(
    async (id: string, deleteExpenses: boolean) => {
      setActionError(null);
      try {
        if (deleteExpenses) {
          const idsToRemove = new Set(collectSubBudgetExpenseIds(expenses, id));
          const nextExpenses = expenses.filter((expense) => !idsToRemove.has(expense.id));
          await applyExpenseBatch(userId, nextExpenses);
        } else {
          const nextExpenses = detachExpensesFromBudget(expenses, id);
          await applyExpenseBatch(userId, nextExpenses);
        }
        await deleteSubBudget(userId, id);
        if (activeBudgetId === id) {
          setActiveBudgetId(MASTER_BUDGET_ID);
        }
        await reload();
        await reloadExpenses();
      } catch {
        setActionError('deleteFailed');
      }
    },
    [userId, expenses, activeBudgetId, setActiveBudgetId, reload, reloadExpenses],
  );

  const deleteArchivedSubBudgetAction = useCallback(
    async (id: string) => {
      setActionError(null);
      const purged = purgeArchivedSubBudget(subBudgets, id, todayIso);
      const updated = purged.find((budget) => budget.id === id);
      if (!updated?.purgedFromHistory) return;

      try {
        await saveSubBudget(userId, updated);
        if (activeBudgetId === id) {
          setActiveBudgetId(MASTER_BUDGET_ID);
        }
        await reload();
      } catch {
        setActionError('deleteFailed');
      }
    },
    [userId, subBudgets, todayIso, activeBudgetId, setActiveBudgetId, reload],
  );

  const reorderSubBudgetsAction = useCallback(
    async (orderedIds: string[]) => {
      setActionError(null);
      const reordered = reorderSubBudgets(subBudgets, orderedIds);
      setSubBudgets(reordered);
      try {
        await saveSubBudgetsOrder(userId, reordered);
      } catch {
        setActionError('reorderFailed');
        await reload();
      }
    },
    [userId, subBudgets, reload],
  );

  const value = useMemo(
    () => ({
      subBudgets,
      activeSubBudgets,
      archivedSubBudgets,
      activeBudgetId,
      activeBudget,
      isMaster,
      loadError,
      actionError,
      setActiveBudgetId,
      addSubBudget,
      updateSubBudget,
      updateFixedBudgetMonthOverrides,
      deleteSubBudgetAction,
      deleteArchivedSubBudgetAction,
      reorderSubBudgetsAction,
      reload,
    }),
    [
      subBudgets,
      activeSubBudgets,
      archivedSubBudgets,
      activeBudgetId,
      activeBudget,
      isMaster,
      loadError,
      actionError,
      setActiveBudgetId,
      addSubBudget,
      updateSubBudget,
      updateFixedBudgetMonthOverrides,
      deleteSubBudgetAction,
      deleteArchivedSubBudgetAction,
      reorderSubBudgetsAction,
      reload,
    ],
  );

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>;
}
