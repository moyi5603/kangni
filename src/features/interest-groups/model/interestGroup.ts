export const INTEREST_GROUP_MOCK_VERSION = 12;

export type InterestGroupJoinMode = 'free' | 'approve';
export type InterestGroupSource = 'admin' | 'employee';
export const interestGroupEntityAuditStatuses = ['待审核', '已通过', '已驳回', '无需审核'] as const;
export type InterestGroupEntityAuditStatus = (typeof interestGroupEntityAuditStatuses)[number];
export type InterestGroupPublishStatus = '未发布' | '已发布';

export const interestGroupEntityAuditStatusColor: Record<InterestGroupEntityAuditStatus, string> = {
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
  无需审核: 'default',
};

export type InterestGroup = {
  id: number;
  name: string;
  categoryKey: string;
  leadName: string;
  leadEmployeeIds: string[];
  memberCount: number;
  activityCount: number;
  joinMode: InterestGroupJoinMode;
  intro: string;
  tags: string[];
  area: string;
  coverUrl: string;
  createdAt: string;
  source: InterestGroupSource;
  auditStatus: InterestGroupEntityAuditStatus;
  publishStatus: InterestGroupPublishStatus;
  rejectReason?: string;
  pinned: boolean;
  sortIndex: number;
};

export function canReviewInterestGroup(group: Pick<InterestGroup, 'auditStatus'>): boolean {
  return group.auditStatus === '待审核';
}

export function canPublishInterestGroup(group: Pick<InterestGroup, 'publishStatus'>): boolean {
  return group.publishStatus !== '已发布';
}

export function canRevokeInterestGroup(group: Pick<InterestGroup, 'publishStatus'>): boolean {
  return group.publishStatus === '已发布';
}

export const interestGroupJoinModeLabels: Record<InterestGroupJoinMode, string> = {
  free: '自由加入',
  approve: '审核加入',
};

export type InterestGroupFormValues = {
  name: string;
  categoryKey: string;
  leadEmployeeIds: string[];
  joinMode: InterestGroupJoinMode;
  intro: string;
  coverUrl: string;
};

export function normalizeInterestGroupLeadIds(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    const value = id.trim();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function formatInterestGroupLeadName(ids: string[]): string {
  return normalizeInterestGroupLeadIds(ids).join('、');
}

export function isInterestGroupLead(
  group: Pick<InterestGroup, 'leadEmployeeIds' | 'leadName'>,
  viewer: string,
): boolean {
  if (group.leadEmployeeIds.includes(viewer)) return true;
  return group.leadName.split('、').includes(viewer);
}

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
  if (!values.name.trim()) return '请输入兴趣圈名称';
  if (values.name.trim().length > 40) return '兴趣圈名称不能超过 40 字';
  if (!normalizeInterestGroupLeadIds(values.leadEmployeeIds).length) return '请选择兴趣圈负责人';
  if (isCreate && !values.coverUrl.trim()) return '请上传封面图';
  if (values.intro.length > 500) return '兴趣圈简介不能超过 500 字';
  return null;
}

