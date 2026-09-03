/** SSOT for semantic finance category colors (numeric values, charts, progress bars, icons). */

export const SEMANTIC_COLORS = {
  expense: {
    valueText: 'text-red-600 dark:text-red-400',
    chartActual: '#DC2626',
    chartFuture: 'rgba(239, 68, 68, 0.45)',
    progressBar: 'bg-gradient-to-r from-red-500 to-red-600',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-600 dark:text-red-400',
    tooltipCursor: 'rgba(220, 38, 38, 0.08)',
  },
  income: {
    valueText: 'text-emerald-600 dark:text-emerald-400',
    chart: '#10B981',
  },
  budget: {
    valueText: 'text-amber-500 dark:text-amber-400',
    iconText: 'text-amber-500 dark:text-amber-400',
    chart: '#F59E0B',
    progressBar: 'bg-gradient-to-r from-amber-400 to-amber-500',
    ctaGradient: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
} as const;
