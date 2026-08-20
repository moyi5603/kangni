export const TAG_MOCK_VERSION = 1;
export const tagStatuses = ['启用', '禁用'] as const;

export type TagStatus = (typeof tagStatuses)[number];

export type ActivityTagRecord = {
  id: number;
  name: string;
  status: TagStatus;
};

export const initialTags: ActivityTagRecord[] = [
  { id: 1, name: '全员', status: '启用' },
  { id: 2, name: '自愿参加', status: '启用' },
  { id: 3, name: '限额', status: '启用' },
  { id: 4, name: '需审核', status: '启用' },
  { id: 5, name: '家属可参与', status: '禁用' },
];
