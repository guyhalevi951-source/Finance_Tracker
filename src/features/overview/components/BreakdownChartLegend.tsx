import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BreakdownLegendItem {
  segmentKey: string;
  label: string;
  fill: string;
}

const LEGEND_PAGE_SIZE = 6;

interface BreakdownChartLegendProps {
  budgetItems: BreakdownLegendItem[];
  categoryItems: BreakdownLegendItem[];
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
  className?: string;
}

interface LegendSectionProps {
  title: string;
  items: BreakdownLegendItem[];
  page: number;
  onPageChange: (page: number) => void;
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
}

function pageCountFor(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / LEGEND_PAGE_SIZE));
}

function clampPage(page: number, itemCount: number): number {
  return Math.min(page, pageCountFor(itemCount) - 1);
}

function LegendItemButton({
  item,
  selectedSegments,
  onToggleSegment,
}: {
  item: BreakdownLegendItem;
  selectedSegments: string[];
  onToggleSegment: (segmentKey: string) => void;
}) {
  const hasSelection = selectedSegments.length > 0;
  const isSelected = selectedSegments.includes(item.segmentKey);

  return (
    <button
      type="button"
      className={`flex min-h-[44px] w-full min-w-0 items-start gap-2 rounded-lg px-1 pt-1.5 text-start outline-none focus:outline-none transition-opacity ${
        hasSelection && !isSelected ? 'opacity-40' : 'opacity-100'
      }`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onToggleSegment(item.segmentKey)}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: item.fill }}
        aria-hidden
      />
      <span className="whitespace-normal break-words leading-tight text-sm text-slate-800 dark:text-slate-100">
        {item.label}
      </span>
    </button>
  );
}

function LegendSection({
  title,
  items,
  page,
  onPageChange,
  selectedSegments,
  onToggleSegment,
}: LegendSectionProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  const pageCount = pageCountFor(items.length);
  const currentPage = clampPage(page, items.length);
  const pageStart = currentPage * LEGEND_PAGE_SIZE;
  const visibleItems = items.slice(pageStart, pageStart + LEGEND_PAGE_SIZE);
  const showArrows = pageCount > 1;

  const cyclePage = (delta: number) => {
    onPageChange((currentPage + delta + pageCount) % pageCount);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div
        dir="ltr"
        className="grid w-full grid-cols-[44px_1fr_44px] items-center"
      >
        {showArrows ? (
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 outline-none hover:text-slate-800 focus:outline-none dark:text-slate-400 dark:hover:text-slate-100"
            aria-label={t('overview.legendPrevPage')}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => cyclePage(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
        <h3 className="truncate text-center text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {showArrows ? (
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 outline-none hover:text-slate-800 focus:outline-none dark:text-slate-400 dark:hover:text-slate-100"
            aria-label={t('overview.legendNextPage')}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => cyclePage(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </div>
      <div className="mb-1 w-full border-b border-slate-200 dark:border-slate-700" />
      <div className="grid h-auto min-h-0 grid-cols-2 auto-rows-min gap-y-1">
        {visibleItems.map((item) => (
          <LegendItemButton
            key={item.segmentKey}
            item={item}
            selectedSegments={selectedSegments}
            onToggleSegment={onToggleSegment}
          />
        ))}
      </div>
    </section>
  );
}

export function BreakdownChartLegend({
  budgetItems,
  categoryItems,
  selectedSegments,
  onToggleSegment,
  className = '',
}: BreakdownChartLegendProps) {
  const { t } = useTranslation();
  const [budgetsCurrentPage, setBudgetsCurrentPage] = useState(0);
  const [categoriesCurrentPage, setCategoriesCurrentPage] = useState(0);

  const clampedBudgetPage = useMemo(
    () => clampPage(budgetsCurrentPage, budgetItems.length),
    [budgetsCurrentPage, budgetItems.length],
  );
  const clampedCategoryPage = useMemo(
    () => clampPage(categoriesCurrentPage, categoryItems.length),
    [categoriesCurrentPage, categoryItems.length],
  );

  return (
    <div className={`flex w-full flex-row gap-3 ${className}`}>
      <LegendSection
        title={t('overview.breakdownBudgets')}
        items={budgetItems}
        page={clampedBudgetPage}
        onPageChange={setBudgetsCurrentPage}
        selectedSegments={selectedSegments}
        onToggleSegment={onToggleSegment}
      />
      <LegendSection
        title={t('overview.breakdownCategories')}
        items={categoryItems}
        page={clampedCategoryPage}
        onPageChange={setCategoriesCurrentPage}
        selectedSegments={selectedSegments}
        onToggleSegment={onToggleSegment}
      />
    </div>
  );
}
