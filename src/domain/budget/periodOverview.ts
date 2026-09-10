import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import {
  type DateRange,
  countDaysInRange,
  countElapsedDaysInPeriod,
  getMonthDayIsos,
} from '../expenses/periods';
import { isoDateToDate } from '../expenses/parseExpenseDate';
import {
  divideAmount,
  fromMinorUnits,
  subtractAmounts,
  sumAmounts,
  toMinorUnits,
} from '../money/arithmetic';
import {
  computeDailyExpenseBreakdown,
  type DailyExpenseBreakdown,
} from './computeDailyExpenseBreakdown';
import { hasBudgetLimit } from './hasBudgetLimit';

export type { DailyExpenseBreakdown };

export type PlannedDailyAverageDivisor = 'calendarMonth' | 'rangeInclusive';

export interface PeriodOverview {
  periodBudget: number;
  spent: number;
  futurePlanned: number;
  totalPlanned: number;
  leftToSpend: number;
  isOverspent: boolean;
  daysInPeriod: number;
  elapsedDays: number;
  remainingDays: number;
  averagePerDay: number;
  averagePerDayUpToDate: number;
  plannedDailyAverage: number;
  leftPerDay: number;
  dailyTotals: DailyExpenseBreakdown[];
}

export function resolvePlannedDailyAverageDivisor(
  mode: PlannedDailyAverageDivisor,
  range: DateRange,
): number {
  if (mode === 'calendarMonth') {
    const startDate = isoDateToDate(range.startIso);
    const daysInMonth = getMonthDayIsos(startDate.getFullYear(), startDate.getMonth()).length;
    return Math.max(1, daysInMonth);
  }

  return Math.max(1, countDaysInRange(range));
}

export function computePeriodBudget(
  monthlyBudget: number | null,
  range: DateRange,
): number {
  const startDate = isoDateToDate(range.startIso);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const daysInMonth = getMonthDayIsos(year, month).length;
  const daysInPeriod = countDaysInRange(range);

  if (daysInMonth === 0 || daysInPeriod === 0 || !hasBudgetLimit(monthlyBudget)) {
    return 0;
  }

  return fromMinorUnits(
    Math.round((toMinorUnits(monthlyBudget) * daysInPeriod) / daysInMonth),
  );
}

function countRemainingDays(range: DateRange, todayIso: string): number {
  if (todayIso > range.endIso) return 0;
  const effectiveStart = todayIso > range.startIso ? todayIso : range.startIso;
  return countDaysInRange({ startIso: effectiveStart, endIso: range.endIso });
}

export function computeOverviewForPeriodBudget({
  periodBudget,
  expenses,
  range,
  todayIso,
  subBudgets = [],
  plannedDailyAverageDivisor = 'rangeInclusive',
}: {
  periodBudget: number | null;
  expenses: Expense[];
  range: DateRange;
  todayIso: string;
  subBudgets?: SubBudgetRecord[];
  plannedDailyAverageDivisor?: PlannedDailyAverageDivisor;
}): PeriodOverview {
  const dailyTotals = computeDailyExpenseBreakdown(expenses, range, todayIso, subBudgets);
  const spent = sumAmounts(dailyTotals.map((day) => day.actualExpenses));
  const futurePlanned = sumAmounts(dailyTotals.map((day) => day.futureExpenses));
  const totalPlanned = sumAmounts([spent, futurePlanned]);
  const effectivePeriodBudget = hasBudgetLimit(periodBudget) ? periodBudget : 0;
  const leftToSpend = subtractAmounts(effectivePeriodBudget, totalPlanned);
  const isOverspent = hasBudgetLimit(periodBudget) && leftToSpend < 0;
  const daysInPeriod = countDaysInRange(range);
  const elapsedDays = countElapsedDaysInPeriod(range, todayIso);
  const remainingDays = countRemainingDays(range, todayIso);
  const averagePerDay = daysInPeriod > 0 ? divideAmount(totalPlanned, daysInPeriod) : 0;
  const averagePerDayUpToDate =
    elapsedDays > 0 ? divideAmount(spent, elapsedDays) : 0;
  const plannedDivisor = resolvePlannedDailyAverageDivisor(plannedDailyAverageDivisor, range);
  const plannedDailyAverage = divideAmount(totalPlanned, plannedDivisor);
  const leftPerDay =
    remainingDays > 0 ? divideAmount(leftToSpend, remainingDays) : 0;

  return {
    periodBudget: effectivePeriodBudget,
    spent,
    futurePlanned,
    totalPlanned,
    leftToSpend,
    isOverspent,
    daysInPeriod,
    elapsedDays,
    remainingDays,
    averagePerDay,
    averagePerDayUpToDate,
    plannedDailyAverage,
    leftPerDay,
    dailyTotals,
  };
}

export function computePeriodOverview({
  monthlyBudget,
  expenses,
  range,
  todayIso,
  subBudgets = [],
}: {
  monthlyBudget: number | null;
  expenses: Expense[];
  range: DateRange;
  todayIso: string;
  subBudgets?: SubBudgetRecord[];
}): PeriodOverview {
  const periodBudget = computePeriodBudget(monthlyBudget, range);
  return computeOverviewForPeriodBudget({
    periodBudget,
    expenses,
    range,
    todayIso,
    subBudgets,
    plannedDailyAverageDivisor: 'calendarMonth',
  });
}
