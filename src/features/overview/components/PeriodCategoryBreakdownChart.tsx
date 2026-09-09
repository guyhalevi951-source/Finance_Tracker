import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Wallet, type LucideIcon } from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { type AppLocale } from '../../../config/app';
import {
  assignBreakdownChartSliceColors,
  EMPTY_BREAKDOWN_RING_COLOR,
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
import { AppAccordion } from '../../../components/accordion';
import {
  BreakdownChartLegend,
  type BreakdownLegendItem,
} from './BreakdownChartLegend';
import { OverviewDataModeToggle } from './OverviewDataModeToggle';

const PIE_INNER_RADIUS_PERCENT = '48%';
const PIE_OUTER_RADIUS_PERCENT = '72%';
const CHART_VIEW_MARGIN = 24;
const SELECTED_RADIUS_OFFSET = 12;
const EMPTY_RING_SEGMENT_KEY = 'empty-ring';
const EMPTY_RING_VALUE = 1;

const CHART_WRAPPER_CLASS =
  'outline-none focus:outline-none select-none [&_svg]:outline-none [&_svg]:focus:outline-none [&_svg]:overflow-visible [&_*]:outline-none [&_*]:focus:outline-none';

interface PeriodCategoryBreakdownChartProps {
  expenses: Expense[];
  locale: AppLocale;
  mainCategories: MainCategoryRecord[];
  subCategories: SubCategoryRecord[];
  subBudgets: SubBudgetRecord[];
  isMaster: boolean;
  isPlannedAverage: boolean;
  onSelectMode: (isPlannedAverage: boolean) => void;
  showDataModeControls: boolean;
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

function toLegendItem(item: BreakdownPresentation): BreakdownLegendItem {
  return {
    segmentKey: buildSegmentKey(item.slice.kind, item.slice.id),
    label: item.label,
    fill: item.fill,
  };
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
  interactive,
}: {
  chartData: ChartDatum[];
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
  interactive: boolean;
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

    const isSelected = interactive && selectedSegments.includes(datum.segmentKey);
    const explodedInner = isSelected ? innerRadius + SELECTED_RADIUS_OFFSET : innerRadius;
    const explodedOuter = isSelected ? outerRadius + SELECTED_RADIUS_OFFSET : outerRadius;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={explodedInner}
          outerRadius={explodedOuter}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
          tabIndex={-1}
          style={{ cursor: interactive ? 'pointer' : 'default', outline: 'none' }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={interactive ? () => onToggleSegment(datum.segmentKey) : undefined}
        />
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
  emptyLabel,
}: {
  chartData: ChartDatum[];
  total: number;
  locale: AppLocale;
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
  emptyLabel: string | null;
}) {
  return (
    <div
      className={`relative aspect-square w-full max-h-full overflow-visible ${CHART_WRAPPER_CLASS}`}
    >
      <ResponsiveContainer width="100%" height="100%" className="overflow-visible">
        <PieChart
          margin={{
            top: CHART_VIEW_MARGIN,
            right: CHART_VIEW_MARGIN,
            bottom: CHART_VIEW_MARGIN,
            left: CHART_VIEW_MARGIN,
          }}
          style={{ overflow: 'visible' }}
        >
          <InteractiveBreakdownPie
            chartData={chartData}
            selectedSegments={selectedSegments}
            onToggleSegment={onToggleSegment}
            interactive={emptyLabel === null}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {emptyLabel ? (
          <p className="max-w-[5.5rem] text-center text-[11px] leading-snug text-slate-500 dark:text-slate-400 px-2">
            {emptyLabel}
          </p>
        ) : (
          <p className="text-base font-bold tabular-nums text-slate-800 dark:text-slate-100 text-center px-2">
            {formatCurrencyAmount(total, locale)}
          </p>
        )}
      </div>
    </div>
  );
}

function BreakdownGraphicCard({
  chartData,
  total,
  locale,
  budgetItems,
  categoryItems,
  selectedSegments,
  onToggleSegment,
  isPlannedAverage,
  onSelectMode,
  showDataModeControls,
  emptyLabel,
}: {
  chartData: ChartDatum[];
  total: number;
  locale: AppLocale;
  budgetItems: BreakdownLegendItem[];
  categoryItems: BreakdownLegendItem[];
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
  isPlannedAverage: boolean;
  onSelectMode: (isPlannedAverage: boolean) => void;
  showDataModeControls: boolean;
  emptyLabel: string | null;
}) {
  const isEmpty = emptyLabel !== null;

  return (
    <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="grid grid-cols-[minmax(0,42%)_1fr] items-stretch gap-3 p-3">
        <div className="flex h-full min-h-0 flex-col items-center">
          <div className="relative aspect-square w-full max-w-[168px] shrink-0 overflow-visible">
            <BreakdownDoughnutChart
              chartData={chartData}
              total={total}
              locale={locale}
              selectedSegments={selectedSegments}
              onToggleSegment={onToggleSegment}
              emptyLabel={emptyLabel}
            />
          </div>
          {showDataModeControls && (
            <div className="mt-auto pt-2">
              <OverviewDataModeToggle
                isPlannedAverage={isPlannedAverage}
                onSelectMode={onSelectMode}
              />
            </div>
          )}
        </div>
        {!isEmpty && (
          <div className="min-w-0 overflow-visible">
            <BreakdownChartLegend
              className="w-full"
              budgetItems={budgetItems}
              categoryItems={categoryItems}
              selectedSegments={selectedSegments}
              onToggleSegment={onToggleSegment}
            />
          </div>
        )}
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
  isPlannedAverage,
  onSelectMode,
  showDataModeControls,
}: PeriodCategoryBreakdownChartProps) {
  const { t } = useTranslation();
  const [budgetsOpen, setBudgetsOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

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

  const budgetLegendItems = useMemo(
    () => budgetPresentations.map(toLegendItem),
    [budgetPresentations],
  );

  const categoryLegendItems = useMemo(
    () => categoryPresentations.map(toLegendItem),
    [categoryPresentations],
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
    if (presentations.length === 0) {
      const emptySlice = {
        id: 'empty',
        kind: 'category' as const,
        segmentKey: EMPTY_RING_SEGMENT_KEY,
        name: t('overview.breakdownEmpty'),
        value: EMPTY_RING_VALUE,
        fill: EMPTY_BREAKDOWN_RING_COLOR,
      };
      return [
        emptySlice,
        { ...emptySlice, id: 'empty-2', segmentKey: `${EMPTY_RING_SEGMENT_KEY}-2` },
      ];
    }

    return presentations.map((item) => ({
      id: item.slice.id,
      kind: item.slice.kind,
      segmentKey: buildSegmentKey(item.slice.kind, item.slice.id),
      name: item.label,
      value: item.slice.total,
      fill: item.fill,
    }));
  }, [presentations, t]);

  const isEmpty = slices.length === 0;
  const emptyLabel = isEmpty ? t('overview.breakdownEmpty') : null;

  const graphicCardProps = {
    chartData,
    total,
    locale,
    budgetItems: budgetLegendItems,
    categoryItems: categoryLegendItems,
    selectedSegments,
    onToggleSegment: toggleSegment,
    isPlannedAverage,
    onSelectMode,
    showDataModeControls,
    emptyLabel,
  };

  if (!isMaster) {
    return (
      <div className="space-y-4">
        <BreakdownGraphicCard {...graphicCardProps} />

        {!isEmpty && filteredPresentations.length > 0 && (
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
      <BreakdownGraphicCard {...graphicCardProps} />

      {filteredBudgetPresentations.length > 0 && (
        <AppAccordion
          title={t('overview.breakdownBudgets')}
          subtitle={t('overview.breakdownBudgetsSubtitle')}
          icon={Wallet}
          open={budgetsOpen}
          onToggle={() => setBudgetsOpen((prev) => !prev)}
          variant="parent"
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
        </AppAccordion>
      )}

      {filteredCategoryPresentations.length > 0 && (
        <AppAccordion
          title={t('overview.breakdownCategories')}
          subtitle={t('overview.breakdownCategoriesSubtitle')}
          icon={LayoutGrid}
          open={categoriesOpen}
          onToggle={() => setCategoriesOpen((prev) => !prev)}
          variant="parent"
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
        </AppAccordion>
      )}
    </div>
  );
}
