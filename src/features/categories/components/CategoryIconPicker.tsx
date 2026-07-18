import { useTranslation } from 'react-i18next';
import { CATEGORY_ICON_GROUPS } from '../../../domain/categories/categoryIconLibrary';
import { getCategoryIconComponent } from '../iconRegistry';

interface CategoryIconPickerProps {
  selectedIconKey: string;
  onSelectIcon: (iconKey: string) => void;
}

export function CategoryIconPicker({ selectedIconKey, onSelectIcon }: CategoryIconPickerProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {t('category.editor.iconLabel')}
      </h2>
      {CATEGORY_ICON_GROUPS.map((group) => (
        <div key={group.id}>
          <h3 className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            {t(group.labelKey)}
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {group.iconKeys.map((iconKey) => {
              const Icon = getCategoryIconComponent(iconKey);
              const isSelected = selectedIconKey === iconKey;
              return (
                <button
                  key={`${group.id}-${iconKey}`}
                  type="button"
                  aria-label={iconKey}
                  aria-pressed={isSelected}
                  onClick={() => onSelectIcon(iconKey)}
                  className={`min-h-[48px] min-w-[48px] w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-colors ${
                    isSelected
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
