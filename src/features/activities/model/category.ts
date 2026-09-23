export const CATEGORY_MOCK_VERSION = 3;
export const categoryStatuses = ['启用', '禁用'] as const;

export type CategoryStatus = (typeof categoryStatuses)[number];

export type ActivityCategoryRecord = {
  id: number;
  name: string;
  order: number;
  status: CategoryStatus;
  createdAt: string;
};

export type ActivityCategoryFormValues = {
  name: string;
  order?: number;
};

export const initialCategories: ActivityCategoryRecord[] = [
  { id: 1, name: '文化', order: 10, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 2, name: '体育', order: 20, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 3, name: '培训', order: 30, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 4, name: '公益', order: 40, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 5, name: '团建', order: 50, status: '禁用', createdAt: '2026-01-10 09:00:00' },
  { id: 6, name: '公司活动', order: 60, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 7, name: '项目活动', order: 70, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 8, name: '疗休养活动', order: 80, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { id: 9, name: '体检活动', order: 90, status: '启用', createdAt: '2026-01-10 09:00:00' },
];

export function compareActivityCategories(a: ActivityCategoryRecord, b: ActivityCategoryRecord): number {
  if (a.order !== b.order) return a.order - b.order;
  return b.createdAt.localeCompare(a.createdAt);
}

export function validateActivityCategoryName(
  name: string,
  categories: ActivityCategoryRecord[],
  currentId?: number,
): string | null {
  const label = name.trim();
  if (!label) return '请输入分类名称';
  if (label.length > 12) return '分类名称不超过 12 个字';
  const duplicated = categories.some((item) => item.name === label && item.id !== currentId);
  if (duplicated) return '分类名称已存在';
  return null;
}

export function nextActivityCategoryOrder(categories: ActivityCategoryRecord[]): number {
  if (!categories.length) return 10;
  return Math.max(...categories.map((item) => item.order)) + 10;
}

export function countActivityCategoryUsage(name: string, activities: Array<{ category: string }>): number {
  return activities.filter((item) => item.category === name).length;
}
