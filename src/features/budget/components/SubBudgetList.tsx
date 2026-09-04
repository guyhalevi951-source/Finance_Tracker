import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Pencil, Trash2 } from 'lucide-react';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { MASTER_BUDGET_ID } from '../../../domain/budget/constants';
import { resolveBudgetLabel } from '../../../domain/budget/resolveBudgetLabel';
import { formatCurrencyAmount, formatExpenseDateNumeric } from '../../../lib/format/formatDate';
import { type SubBudgetRecord } from '../../../types/budget';
import { BudgetOverviewButton } from './BudgetOverviewButton';
import { DeleteSubBudgetConfirmModal } from './DeleteSubBudgetConfirmModal';
import {
  BUDGET_ACTION_CLUSTER_WIDTH_CLASS,
  BUDGET_LIST_ROW_LAYOUT,
  MasterBudgetListRow,
  type MasterBudgetListRowProps,
} from './MasterBudgetListRow';

interface SubBudgetListProps {
  locale: AppLocale;
  subBudgets: SubBudgetRecord[];
  masterBudget: Omit<MasterBudgetListRowProps, 'locale'>;
  onReorder: (orderedIds: string[]) => void;
  onEdit: (budget: SubBudgetRecord) => void;
  onDelete: (id: string, deleteExpenses: boolean) => Promise<void>;
  onOpenOverview: (budgetId: string) => void;
  isDeleting: boolean;
}

interface SortableRowProps {
  budget: SubBudgetRecord;
  locale: AppLocale;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onOpenOverview: () => void;
}

function SortableSubBudgetRow({ budget, locale, onEdit, onDeleteRequest, onOpenOverview }: SortableRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: budget.id,
  });
  const label = resolveBudgetLabel(budget, locale, t);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-start gap-3 ${BUDGET_LIST_ROW_LAYOUT} bg-white dark:bg-slate-800 ${
        isDragging ? 'opacity-80 shadow-lg z-10 relative' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {formatExpenseDateNumeric(budget.startDate, locale)} –{' '}
          {formatExpenseDateNumeric(budget.endDate, locale)}
        </p>
        <p className={`text-sm tabular-nums mt-1 ${SEMANTIC_COLORS.budget.valueText}`}>
          {formatCurrencyAmount(budget.totalAmount, locale)}
        </p>
      </div>

      <div
        className={`flex flex-col items-stretch gap-1 shrink-0 self-end ${BUDGET_ACTION_CLUSTER_WIDTH_CLASS}`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDeleteRequest}
            className="text-slate-400 hover:text-rose-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('budget.list.delete')}
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="text-slate-400 hover:text-amber-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('budget.list.edit')}
          >
            <Pencil className="w-5 h-5" />
          </button>

          <button
            type="button"
            className="text-slate-400 cursor-grab active:cursor-grabbing min-h-[44px] min-w-[44px] flex items-center justify-center touch-none"
            aria-label={t('budget.list.reorder')}
            {...attributes}
            {...listeners}
          >
            <GripHorizontal className="w-5 h-5" />
          </button>
        </div>

        <BudgetOverviewButton onOpen={onOpenOverview} />
      </div>
    </li>
  );
}

export function SubBudgetList({
  locale,
  subBudgets,
  masterBudget,
  onReorder,
  onEdit,
  onDelete,
  onOpenOverview,
  isDeleting,
}: SubBudgetListProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<SubBudgetRecord | null>(null);

  const ids = useMemo(() => subBudgets.map((budget) => budget.id), [subBudgets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <MasterBudgetListRow
          locale={locale}
          {...masterBudget}
          onOpenOverview={() => onOpenOverview(MASTER_BUDGET_ID)}
        />

        {subBudgets.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {subBudgets.map((budget) => (
                  <SortableSubBudgetRow
                    key={budget.id}
                    budget={budget}
                    locale={locale}
                    onEdit={() => onEdit(budget)}
                    onDeleteRequest={() => setDeleteTarget(budget)}
                    onOpenOverview={() => onOpenOverview(budget.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <DeleteSubBudgetConfirmModal
        open={deleteTarget !== null}
        budgetName={deleteTarget ? resolveBudgetLabel(deleteTarget, locale, t) : ''}
        isSaving={isDeleting}
        onDeleteWithExpenses={() => {
          if (!deleteTarget) return;
          void onDelete(deleteTarget.id, true).then(() => setDeleteTarget(null));
        }}
        onKeepExpenses={() => {
          if (!deleteTarget) return;
          void onDelete(deleteTarget.id, false).then(() => setDeleteTarget(null));
        }}
        onDismiss={() => setDeleteTarget(null)}
      />
    </>
  );
}
