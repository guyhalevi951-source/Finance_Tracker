import { type Expense } from '../../types/expense';
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

export type { DailyExpenseBreakdown };

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
  leftPerDay: number;
  dailyTotals: DailyExpenseBreakdown[];
}

export function computePeriodBudget(monthlyBudget: number, range: DateRange): number {
  const startDate = isoDateToDate(range.startIso);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const daysInMonth = getMonthDayIsos(year, month).length;
  const daysInPeriod = countDaysInRange(range);

  if (daysInMonth === 0 || daysInPeriod === 0 || monthlyBudget <= 0) {
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

export function computePeriodOverview({
  monthlyBudget,
  expenses,
  range,
  todayIso,
}: {
  monthlyBudget: number;
  expenses: Expense[];
  range: DateRange;
  todayIso: string;
}): PeriodOverview {
  const periodBudget = computePeriodBudget(monthlyBudget, range);
  const dailyTotals = computeDailyExpenseBreakdown(expenses, range, todayIso);
  const spent = sumAmounts(dailyTotals.map((day) => day.actualExpenses));
  const futurePlanned = sumAmounts(dailyTotals.map((day) => day.futureExpenses));
  const totalPlanned = sumAmounts([spent, futurePlanned]);
  const leftToSpend = subtractAmounts(periodBudget, totalPlanned);
  const isOverspent = leftToSpend < 0;
  const daysInPeriod = countDaysInRange(range);
  const elapsedDays = countElapsedDaysInPeriod(range, todayIso);
  const remainingDays = countRemainingDays(range, todayIso);
  const averagePerDay = daysInPeriod > 0 ? divideAmount(totalPlanned, daysInPeriod) : 0;
  const averagePerDayUpToDate =
    elapsedDays > 0 ? divideAmount(spent, elapsedDays) : 0;
  const leftPerDay =
    remainingDays > 0 ? divideAmount(leftToSpend, remainingDays) : 0;

  return {
    periodBudget,
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
    leftPerDay,
    dailyTotals,
  };
}
