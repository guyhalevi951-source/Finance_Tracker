import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { formatCurrencyAmount, formatDayOfMonth } from '../../../lib/format/formatDate';
import { useTheme } from '../../theme/hooks/useTheme';

const { expense } = SEMANTIC_COLORS;
const ACTUAL_FILL = expense.chartActual;
const FUTURE_FILL = expense.chartFuture;

const AXIS_TICK_FILL = {
  dark: '#f8fafc',
  light: '#64748b',
} as const;

interface DayAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  fill: string;
  todayDayLabel: string | null;
  todayLabel: string;
}

function DayAxisTick({ x = 0, y = 0, payload, fill, todayDayLabel, todayLabel }: DayAxisTickProps) {
  if (!payload) return null;

  const isToday = todayDayLabel !== null && payload.value === todayDayLabel;

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill={fill} fontSize={9} dy={12}>
        {payload.value}
      </text>
      {isToday && (
        <text textAnchor="middle" fill="#ffffff" fontSize={9} dy={26}>
          {todayLabel}
        </text>
      )}
    </g>
  );
}

interface PeriodExpenseBarChartProps {
  overview: PeriodOverview;
  locale: AppLocale;
  todayIso: string;
}

interface ChartPoint {
  dateIso: string;
  dayLabel: string;
  actualExpenses: number;
  futureExpenses: number;
  total: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  locale: AppLocale;
  todayIso: string;
}

function ChartTooltipContent({ active, payload, locale, todayIso }: ChartTooltipProps) {
  const { t } = useTranslation();

  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const isToday = point.dateIso === todayIso;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {isToday ? t('overview.today') : point.dateIso}
      </p>
      {point.actualExpenses > 0 && (
        <p className="text-slate-600 dark:text-slate-300 mt-2 tabular-nums">
          {t('overview.actualExpenses')}:{' '}
          <span className={expense.valueText}>
            {formatCurrencyAmount(point.actualExpenses, locale)}
          </span>
        </p>
      )}
      {point.futureExpenses > 0 && (
        <p className="text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
          {t('overview.futureExpenses')}:{' '}
          <span className={expense.valueText}>
            {formatCurrencyAmount(point.futureExpenses, locale)}
          </span>
        </p>
      )}
      {point.total === 0 && (
        <p className={`mt-2 tabular-nums ${expense.valueText}`}>
          {formatCurrencyAmount(0, locale)}
        </p>
      )}
    </div>
  );
}

export function PeriodExpenseBarChart({ overview, locale, todayIso }: PeriodExpenseBarChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const axisTickFill = AXIS_TICK_FILL[theme];

  const chartData = useMemo<ChartPoint[]>(
    () =>
      overview.dailyTotals.map((day) => ({
        dateIso: day.dateIso,
        dayLabel: String(formatDayOfMonth(day.dateIso)),
        actualExpenses: day.actualExpenses,
        futureExpenses: day.futureExpenses,
        total: day.total,
      })),
    [overview.dailyTotals],
  );

  const todayInRange =
    chartData.length > 0 &&
    todayIso >= chartData[0].dateIso &&
    todayIso <= chartData.at(-1)!.dateIso;
  const todayDayLabel = todayInRange ? String(formatDayOfMonth(todayIso)) : null;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200 outline-none select-none [&_svg]:outline-none [&_*]:outline-none"
      dir="ltr"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 32 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-600"
          />
          <XAxis
            dataKey="dayLabel"
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={
              <DayAxisTick
                fill={axisTickFill}
                todayDayLabel={todayDayLabel}
                todayLabel={t('overview.today')}
              />
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: axisTickFill }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(value: number) => String(value)}
          />
          <Tooltip
            cursor={{ fill: expense.tooltipCursor }}
            content={<ChartTooltipContent locale={locale} todayIso={todayIso} />}
          />
          <Bar
            dataKey="actualExpenses"
            stackId="daily"
            fill={ACTUAL_FILL}
            activeBar={{ fill: ACTUAL_FILL, stroke: 'none' }}
            radius={[0, 0, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="futureExpenses"
            stackId="daily"
            fill={FUTURE_FILL}
            activeBar={{ fill: FUTURE_FILL, stroke: 'none' }}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-center items-center gap-6 mt-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: ACTUAL_FILL }}
            aria-hidden="true"
          />
          {t('overview.actualExpenses')}
        </span>
        <span className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: FUTURE_FILL }}
            aria-hidden="true"
          />
          {t('overview.futureExpenses')}
        </span>
      </div>
    </div>
  );
}
