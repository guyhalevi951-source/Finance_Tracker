import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Pencil, Trash2 } from 'lucide-react';
import { type AppLocale } from '../../../config/app';
import { resolveBudgetLabel } from '../../../domain/budget/resolveBudgetLabel';
import { type FixedSubBudgetRecord } from '../../../types/budget';
import { useExpenseTimeFilter } from '../../expenses/hooks/useExpenseTimeFilter';
import { useFixedBudgetMonth } from '../hooks/useFixedBudgetMonth';
import { MasterBudgetListRow } from './MasterBudgetListRow';

interface FixedBudgetListRowProps {
  budget: FixedSubBudgetRecord;
  locale: AppLocale;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onOpenOverview: () => void;
}

const ICON_BUTTON_CLASS = 'min-h-[44px] min-w-[44px] flex items-center justify-center';

/**
 * A fixed budget row mirrors the master monthly row (month navigation, per-month amount,
 * carry-over) and adds the temporary-row actions: delete, edit, reorder.
 */
export function FixedBudgetListRow({
  budget,
  locale,
  onEdit,
  onDeleteRequest,
  onOpenOverview,
}: FixedBudgetListRowProps) {
  const { t } = useTranslation();
  const monthNav = useExpenseTimeFilter(locale);
  const monthBudget = useFixedBudgetMonth(budget, monthNav.year, monthNav.month);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: budget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-80 shadow-lg z-10 relative' : ''}
    >
      <MasterBudgetListRow
        locale={locale}
        title={resolveBudgetLabel(budget, locale, t)}
        year={monthNav.year}
        month={monthNav.month}
        monthLabel={monthNav.monthLabel}
        goToPreviousMonth={monthNav.goToPreviousMonth}
        goToNextMonth={monthNav.goToNextMonth}
        selectMonth={monthNav.selectMonth}
        monthBudget={monthBudget}
        onOpenOverview={onOpenOverview}
        trailingActions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDeleteRequest}
              className={`text-slate-400 hover:text-rose-600 ${ICON_BUTTON_CLASS}`}
              aria-label={t('budget.list.delete')}
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onEdit}
              className={`text-slate-400 hover:text-amber-600 ${ICON_BUTTON_CLASS}`}
              aria-label={t('budget.list.edit')}
            >
              <Pencil className="w-5 h-5" />
            </button>

            <button
              type="button"
              className={`text-slate-400 cursor-grab active:cursor-grabbing touch-none ${ICON_BUTTON_CLASS}`}
              aria-label={t('budget.list.reorder')}
              {...attributes}
              {...listeners}
            >
              <GripHorizontal className="w-5 h-5" />
            </button>
          </div>
        }
      />
    </li>
  );
}
