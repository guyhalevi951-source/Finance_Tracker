import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { CategoryLivePreview } from '../features/categories/components/CategoryLivePreview';
import { CategoryColorPicker } from '../features/categories/components/CategoryColorPicker';
import { CategoryIconPicker } from '../features/categories/components/CategoryIconPicker';
import { ROUTES } from '../config/routes';
import { type AppLocale } from '../config/app';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import {
  DEFAULT_CATEGORY_ICON_KEY,
} from '../domain/categories/categoryIconLibrary';
import { DEFAULT_CATEGORY_COLOR } from '../domain/categories/categoryColorPalette';

export function CategoryEditorPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { userId } = useAuthSession();
  const {
    mainCategories,
    addMainCategory,
    updateMainCategory,
    isSavingMainCategory,
    mainCategoryActionError,
  } = useCategories(userId);

  const existing = useMemo(
    () => (isEditMode ? mainCategories.find((main) => main.id === id) : undefined),
    [isEditMode, id, mainCategories],
  );

  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState(DEFAULT_CATEGORY_ICON_KEY);
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);

  useEffect(() => {
    if (existing) {
      setName(resolveBilingualText(existing.labels, locale));
      setIconKey(existing.icon);
      setColor(existing.color);
    }
  }, [existing, locale]);

  useAppHeader({
    title: t(isEditMode ? 'category.editor.titleEdit' : 'category.editor.titleCreate'),
  });

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const input = {
      labels: locale === 'en' ? { en: trimmed, he: '' } : { en: '', he: trimmed },
      icon: iconKey,
      color,
    };

    if (isEditMode && id) {
      const updated = await updateMainCategory(id, input, locale);
      if (updated) navigate(ROUTES.categoryManagement);
      return;
    }

    const created = await addMainCategory(input, locale);
    if (created) navigate(ROUTES.categoryManagement);
  };

  if (isEditMode && !existing && mainCategories.length > 0) {
    return (
      <p className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('category.editor.notFound')}
      </p>
    );
  }

  return (
    <div className="space-y-8 pb-28">
      <CategoryLivePreview name={name} iconKey={iconKey} colorClass={color} />

      <div>
        <label
          htmlFor="category-name"
          className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2"
        >
          {t('category.editor.nameLabel')}
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
        />
      </div>

      <CategoryColorPicker selectedColor={color} onSelectColor={setColor} />
      <CategoryIconPicker selectedIconKey={iconKey} onSelectIcon={setIconKey} />

      {mainCategoryActionError && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 text-sm">
          {t(`category.management.errors.${mainCategoryActionError}`)}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSavingMainCategory || !name.trim()}
          className="w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold shadow-lg"
        >
          {t('category.editor.saveButton')}
        </button>
      </div>
    </div>
  );
}
