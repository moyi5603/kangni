export const CATEGORY_MOCK_VERSION = 2;
export const categoryStatuses = ['启用', '禁用'] as const;

export type CategoryStatus = (typeof categoryStatuses)[number];

export type ActivityCategoryRecord = {
  id: number;
  name: string;
  status: CategoryStatus;
};

export const initialCategories: ActivityCategoryRecord[] = [
  { id: 1, name: '文化', status: '启用' },
  { id: 2, name: '体育', status: '启用' },
  { id: 3, name: '培训', status: '启用' },
  { id: 4, name: '公益', status: '启用' },
  { id: 5, name: '团建', status: '禁用' },
  { id: 6, name: '公司活动', status: '启用' },
  { id: 7, name: '项目活动', status: '启用' },
  { id: 8, name: '疗休养活动', status: '启用' },
  { id: 9, name: '体检活动', status: '启用' },
];
