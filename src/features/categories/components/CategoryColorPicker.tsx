import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CATEGORY_COLOR_SWATCHES } from '../../../domain/categories/categoryColorPalette';

interface CategoryColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function CategoryColorPicker({ selectedColor, onSelectColor }: CategoryColorPickerProps) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
        {t('category.editor.colorLabel')}
      </h2>
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
        {CATEGORY_COLOR_SWATCHES.map((color) => {
          const isSelected = selectedColor === color;
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={isSelected}
              onClick={() => onSelectColor(color)}
              className={`w-12 h-12 rounded-full ${color} flex items-center justify-center min-h-[48px] min-w-[48px] mx-auto transition-transform ${
                isSelected ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-105' : ''
              }`}
            >
              {isSelected && <Check className="w-5 h-5 text-white" aria-hidden />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
