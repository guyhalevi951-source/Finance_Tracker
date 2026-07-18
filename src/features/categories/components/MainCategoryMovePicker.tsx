import { useTranslation } from 'react-i18next';
import { type MainCategoryRecord } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { getMainCategoryUI } from '../../expenses/categoryUi';

interface MainCategoryMovePickerProps {
  locale: AppLocale;
  mainCategories: MainCategoryRecord[];
  currentParentId: string;
  selectedParentId: string;
  onSelectParent: (parentId: string) => void;
}

export function MainCategoryMovePicker({
  locale,
  mainCategories,
  currentParentId,
  selectedParentId,
  onSelectParent,
}: MainCategoryMovePickerProps) {
  const { t } = useTranslation();
  const options = [...mainCategories]
    .filter((main) => main.id !== currentParentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));

  return (
    <section>
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
        {t('category.subEditor.moveLabel')}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {t('category.subEditor.moveHint')}
      </p>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {options.map((main) => {
          const { icon: Icon, color } = getMainCategoryUI(main.id, mainCategories);
          const isSelected = selectedParentId === main.id;
          return (
            <li key={main.id}>
              <button
                type="button"
                onClick={() => onSelectParent(main.id)}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-3 px-4 py-4 min-h-[64px] text-start transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white flex-shrink-0 ${color}`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0 font-medium text-slate-800 dark:text-slate-100 truncate">
                  {resolveBilingualText(main.labels, locale)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
