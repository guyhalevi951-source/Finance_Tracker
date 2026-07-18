import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { GripHorizontal, Minus, Pencil } from 'lucide-react';
import { type MainCategoryRecord } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { categoryEditPath } from '../../../config/routes';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { PROTECTED_MAIN_CATEGORY_ID } from '../../../domain/categories/reassignSubCategoriesOnDelete';
import { getMainCategoryUI } from '../../expenses/categoryUi';
import { DeleteMainCategoryConfirmModal } from './DeleteMainCategoryConfirmModal';

interface CategoryManagementListProps {
  locale: AppLocale;
  mainCategories: MainCategoryRecord[];
  onReorder: (orderedIds: string[]) => void;
  onDelete: (mainId: string) => Promise<boolean>;
  isDeleting: boolean;
}

interface SortableRowProps {
  main: MainCategoryRecord;
  locale: AppLocale;
  mainCategories: MainCategoryRecord[];
  onEdit: () => void;
  onDeleteRequest: () => void;
}

function SortableCategoryRow({
  main,
  locale,
  mainCategories,
  onEdit,
  onDeleteRequest,
}: SortableRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: main.id,
  });
  const { icon: Icon, color } = getMainCategoryUI(main.id, mainCategories);
  const label = resolveBilingualText(main.labels, locale);
  const isProtected = main.id === PROTECTED_MAIN_CATEGORY_ID;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-4 min-h-[64px] bg-white dark:bg-slate-800 ${
        isDragging ? 'opacity-80 shadow-lg z-10 relative' : ''
      }`}
    >
      {!isProtected ? (
        <button
          type="button"
          onClick={onDeleteRequest}
          aria-label={t('category.management.deleteConfirmConfirm')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-rose-600 text-white flex-shrink-0"
        >
          <Minus className="w-4 h-4" />
        </button>
      ) : (
        <span className="min-h-[44px] min-w-[44px] flex-shrink-0" aria-hidden />
      )}

      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </span>

      <span className="flex-1 min-w-0 font-medium text-slate-800 dark:text-slate-100 truncate">
        {label}
      </span>

      <button
        type="button"
        onClick={onEdit}
        aria-label={t('category.editor.titleEdit')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      >
        <Pencil className="w-5 h-5" />
      </button>

      <button
        type="button"
        aria-label={t('category.management.dragHandle')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripHorizontal className="w-5 h-5" />
      </button>
    </li>
  );
}

export function CategoryManagementList({
  locale,
  mainCategories,
  onReorder,
  onDelete,
  isDeleting,
}: CategoryManagementListProps) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<MainCategoryRecord | null>(null);

  const sorted = useMemo(
    () => [...mainCategories].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    [mainCategories],
  );
  const ids = sorted.map((main) => main.id);

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await onDelete(deleteTarget.id);
    if (ok) setDeleteTarget(null);
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {sorted.map((main) => (
              <SortableCategoryRow
                key={main.id}
                main={main}
                locale={locale}
                mainCategories={mainCategories}
                onEdit={() => navigate(categoryEditPath(main.id))}
                onDeleteRequest={() => setDeleteTarget(main)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <DeleteMainCategoryConfirmModal
        open={deleteTarget !== null}
        categoryName={deleteTarget ? resolveBilingualText(deleteTarget.labels, locale) : ''}
        isSaving={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onDismiss={() => setDeleteTarget(null)}
      />
    </>
  );
}
