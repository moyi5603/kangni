export const INTEREST_GROUP_CATEGORY_MOCK_VERSION = 2;
export const interestGroupCategoryStatuses = ['启用', '禁用'] as const;

export type InterestGroupCategoryStatus = (typeof interestGroupCategoryStatuses)[number];

export type InterestGroupCategory = {
  key: string;
  label: string;
  order: number;
  status: InterestGroupCategoryStatus;
  createdAt: string;
};

export type InterestGroupCategoryFormValues = {
  label: string;
  order?: number;
};

export const initialInterestGroupCategories: InterestGroupCategory[] = [
  { key: 'sport', label: '运动健身', order: 10, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { key: 'learning', label: '学习充电', order: 20, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { key: 'career', label: '职场成长', order: 30, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { key: 'volunteer', label: '公益志愿', order: 50, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { key: 'game', label: '桌游电竞', order: 60, status: '启用', createdAt: '2026-01-10 09:00:00' },
  { key: 'movie', label: '电影音乐', order: 70, status: '启用', createdAt: '2026-01-10 09:00:00' },
];

export function getInterestGroupCategoryLabel(key: string, categories: InterestGroupCategory[]): string {
  if (!key) return '未分类';
  return categories.find((item) => item.key === key)?.label ?? '未分类';
}

export function compareInterestGroupCategories(a: InterestGroupCategory, b: InterestGroupCategory): number {
  if (a.order !== b.order) return a.order - b.order;
  return b.createdAt.localeCompare(a.createdAt);
}

export function listEnabledInterestGroupCategories(categories: InterestGroupCategory[]): InterestGroupCategory[] {
  return categories.filter((item) => item.status === '启用').sort(compareInterestGroupCategories);
}

export function buildInterestGroupCategoryOptions(
  categories: InterestGroupCategory[],
  options: { includeUncategorized?: boolean; enabledOnly?: boolean; keepKey?: string } = {},
): { value: string; label: string }[] {
  const source = options.enabledOnly
    ? listEnabledInterestGroupCategories(categories)
    : [...categories].sort(compareInterestGroupCategories);
  const rows = [...source];
  if (options.keepKey && !rows.some((item) => item.key === options.keepKey)) {
    const kept = categories.find((item) => item.key === options.keepKey);
    if (kept) rows.push(kept);
  }
  const mapped = rows.map((item) => ({ value: item.key, label: item.label }));
  return options.includeUncategorized ? [{ value: '', label: '未分类' }, ...mapped] : mapped;
}

export function validateInterestGroupCategoryLabel(
  label: string,
  categories: InterestGroupCategory[],
  currentKey?: string,
): string | null {
  const name = label.trim();
  if (!name) return '请输入分类名称';
  if (name.length > 12) return '分类名称不超过 12 个字';
  const duplicated = categories.some((item) => item.label === name && item.key !== currentKey);
  if (duplicated) return '分类名称已存在';
  return null;
}

export function nextInterestGroupCategoryOrder(categories: InterestGroupCategory[]): number {
  if (!categories.length) return 10;
  return Math.max(...categories.map((item) => item.order)) + 10;
}

export function countInterestGroupCategoryUsage(
  key: string,
  groups: Array<{ categoryKey: string }>,
  activities: Array<{ categoryKey: string }>,
): { groupCount: number; activityCount: number } {
  return {
    groupCount: groups.filter((item) => item.categoryKey === key).length,
    activityCount: activities.filter((item) => item.categoryKey === key).length,
  };
}
