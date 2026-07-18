import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type AppLocale } from '../../config/app';
import { isoDateToDate } from '../../domain/expenses/parseExpenseDate';
import { formatDate, getWeekdayInitials } from '../../lib/format/formatDate';
import { buildCalendarGrid } from './buildCalendarGrid';

export interface CustomDatePickerProps {
  open: boolean;
  value: string;
  maxDate?: string;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
}

function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

function clampToMaxDate(isoDate: string, maxDate?: string): string {
  if (maxDate && isoDate > maxDate) return maxDate;
  return isoDate;
}

export function CustomDatePicker({
  open,
  value,
  maxDate,
  onConfirm,
  onCancel,
}: CustomDatePickerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const [draftDate, setDraftDate] = useState(value);
  const [viewMonth, setViewMonth] = useState(() => isoDateToDate(value));

  useEffect(() => {
    if (!open) return;
    const clamped = clampToMaxDate(value, maxDate);
    setDraftDate(clamped);
    setViewMonth(isoDateToDate(clamped));
  }, [open, value, maxDate]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const weeks = useMemo(
    () => buildCalendarGrid(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth],
  );
  const weekdayInitials = getWeekdayInitials(locale);
  const monthLabel = formatDate(
    new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1),
    locale,
  );

  const canGoNextMonth = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    return monthIndex(nextMonth) <= monthIndex(isoDateToDate(maxDate));
  }, [maxDate, viewMonth]);

  const goToPreviousMonth = () => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    if (!canGoNextMonth) return;
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const handleConfirm = () => {
    onConfirm(clampToMaxDate(draftDate, maxDate));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      role="presentation"
      aria-hidden={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('calendar.dialogLabel')}
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label={t('calendar.prevMonth')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" aria-hidden />
          </button>

          <div className="flex-1 flex items-center justify-center min-h-[44px]">
            <span className="text-sm font-medium text-slate-900 dark:text-white">{monthLabel}</span>
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            disabled={!canGoNextMonth}
            aria-label={t('calendar.nextMonth')}
            aria-disabled={!canGoNextMonth}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl shrink-0 ${
              canGoNextMonth
                ? 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1 mb-4">
          {weekdayInitials.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="h-9 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {label}
            </div>
          ))}

          {weeks.flat().map((cell) => {
            const isSelected = cell.iso === draftDate;
            const isFuture = maxDate != null && cell.iso > maxDate;
            const dayNumber = isoDateToDate(cell.iso).getDate();

            return (
              <button
                key={cell.iso}
                type="button"
                disabled={isFuture}
                aria-pressed={isSelected}
                aria-disabled={isFuture}
                onClick={() => {
                  if (!isFuture) setDraftDate(cell.iso);
                }}
                className={`h-11 w-11 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isFuture
                    ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                    : isSelected
                      ? 'bg-amber-400 text-slate-900'
                      : cell.inCurrentMonth
                        ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-2 text-sm font-medium text-amber-600 dark:text-amber-400"
          >
            {t('calendar.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-[44px] px-2 text-sm font-medium text-amber-600 dark:text-amber-400"
          >
            {t('calendar.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