const seedInterestGroups: Omit<InterestGroup, 'pinned' | 'sortIndex'>[] = [
  {
    id: 1,
    name: '城市夜跑团',
    categoryKey: 'sport',
    leadName: '张悦',
    leadEmployeeIds: ['张悦'],
    memberCount: 128,
    activityCount: 2,
    joinMode: 'free',
    intro: '下班后甩开屏幕，用脚步丈量城市。我们按配速分组，从 6′30″ 到 5′00″ 都有搭子。',
    tags: ['每周三场', '零基础友好'],
    area: '总部 · 滨江园区',
    coverUrl: '/activities/basketball.jpg',
    createdAt: '2026-06-01 10:00:00',
    source: 'admin',
    auditStatus: '无需审核',
    publishStatus: '已发布',
  },
  {
    id: 2,
    name: '周末徒步野行',
    categoryKey: 'sport',
    leadName: '陈产品',
    leadEmployeeIds: ['陈产品'],
    memberCount: 96,
    activityCount: 1,
    joinMode: 'free',
    intro: '逃离工位，走进山野。每月 2-3 条线路，领队持证、全程保障。',
    tags: ['周末出行', '装备互助'],
    area: '近郊 · 多线路',
    coverUrl: '/activities/onboarding.jpg',
    createdAt: '2026-06-03 14:20:00',
    source: 'admin',
    auditStatus: '无需审核',
    publishStatus: '已发布',
  },
  {
    id: 3,
    name: '深夜读书会',
    categoryKey: 'learning',
    leadName: '王芳',
    leadEmployeeIds: ['王芳'],
    memberCount: 65,
    activityCount: 1,
    joinMode: 'free',
    intro: '一本书、一杯茶、一群不催进度的人。每期共读一本，线下围读 + 自由发言。',
    tags: ['双周一次', '主题共读'],
    area: '总部 · 三楼书吧',
    coverUrl: '/activities/webinar.jpg',
    createdAt: '2026-06-05 09:30:00',
    source: 'admin',
    auditStatus: '无需审核',
    publishStatus: '已发布',
  },
  {
    id: 4,
    name: '桌游电竞局',
    categoryKey: 'game',
    leadName: '黄码、吴检',
    leadEmployeeIds: ['黄码', '吴检'],
    memberCount: 143,
    activityCount: 1,
    joinMode: 'free',
    intro: '桌游电竞局欢迎所有想玩的人来坐一坐。剧本杀、阿瓦隆、狼人杀、德式桌游、休闲卡牌和五黑排位都能开，午休半小时可以来一局快杀，下班后也能留下来打长本。新手有人带教学，老玩家也能找到同水平对手。场地在总部休闲区，零食饮料可自备或现场拼单。我们不卷段位、不嘲讽菜鸡，快乐第一、胜负其次。想开局就在群里喊一声，凑齐人立刻开始，错过这周还有下周固定局。欢迎带同事和朋友一起来，人多更好玩。随时都有空位，等你入座。',
    tags: ['每周开局', '新手教学'],
    area: '总部 · 休闲区',
    coverUrl: '/activities/open-day.jpg',
    createdAt: '2026-06-08 16:00:00',
    source: 'admin',
    auditStatus: '无需审核',
    publishStatus: '已发布',
  },
  {
    id: 5,
    name: '午休飞盘局',
    categoryKey: 'sport',
    leadName: '林浅',
    leadEmployeeIds: ['林浅'],
    memberCount: 1,
    activityCount: 0,
    joinMode: 'free',
    intro: '午休 30 分钟飞盘局，员工从 C 端发起，待管理员审核后对全员可见。',
    tags: ['午休', '新手友好'],
    area: '总部 · 草坪',
    coverUrl: '/activities/share.jpg',
    createdAt: '2026-08-20 12:10:00',
    source: 'employee',
    auditStatus: '待审核',
    publishStatus: '未发布',
  },
  {
    id: 6,
    name: '午间拉伸站',
    categoryKey: 'sport',
    leadName: '林浅',
    leadEmployeeIds: ['林浅'],
    memberCount: 8,
    activityCount: 2,
    joinMode: 'free',
    intro: '工位边拉伸，员工创建后已通过审核。',
    tags: ['午休', '拉伸'],
    area: '总部 · 工位区',
    coverUrl: '/activities/share.jpg',
    createdAt: '2026-08-12 12:20:00',
    source: 'employee',
    auditStatus: '已通过',
    publishStatus: '已发布',
  },
  {
    id: 7,
    name: '周末胶片社',
    categoryKey: 'other',
    leadName: '林浅',
    leadEmployeeIds: ['林浅'],
    memberCount: 11,
    activityCount: 1,
    joinMode: 'free',
    intro: '冲洗、扫片、互评。不卷器材，先把一卷拍完。',
    tags: ['胶片', '周末'],
    area: '总部 · 暗房角落',
    coverUrl: '/activities/open-day.jpg',
    createdAt: '2026-08-15 19:00:00',
    source: 'employee',
    auditStatus: '已通过',
    publishStatus: '已发布',
  },
];

export const initialInterestGroups: InterestGroup[] = seedInterestGroups.map((group, index) => ({
  ...group,
  pinned: group.id === 1,
  sortIndex: group.id === 1 ? 0 : index - 1,
}));
