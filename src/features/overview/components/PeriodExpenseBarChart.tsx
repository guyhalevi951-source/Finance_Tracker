import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type AppLocale } from '../../../config/app';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { formatCurrencyAmount, formatDayOfMonth } from '../../../lib/format/formatDate';
import { dayAfterIso } from '../../../domain/expenses/shiftIsoDate';
import { useTheme } from '../../theme/hooks/useTheme';

const AXIS_TICK_FILL = {
  dark: '#f8fafc',
  light: '#64748b',
} as const;

const BAR_FILL = '#38bdf8';

interface PeriodExpenseBarChartProps {
  overview: PeriodOverview;
  locale: AppLocale;
  todayIso: string;
}

interface ChartPoint {
  dateIso: string;
  dayLabel: string;
  total: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  averagePerDay: number;
  locale: AppLocale;
  todayIso: string;
}

function ChartTooltipContent({
  active,
  payload,
  averagePerDay,
  locale,
  todayIso,
}: ChartTooltipProps) {
  const { t } = useTranslation();

  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const isToday = point.dateIso === todayIso;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {isToday ? t('overview.today') : point.dateIso}
      </p>
      <p className="text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
        {formatCurrencyAmount(point.total, locale)}
      </p>
      <p className="text-slate-400 dark:text-slate-500 mt-2 text-xs">
        {t('overview.averagePerDay')}: {formatCurrencyAmount(averagePerDay, locale)}
      </p>
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
        total: day.total,
      })),
    [overview.dailyTotals],
  );

  const futureStartIso = useMemo(() => {
    if (todayIso >= overview.dailyTotals.at(-1)?.dateIso!) return null;
    if (todayIso < overview.dailyTotals[0]?.dateIso!) {
      return overview.dailyTotals[0]?.dateIso ?? null;
    }
    return dayAfterIso(todayIso);
  }, [overview.dailyTotals, todayIso]);

  const futureEndIso = overview.dailyTotals.at(-1)?.dateIso ?? null;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200 outline-none select-none [&_svg]:outline-none [&_*]:outline-none"
      dir="ltr"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 36, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-600"
          />
          <XAxis
            dataKey="dayLabel"
            tick={{ fontSize: 11, fill: axisTickFill }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axisTickFill }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(value: number) => String(value)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
            content={
              <ChartTooltipContent
                averagePerDay={overview.averagePerDay}
                locale={locale}
                todayIso={todayIso}
              />
            }
          />
          {futureStartIso && futureEndIso && futureStartIso <= futureEndIso && (
            <ReferenceArea
              x1={String(formatDayOfMonth(futureStartIso))}
              x2={String(formatDayOfMonth(futureEndIso))}
              fill="rgba(16, 185, 129, 0.08)"
              strokeOpacity={0}
            />
          )}
          {todayIso >= chartData[0].dateIso && todayIso <= chartData.at(-1)!.dateIso && (
            <ReferenceLine
              x={String(formatDayOfMonth(todayIso))}
              stroke="rgb(16, 185, 129)"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: t('overview.today'),
                position: 'top',
                fill: '#ffffff',
                fontSize: 11,
                dy: -2,
              }}
            />
          )}
          <Bar
            dataKey="total"
            fill={BAR_FILL}
            activeBar={{ fill: BAR_FILL, stroke: 'none' }}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
