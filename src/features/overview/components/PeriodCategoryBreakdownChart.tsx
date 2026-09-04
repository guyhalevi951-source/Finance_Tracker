import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, type LucideIcon } from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { type AppLocale } from '../../../config/app';
import {
  assignBreakdownChartSliceColors,
  resolveBreakdownChartSliceColor,
} from '../../../domain/budget/breakdownChartPalette';
import { resolveMainCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import {
  attachCategoryBreakdownPercents,
  groupPeriodCategoryBreakdown,
  type CategoryBreakdownSliceKind,
  type CategoryBreakdownSliceWithPercent,
} from '../../../domain/budget/groupPeriodCategoryBreakdown';
import { resolveBudgetLabel } from '../../../domain/budget/resolveBudgetLabel';
import { sumAmounts } from '../../../domain/money/arithmetic';
import { formatCurrencyAmount } from '../../../lib/format/formatDate';
import { type MainCategoryRecord, type SubCategoryRecord } from '../../../types/category';
import { type SubBudgetRecord } from '../../../types/budget';
import { type Expense } from '../../../types/expense';
import { getCategoryUI } from '../../expenses/categoryUi';
import { SettingsCategoryPanel } from '../../settings/components/SettingsCategoryPanel';
import { useTheme } from '../../theme/hooks/useTheme';

const PIE_INNER_RADIUS_PERCENT = '40%';
const PIE_OUTER_RADIUS_PERCENT = '54%';

function selectedRadialOffset(outerRadius: number): number {
  return Math.max(12, outerRadius * 0.12);
}

function labelGapFromOuterRadius(outerRadius: number): number {
  return Math.max(36, outerRadius * 0.28);
}

function labelFontSizeFromOuterRadius(outerRadius: number): number {
  return Math.max(11, Math.round(outerRadius * 0.095));
}

function radialLabelRotation(midAngle: number, radian: number): number {
  const cosVal = Math.cos(radian);
  return cosVal >= 0 ? -midAngle : -midAngle + 180;
}

const LABEL_FILL = {
  light: '#1e293b',
  dark: '#f1f5f9',
} as const;

interface PeriodCategoryBreakdownChartProps {
  expenses: Expense[];
  locale: AppLocale;
  mainCategories: MainCategoryRecord[];
  subCategories: SubCategoryRecord[];
  subBudgets: SubBudgetRecord[];
  isMaster: boolean;
}

interface BreakdownPresentation {
  slice: CategoryBreakdownSliceWithPercent;
  label: string;
  fill: string;
  Icon: LucideIcon;
  iconClassName: string;
  iconStyle?: CSSProperties;
  progressStyle?: CSSProperties;
}

interface ChartDatum {
  id: string;
  kind: CategoryBreakdownSliceKind;
  segmentKey: string;
  name: string;
  value: number;
  fill: string;
}

function buildSegmentKey(kind: CategoryBreakdownSliceKind, id: string): string {
  return `${kind}:${id}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function filterBySelection(
  items: BreakdownPresentation[],
  selectedSegments: string[],
): BreakdownPresentation[] {
  if (selectedSegments.length === 0) return items;
  return items.filter((item) =>
    selectedSegments.includes(buildSegmentKey(item.slice.kind, item.slice.id)),
  );
}

function BreakdownListRow({ item, locale }: { item: BreakdownPresentation; locale: AppLocale }) {
  return (
    <li className="px-4 py-4">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${item.iconClassName}`}
          style={item.iconStyle}
        >
          <item.Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
              {item.label}
            </span>
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100 shrink-0">
              {formatCurrencyAmount(item.slice.total, locale)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, item.slice.percent)}%`,
                  ...item.progressStyle,
                }}
              />
            </div>
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0 w-14 text-end">
              {formatPercent(item.slice.percent)}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

function InteractiveBreakdownPie({
  chartData,
  selectedSegments,
  onToggleSegment,
  labelFill,
}: {
  chartData: ChartDatum[];
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
  labelFill: string;
}) {
  const renderShape = (props: PieSectorDataItem) => {
    const {
      cx = 0,
      cy = 0,
      innerRadius = 0,
      outerRadius = 0,
      startAngle = 0,
      endAngle = 0,
      fill,
      payload,
    } = props;
    const datum = payload as ChartDatum;

    const isSelected = selectedSegments.includes(datum.segmentKey);
    const midAngle = (startAngle + endAngle) / 2;
    const radian = (Math.PI / 180) * -midAngle;
    const baseOuter = outerRadius;
    const popOutOffset = isSelected ? selectedRadialOffset(baseOuter) : 0;
    const translateX = popOutOffset * Math.cos(radian);
    const translateY = popOutOffset * Math.sin(radian);

    const labelRadius = baseOuter + labelGapFromOuterRadius(baseOuter) + popOutOffset;
    const labelX = cx + labelRadius * Math.cos(radian);
    const labelY = cy + labelRadius * Math.sin(radian);
    const textRotation = radialLabelRotation(midAngle, radian);
    const labelFontSize = labelFontSizeFromOuterRadius(baseOuter);

    return (
      <g>
        <g
          style={{
            transition: 'transform 0.2s ease',
            transform: `translate(${translateX}px, ${translateY}px)`,
          }}
        >
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            stroke="none"
            style={{ cursor: 'pointer', outline: 'none' }}
            onClick={() => onToggleSegment(datum.segmentKey)}
          />
        </g>
        <text
          x={labelX}
          y={labelY}
          fill={labelFill}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={labelFontSize}
          fontWeight={600}
          transform={`rotate(${textRotation}, ${labelX}, ${labelY})`}
          style={{ pointerEvents: 'none' }}
        >
          {datum.name}
        </text>
      </g>
    );
  };

  return (
    <Pie
      data={chartData}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      innerRadius={PIE_INNER_RADIUS_PERCENT}
      outerRadius={PIE_OUTER_RADIUS_PERCENT}
      paddingAngle={0}
      stroke="none"
      shape={renderShape}
    />
  );
}

function BreakdownDoughnutChart({
  chartData,
  total,
  locale,
  selectedSegments,
  onToggleSegment,
  labelFill,
}: {
  chartData: ChartDatum[];
  total: number;
  locale: AppLocale;
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
  labelFill: string;
}) {
  return (
    <div className="px-2 py-2 flex justify-center">
      <div className="relative mx-auto w-[88%] max-w-[320px] aspect-square overflow-visible">
        <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
          <PieChart style={{ overflow: 'visible' }}>
            <InteractiveBreakdownPie
              chartData={chartData}
              selectedSegments={selectedSegments}
              onToggleSegment={onToggleSegment}
              labelFill={labelFill}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-base font-bold tabular-nums text-slate-800 dark:text-slate-100 text-center px-2">
            {formatCurrencyAmount(total, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PeriodCategoryBreakdownChart({
  expenses,
  locale,
  mainCategories,
  subCategories,
  subBudgets,
  isMaster,
}: PeriodCategoryBreakdownChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [budgetsOpen, setBudgetsOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  const labelFill = LABEL_FILL[theme];

  const slices = useMemo(
    () =>
      attachCategoryBreakdownPercents(
        groupPeriodCategoryBreakdown({
          expenses,
          subCategories,
          subBudgets,
          isMaster,
        }),
      ),
    [expenses, subCategories, subBudgets, isMaster],
  );

  const total = useMemo(() => sumAmounts(slices.map((slice) => slice.total)), [slices]);

  const sliceColorMap = useMemo(
    () =>
      assignBreakdownChartSliceColors(
        slices.map((slice) => ({ kind: slice.kind, id: slice.id })),
      ),
    [slices],
  );

  const presentations = useMemo<BreakdownPresentation[]>(() => {
    return slices.map((slice) => {
      const fill = resolveBreakdownChartSliceColor(sliceColorMap, slice.kind, slice.id);

      if (slice.kind === 'subBudget') {
        const subBudget = subBudgets.find((item) => item.id === slice.id);
        const budgetName = subBudget ? resolveBudgetLabel(subBudget, locale, t) : slice.id;
        return {
          slice,
          label: budgetName,
          fill,
          Icon: Wallet,
          iconClassName: 'text-white',
          iconStyle: { backgroundColor: fill },
          progressStyle: { backgroundColor: fill },
        };
      }

      const { icon: Icon } = getCategoryUI(slice.id, mainCategories, subCategories);
      return {
        slice,
        label: resolveMainCategoryLabel(slice.id, mainCategories, locale, t),
        fill,
        Icon,
        iconClassName: 'text-white',
        iconStyle: { backgroundColor: fill },
        progressStyle: { backgroundColor: fill },
      };
    });
  }, [slices, sliceColorMap, subBudgets, mainCategories, subCategories, locale, t]);

  const validSegmentKeys = useMemo(
    () => new Set(presentations.map((item) => buildSegmentKey(item.slice.kind, item.slice.id))),
    [presentations],
  );

  useEffect(() => {
    setSelectedSegments((prev) => prev.filter((key) => validSegmentKeys.has(key)));
  }, [validSegmentKeys]);

  const toggleSegment = (segmentKey: string) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentKey)
        ? prev.filter((key) => key !== segmentKey)
        : [...prev, segmentKey],
    );
  };

  const budgetPresentations = useMemo(
    () => presentations.filter((item) => item.slice.kind === 'subBudget'),
    [presentations],
  );

  const categoryPresentations = useMemo(
    () => presentations.filter((item) => item.slice.kind === 'category'),
    [presentations],
  );

  const filteredPresentations = useMemo(
    () => filterBySelection(presentations, selectedSegments),
    [presentations, selectedSegments],
  );

  const filteredBudgetPresentations = useMemo(
    () => filterBySelection(budgetPresentations, selectedSegments),
    [budgetPresentations, selectedSegments],
  );

  const filteredCategoryPresentations = useMemo(
    () => filterBySelection(categoryPresentations, selectedSegments),
    [categoryPresentations, selectedSegments],
  );

  const chartData = useMemo<ChartDatum[]>(() => {
    return presentations.map((item) => ({
      id: item.slice.id,
      kind: item.slice.kind,
      segmentKey: buildSegmentKey(item.slice.kind, item.slice.id),
      name: item.label,
      value: item.slice.total,
      fill: item.fill,
    }));
  }, [presentations]);

  if (slices.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('overview.breakdownEmpty')}
      </div>
    );
  }

  const chartProps = {
    chartData,
    total,
    locale,
    selectedSegments,
    onToggleSegment: toggleSegment,
    labelFill,
  };

  if (!isMaster) {
    return (
      <div className="space-y-4">
        <BreakdownDoughnutChart {...chartProps} />

        {filteredPresentations.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredPresentations.map((item) => (
                <BreakdownListRow
                  key={`list-${item.slice.kind}-${item.slice.id}`}
                  item={item}
                  locale={locale}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BreakdownDoughnutChart {...chartProps} />

      {filteredBudgetPresentations.length > 0 && (
        <SettingsCategoryPanel
          title={t('overview.breakdownBudgets')}
          open={budgetsOpen}
          onToggle={() => setBudgetsOpen((prev) => !prev)}
          depth={0}
        >
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredBudgetPresentations.map((item) => (
              <BreakdownListRow
                key={`budget-${item.slice.id}`}
                item={item}
                locale={locale}
              />
            ))}
          </ul>
        </SettingsCategoryPanel>
      )}

      {filteredCategoryPresentations.length > 0 && (
        <SettingsCategoryPanel
          title={t('overview.breakdownCategories')}
          open={categoriesOpen}
          onToggle={() => setCategoriesOpen((prev) => !prev)}
          depth={0}
        >
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredCategoryPresentations.map((item) => (
              <BreakdownListRow
                key={`category-${item.slice.id}`}
                item={item}
                locale={locale}
              />
            ))}
          </ul>
        </SettingsCategoryPanel>
      )}
    </div>
  );
}
