import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { CategoryLivePreview } from '../features/categories/components/CategoryLivePreview';
import { CategoryIconPicker } from '../features/categories/components/CategoryIconPicker';
import { MainCategoryMovePicker } from '../features/categories/components/MainCategoryMovePicker';
import { categorySubManagementPath } from '../config/routes';
import { type AppLocale } from '../config/app';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import { DEFAULT_CATEGORY_ICON_KEY } from '../domain/categories/categoryIconLibrary';

export function SubCategoryEditorPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { mainId, subId } = useParams<{ mainId: string; subId: string }>();
  const isEditMode = Boolean(subId);

  const { userId } = useAuthSession();
  const {
    mainCategories,
    subCategories,
    addSubCategory,
    updateSubCategory,
    moveSubCategoryAction,
    isSavingSubCategory,
    subCategoryActionError,
  } = useCategories(userId);

  const parentMain = useMemo(
    () => mainCategories.find((main) => main.id === mainId),
    [mainCategories, mainId],
  );

  const existing = useMemo(
    () => (isEditMode ? subCategories.find((sub) => sub.id === subId) : undefined),
    [isEditMode, subId, subCategories],
  );

  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState(DEFAULT_CATEGORY_ICON_KEY);
  const [moveTargetParentId, setMoveTargetParentId] = useState('');

  useEffect(() => {
    if (existing) {
      setName(resolveBilingualText(existing.labels, locale));
      setIconKey(existing.icon);
      setMoveTargetParentId('');
    }
  }, [existing, locale]);

  useAppHeader({
    title: t(isEditMode ? 'category.subEditor.titleEdit' : 'category.subEditor.titleCreate'),
  });

  const handleSave = async () => {
    if (!mainId || !parentMain) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const input = {
      labels: locale === 'en' ? { en: trimmed, he: '' } : { en: '', he: trimmed },
      icon: iconKey,
    };

    if (isEditMode && subId && existing) {
      const updated = await updateSubCategory(subId, input, locale);
      if (!updated) return;

      if (moveTargetParentId && moveTargetParentId !== existing.parentId) {
        const moved = await moveSubCategoryAction(subId, moveTargetParentId);
        if (moved) {
          navigate(categorySubManagementPath(moved.parentId));
        }
        return;
      }

      navigate(categorySubManagementPath(mainId));
      return;
    }

    const created = await addSubCategory(mainId, input, locale);
    if (created) navigate(categorySubManagementPath(mainId));
  };

  if (!parentMain && mainCategories.length > 0) {
    return (
      <p className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('category.subEditor.notFound')}
      </p>
    );
  }

  if (isEditMode && !existing && subCategories.length > 0) {
    return (
      <p className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('category.subEditor.notFound')}
      </p>
    );
  }

  const previewColor = parentMain?.color ?? 'bg-gray-500';

  return (
    <div className="space-y-8 pb-28">
      <CategoryLivePreview name={name} iconKey={iconKey} colorClass={previewColor} />

      <div>
        <label
          htmlFor="subcategory-name"
          className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
        >
          {t('category.subEditor.nameLabel')}
        </label>
        <input
          id="subcategory-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
        />
      </div>

      <CategoryIconPicker selectedIconKey={iconKey} onSelectIcon={setIconKey} />

      {isEditMode && existing && parentMain && (
        <MainCategoryMovePicker
          locale={locale}
          mainCategories={mainCategories}
          currentParentId={existing.parentId}
          selectedParentId={moveTargetParentId}
          onSelectParent={setMoveTargetParentId}
        />
      )}

      {subCategoryActionError && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 text-sm">
          {t(`category.subManagement.errors.${subCategoryActionError}`)}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSavingSubCategory || !name.trim() || !parentMain}
          className="w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold shadow-lg"
        >
          {t('category.subEditor.saveButton')}
        </button>
      </div>
    </div>
  );
}
