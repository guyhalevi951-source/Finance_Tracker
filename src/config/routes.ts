export const ROUTES = {
  dashboard: '/',
  expenses: '/expenses',
  expenseDetail: '/expenses/:id',
} as const;

export function expenseDetailPath(id: string): string {
  return `/expenses/${id}`;
}
