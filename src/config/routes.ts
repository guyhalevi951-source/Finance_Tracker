export const ROUTES = {
  dashboard: '/',
  expenses: '/expenses',
  expenseDetail: '/expenses/:id',
  profile: '/profile',
} as const;

export function expenseDetailPath(id: string): string {
  return `/expenses/${id}`;
}
