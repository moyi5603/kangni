export const INTEREST_GROUP_MOCK_VERSION = 3;

export type InterestGroupJoinMode = 'free' | 'approve';

export type InterestGroup = {
  id: number;
  name: string;
  categoryKey: string;
  leadName: string;
  leadEmployeeId: string;
  memberCount: number;
  activityCount: number;
  joinMode: InterestGroupJoinMode;
  intro: string;
  tags: string[];
  area: string;
  coverUrl: string;
  createdAt: string;
};

export const interestGroupJoinModeLabels: Record<InterestGroupJoinMode, string> = {
  free: '自由加入',
  approve: '审核加入',
};

export type InterestGroupFormValues = {
  name: string;
  categoryKey: string;
  leadEmployeeId: string;
  joinMode: InterestGroupJoinMode;
  area: string;
  tags: string[];
  intro: string;
  coverUrl: string;
};

export function normalizeInterestGroupTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag || tag.length > 12 || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    })
    .slice(0, 8);
}

export function validateInterestGroupForm(values: InterestGroupFormValues, isCreate: boolean): string | null {
  if (!values.name.trim()) return '请输入小组名称';
  if (values.name.trim().length > 40) return '小组名称不能超过 40 字';
  if (!values.leadEmployeeId) return '请选择小组负责人';
  if (isCreate && !values.coverUrl.trim()) return '请上传封面图';
  if (values.area.length > 60) return '活动区域不能超过 60 字';
  if (values.intro.length > 500) return '小组简介不能超过 500 字';
  return null;
}

export const initialInterestGroups: InterestGroup[] = [
  {
    id: 1,
    name: '城市夜跑团',
    categoryKey: 'sport',
    leadName: '张悦',
    leadEmployeeId: '张悦',
    memberCount: 128,
    activityCount: 2,
    joinMode: 'free',
    intro: '下班后甩开屏幕，用脚步丈量城市。我们按配速分组，从 6′30″ 到 5′00″ 都有搭子。',
    tags: ['每周三场', '零基础友好'],
    area: '总部 · 滨江园区',
    coverUrl: '/activities/basketball.jpg',
    createdAt: '2026-06-01 10:00:00',
  },
  {
    id: 2,
    name: '周末徒步野行',
    categoryKey: 'sport',
    leadName: '陈产品',
    leadEmployeeId: '陈产品',
    memberCount: 96,
    activityCount: 1,
    joinMode: 'approve',
    intro: '逃离工位，走进山野。每月 2-3 条线路，领队持证、全程保障。',
    tags: ['周末出行', '装备互助'],
    area: '近郊 · 多线路',
    coverUrl: '/activities/onboarding.jpg',
    createdAt: '2026-06-03 14:20:00',
  },
  {
    id: 3,
    name: '深夜读书会',
    categoryKey: 'learning',
    leadName: '王芳',
    leadEmployeeId: '王芳',
    memberCount: 64,
    activityCount: 1,
    joinMode: 'free',
    intro: '一本书、一杯茶、一群不催进度的人。每期共读一本，线下围读 + 自由发言。',
    tags: ['双周一次', '主题共读'],
    area: '总部 · 三楼书吧',
    coverUrl: '/activities/webinar.jpg',
    createdAt: '2026-06-05 09:30:00',
  },
  {
    id: 4,
    name: '桌游电竞局',
    categoryKey: 'game',
    leadName: '黄码',
    leadEmployeeId: '黄码',
    memberCount: 142,
    activityCount: 1,
    joinMode: 'free',
    intro: '剧本杀、阿瓦隆、狼人杀、五黑上分，午休和下班后随时开局。',
    tags: ['每周开局', '新手教学'],
    area: '总部 · 休闲区',
    coverUrl: '/activities/open-day.jpg',
    createdAt: '2026-06-08 16:00:00',
  },
];
