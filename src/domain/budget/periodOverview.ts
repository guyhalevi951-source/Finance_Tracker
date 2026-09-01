import { type Expense } from '../../types/expense';
import {
  type DateRange,
  countDaysInRange,
  enumerateDaysInRange,
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

export interface DailyTotal {
  dateIso: string;
  total: number;
}

export interface PeriodOverview {
  periodBudget: number;
  spent: number;
  leftToSpend: number;
  isOverspent: boolean;
  daysInPeriod: number;
  remainingDays: number;
  averagePerDay: number;
  leftPerDay: number;
  dailyTotals: DailyTotal[];
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

export function computeDailyTotals(expenses: Expense[], range: DateRange): DailyTotal[] {
  const totalsByDate = new Map<string, number>();

  for (const expense of expenses) {
    if (expense.date < range.startIso || expense.date > range.endIso) continue;
    const existing = totalsByDate.get(expense.date) ?? 0;
    totalsByDate.set(expense.date, sumAmounts([existing, expense.amount]));
  }

  return enumerateDaysInRange(range).map((dateIso) => ({
    dateIso,
    total: totalsByDate.get(dateIso) ?? 0,
  }));
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
  const dailyTotals = computeDailyTotals(expenses, range);
  const spent = sumAmounts(dailyTotals.map((day) => day.total));
  const leftToSpend = subtractAmounts(periodBudget, spent);
  const isOverspent = leftToSpend < 0;
  const daysInPeriod = countDaysInRange(range);
  const remainingDays = countRemainingDays(range, todayIso);
  const averagePerDay = daysInPeriod > 0 ? divideAmount(spent, daysInPeriod) : 0;
  const leftPerDay =
    remainingDays > 0 ? divideAmount(leftToSpend, remainingDays) : 0;

  return {
    periodBudget,
    spent,
    leftToSpend,
    isOverspent,
    daysInPeriod,
    remainingDays,
    averagePerDay,
    leftPerDay,
    dailyTotals,
  };
}
