import { useCallback, useMemo, useState } from 'react';
import { type AppLocale } from '../../../config/app';
import {
  type DateRange,
  type MonthWeekRange,
  type TimeGranularity,
  firstOfMonthDate,
  getDefaultDayIso,
  getDefaultWeekIndex,
  getMonthDayIsos,
  getMonthWeekRanges,
  resolveExpenseTimeRange,
} from '../../../domain/expenses/periods';
import { formatDate } from '../../../lib/format/formatDate';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';

export interface UseExpenseTimeFilterReturn {
  year: number;
  month: number;
  granularity: TimeGranularity;
  selectedWeekIndex: number | null;
  selectedDayIso: string | null;
  range: DateRange;
  weeks: MonthWeekRange[];
  days: string[];
  monthLabel: string;
  todayIso: string;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  setGranularity: (granularity: TimeGranularity) => void;
  selectWeek: (index: number) => void;
  selectDay: (iso: string) => void;
}

function applyMonthDefaults(
  year: number,
  month: number,
  granularity: TimeGranularity,
): { selectedWeekIndex: number | null; selectedDayIso: string | null } {
  if (granularity === 'weekly') {
    return { selectedWeekIndex: getDefaultWeekIndex(year, month), selectedDayIso: null };
  }
  if (granularity === 'daily') {
    return { selectedWeekIndex: null, selectedDayIso: getDefaultDayIso(year, month) };
  }
  return { selectedWeekIndex: null, selectedDayIso: null };
}

export function useExpenseTimeFilter(locale: AppLocale): UseExpenseTimeFilterReturn {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [granularity, setGranularityState] = useState<TimeGranularity>('monthly');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  const todayIso = useTodayIso();

  const weeks = useMemo(
    () => (granularity === 'weekly' ? getMonthWeekRanges(year, month) : []),
    [granularity, year, month],
  );

  const days = useMemo(
    () => (granularity === 'daily' ? getMonthDayIsos(year, month) : []),
    [granularity, year, month],
  );

  const range = useMemo(
    () => resolveExpenseTimeRange({ year, month, granularity, selectedWeekIndex, selectedDayIso }),
    [year, month, granularity, selectedWeekIndex, selectedDayIso],
  );

  const monthLabel = useMemo(
    () => formatDate(firstOfMonthDate(year, month), locale),
    [year, month, locale],
  );

  const shiftMonth = useCallback(
    (delta: number) => {
      const next = new Date(year, month + delta, 1);
      setYear(next.getFullYear());
      setMonth(next.getMonth());
      const defaults = applyMonthDefaults(next.getFullYear(), next.getMonth(), granularity);
      setSelectedWeekIndex(defaults.selectedWeekIndex);
      setSelectedDayIso(defaults.selectedDayIso);
    },
    [year, month, granularity],
  );

  const goToPreviousMonth = useCallback(() => shiftMonth(-1), [shiftMonth]);
  const goToNextMonth = useCallback(() => shiftMonth(1), [shiftMonth]);

  const setGranularity = useCallback(
    (next: TimeGranularity) => {
      setGranularityState(next);
      const defaults = applyMonthDefaults(year, month, next);
      setSelectedWeekIndex(defaults.selectedWeekIndex);
      setSelectedDayIso(defaults.selectedDayIso);
    },
    [year, month],
  );

  const selectWeek = useCallback((index: number) => {
    setSelectedWeekIndex(index);
  }, []);

  const selectDay = useCallback((iso: string) => {
    setSelectedDayIso(iso);
  }, []);

  return {
    year,
    month,
    granularity,
    selectedWeekIndex,
    selectedDayIso,
    range,
    weeks,
    days,
    monthLabel,
    todayIso,
    goToPreviousMonth,
    goToNextMonth,
    setGranularity,
    selectWeek,
    selectDay,
  };
}
