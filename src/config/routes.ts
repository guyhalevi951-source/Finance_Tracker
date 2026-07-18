export const ROUTES = {
  dashboard: '/',
  expenses: '/expenses',
  expenseDetail: '/expenses/:id',
  profile: '/profile',
  categoryManagement: '/settings/categories',
  categoryCreate: '/settings/categories/new',
  categoryEdit: '/settings/categories/:id/edit',
  categorySubManagement: '/settings/categories/:mainId/subcategories',
  categorySubCreate: '/settings/categories/:mainId/subcategories/new',
  categorySubEdit: '/settings/categories/:mainId/subcategories/:subId/edit',
} as const;

export function expenseDetailPath(id: string): string {
  return `/expenses/${id}`;
}

export function categoryEditPath(id: string): string {
  return `/settings/categories/${id}/edit`;
}

export function categorySubManagementPath(mainId: string): string {
  return `/settings/categories/${mainId}/subcategories`;
}

export function categorySubCreatePath(mainId: string): string {
  return `/settings/categories/${mainId}/subcategories/new`;
}

export function categorySubEditPath(mainId: string, subId: string): string {
  return `/settings/categories/${mainId}/subcategories/${subId}/edit`;
}
