import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export interface MonthYearPickerProps {
  open: boolean;
  year: number;
  /** 0-indexed month (January = 0) */
  month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

export function MonthYearPicker({ open, year, month, onSelect, onClose }: MonthYearPickerProps) {
  const { t } = useTranslation();
  const [viewYear, setViewYear] = useState(year);

  useEffect(() => {
    if (!open) return;
    setViewYear(year);
  }, [open, year]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleMonthSelect = (monthIndex: number) => {
    onSelect(viewYear, monthIndex);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('calendar.monthPickerLabel')}
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={() => setViewYear((current) => current - 1)}
            aria-label={t('calendar.prevYear')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" aria-hidden />
          </button>

          <div className="flex-1 flex items-center justify-center min-h-[44px]">
            <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
              {viewYear}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setViewYear((current) => current + 1)}
            aria-label={t('calendar.nextYear')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTH_INDICES.map((monthIndex) => {
            const isSelected = viewYear === year && monthIndex === month;

            return (
              <button
                key={monthIndex}
                type="button"
                onClick={() => handleMonthSelect(monthIndex)}
                aria-pressed={isSelected}
                className={`min-h-[44px] px-2 rounded-xl text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t(`calendar.months.${monthIndex}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
