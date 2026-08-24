export const INTEREST_GROUP_ACTIVITY_MOCK_VERSION = 3;

export type InterestGroupActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
export type InterestGroupActivityType = 'once' | 'recurring' | 'series';
export type SeriesSignupMode = 'independent' | 'all';
export type DeadlineMode = 'none' | 'fixed' | 'hours_before';
export const interestGroupAuditStatuses = ['待提交', '待审核', '已通过', '已驳回', '无需审核'] as const;
export const interestGroupPublishStatuses = ['未发布', '已发布'] as const;
export type InterestGroupAuditStatus = (typeof interestGroupAuditStatuses)[number];
export type InterestGroupPublishStatus = (typeof interestGroupPublishStatuses)[number];

export const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
] as const;

export type InterestGroupActivitySession = {
  id: string;
  startAt: string;
  endAt: string;
  capacity: number;
  signedCount: number;
  status: InterestGroupActivityStatus;
};

export type InterestGroupActivity = {
  id: number;
  groupId: number | null;
  title: string;
  type: InterestGroupActivityType;
  categoryKey: string;
  coverUrl: string;
  location: string;
  hostName: string;
  capacity: number;
  signedCount: number;
  status: InterestGroupActivityStatus;
  auditStatus: InterestGroupAuditStatus;
  publishStatus: InterestGroupPublishStatus;
  publishedAt: string;
  rejectReason?: string;
  detailHtml: string;
  likeCount: number;
  startAt?: string;
  endAt?: string;
  repeatWeekdays?: number[];
  timeStart?: string;
  timeEnd?: string;
  sessions?: InterestGroupActivitySession[];
  seriesSignupMode?: SeriesSignupMode;
  deadlineMode: DeadlineMode;
  deadlineAt?: string;
  deadlineHoursBefore?: number;
  createdAt: string;
};

export type InterestGroupActivityFormValues = {
  coverUrl: string;
  title: string;
  groupId: number;
  categoryKey: string;
  type: InterestGroupActivityType;
  startAt?: string;
  endAt?: string;
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  seriesSignupMode?: SeriesSignupMode;
  sessions?: Array<{ startAt: string; endAt: string }>;
  deadlineMode: DeadlineMode;
  deadlineAt?: string;
  deadlineHoursBefore?: number;
  location: string;
  capacity: number;
  detailHtml: string;
};

export const interestGroupActivityTypeLabels: Record<InterestGroupActivityType, string> = {
  once: '单次活动',
  recurring: '周期活动',
  series: '系列活动',
};

export const interestGroupActivityStatusLabels: Record<InterestGroupActivityStatus, string> = {
  upcoming: '未开始',
  ongoing: '进行中',
  ended: '已结束',
  cancelled: '已终止',
};

export const deadlineModeLabels: Record<DeadlineMode, string> = {
  none: '不限制',
  fixed: '指定时间',
  hours_before: '开始前 N 小时',
};

export const seriesSignupModeLabels: Record<SeriesSignupMode, string> = {
  independent: '按场次报名',
  all: '整场报名',
};

export function totalSignedCount(activity: InterestGroupActivity): number {
  if (activity.sessions?.length) {
    return activity.sessions.reduce((sum, session) => sum + session.signedCount, 0);
  }
  return activity.signedCount;
}

export function activityHasOngoingStatus(activity: InterestGroupActivity): boolean {
  if (activity.status === 'ongoing') return true;
  return (activity.sessions ?? []).some((session) => session.status === 'ongoing');
}

export function groupHasOngoingActivity(groupId: number, activities: InterestGroupActivity[]): boolean {
  return activities.some((activity) => activity.groupId === groupId && activityHasOngoingStatus(activity));
}

export function countGroupActivities(groupId: number, activities: InterestGroupActivity[]): number {
  return activities.filter((activity) => activity.groupId === groupId).length;
}

export function canDeleteInterestGroupActivity(activity: InterestGroupActivity): boolean {
  return totalSignedCount(activity) === 0;
}

export function canTerminateInterestGroupActivity(activity: InterestGroupActivity): boolean {
  if (activity.status === 'cancelled' || activity.status === 'ended' || activity.status === 'ongoing') return false;
  if (activity.status === 'upcoming') return true;
  return (activity.sessions ?? []).some((session) => session.status === 'upcoming');
}

export function canEditInterestGroupActivity(activity: InterestGroupActivity): boolean {
  return activity.status === 'upcoming' || activity.status === 'ongoing';
}

export function canPublishInterestGroupActivity(activity: Pick<InterestGroupActivity, 'auditStatus'>): boolean {
  return activity.auditStatus === '已通过' || activity.auditStatus === '无需审核';
}

export function canSubmitInterestGroupActivity(activity: Pick<InterestGroupActivity, 'auditStatus'>): boolean {
  return activity.auditStatus === '待提交' || activity.auditStatus === '已驳回';
}

export function canReviewInterestGroupActivity(activity: Pick<InterestGroupActivity, 'auditStatus'>): boolean {
  return activity.auditStatus === '待审核';
}

export function formatInterestGroupPublishedAt(value: string) {
  return value || '—';
}

export function displayInterestGroupActivityStatus(activity: InterestGroupActivity): string {
  if (activity.status === 'cancelled') return '已终止';
  if (activity.status === 'ended') return '已结束';
  if (activity.status !== 'cancelled' && activity.status !== 'ended' && activity.signedCount >= activity.capacity) {
    return '已满员';
  }
  if (activity.status === 'ongoing') return '进行中';
  return '报名中';
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((item) => item.value === value)?.label ?? `周${value}`;
}

export function formatInterestGroupActivityTime(activity: InterestGroupActivity): { date: string; time: string } {
  if (activity.type === 'recurring') {
    const days = (activity.repeatWeekdays ?? []).map(weekdayLabel).join('、');
    return { date: days ? `每${days}` : '周期活动', time: `${activity.timeStart ?? ''} - ${activity.timeEnd ?? ''}`.trim() };
  }
  if (activity.type === 'series') {
    const count = activity.sessions?.length ?? 0;
    const first = activity.sessions?.[0]?.startAt ?? '';
    return { date: first ? first.slice(0, 10) : '系列活动', time: `共 ${count} 期` };
  }
  return {
    date: activity.startAt?.slice(0, 10) ?? '—',
    time: activity.startAt && activity.endAt ? `${activity.startAt.slice(11, 16)} - ${activity.endAt.slice(11, 16)}` : '—',
  };
}

export function formatDeadline(activity: InterestGroupActivity): string {
  if (activity.deadlineMode === 'fixed' && activity.deadlineAt) return activity.deadlineAt;
  if (activity.deadlineMode === 'hours_before' && activity.deadlineHoursBefore != null) {
    return `开始前 ${activity.deadlineHoursBefore} 小时`;
  }
  return '活动开始前均可报名';
}

export function generateInterestGroupActivityIntro(input: {
  title: string;
  categoryKey: string;
  location: string;
}): string {
  const title = input.title.trim() || '本次活动';
  const loc = input.location.trim() || '详见通知';
  const samples: Record<string, string> = {
    sport: `<p>欢迎参加 <b>${title}</b>。</p><ul><li>集合地点：${loc}</li><li>请穿运动服与防滑鞋，建议自带水壶</li><li>热身约 10 分钟，零基础有领队陪同</li></ul>`,
    learning: `<p>本期 <b>${title}</b>。</p><ul><li>地点：${loc}</li><li>请提前阅读指定章节，现场轮流分享</li><li>轻松讨论，不打卡、不焦虑</li></ul>`,
    career: `<p>职场主题 <b>${title}</b>。</p><ul><li>地点：${loc}</li><li>围绕真实案例讨论</li><li>欢迎带问题进场</li></ul>`,
    game: `<p><b>${title}</b> 开局。</p><ul><li>地点：${loc}</li><li>新手有教学</li><li>快乐第一</li></ul>`,
    movie: `<p>一起参加 <b>${title}</b>。</p><ul><li>集合：${loc}</li><li>可拼车同行</li></ul>`,
    volunteer: `<p>公益活动 <b>${title}</b>。</p><ul><li>集合：${loc}</li><li>请准时到场</li></ul>`,
  };
  return samples[input.categoryKey] ?? `<p>欢迎参加 <b>${title}</b>，集合地点：${loc}。</p>`;
}

export function validateInterestGroupActivityForm(values: InterestGroupActivityFormValues, isCreate: boolean): string | null {
  if (isCreate && !values.coverUrl.trim()) return '请上传封面图';
  if (!values.title.trim()) return '请输入活动标题';
  if (values.title.trim().length > 60) return '活动标题不能超过 60 字';
  if (!values.groupId) return '请选择所属小组';
  if (!values.capacity || values.capacity < 1) return '请输入人数上限';
  if (values.type === 'once') {
    if (!values.startAt || !values.endAt) return '请填写开始和结束时间';
    if (values.endAt.slice(0, 10) < values.startAt.slice(0, 10)) return '结束日期不能早于开始日期';
  }
  if (values.type === 'recurring') {
    if (values.repeatWeekday == null) return '请选择重复的周几';
    if (!values.timeStart || !values.timeEnd) return '请填写每日时段';
  }
  if (values.type === 'series') {
    if (!values.sessions?.length) return '请至少添加一场';
    if (values.sessions.some((session) => !session.startAt || !session.endAt)) return '请完善每一场的时间';
  }
  if (values.deadlineMode === 'fixed' && !values.deadlineAt) return '请选择报名截止时间';
  if (values.deadlineMode === 'hours_before' && (values.deadlineHoursBefore == null || values.deadlineHoursBefore < 1)) {
    return '请填写开始前小时数';
  }
  return null;
}

export const initialInterestGroupActivities: InterestGroupActivity[] = [
  {
    id: 101,
    groupId: 1,
    title: '滨江 8K 夜跑 · 江风配速团',
    type: 'recurring',
    categoryKey: 'sport',
    coverUrl: '/activities/basketball.jpg',
    location: '滨江园区南门集合',
    hostName: '张悦',
    capacity: 40,
    signedCount: 27,
    status: 'upcoming',
    detailHtml: '<p>沿滨江绿道往返 8 公里，按配速分组。</p>',
    likeCount: 86,
    repeatWeekdays: [4],
    timeStart: '19:30',
    timeEnd: '21:00',
    sessions: [
      {
        id: '101-s1',
        startAt: '2026-06-12 19:30',
        endAt: '2026-06-12 21:00',
        capacity: 40,
        signedCount: 27,
        status: 'upcoming',
      },
    ],
    deadlineMode: 'hours_before',
    deadlineHoursBefore: 2,
    createdAt: '2026-05-20 10:00:00',
    auditStatus: '已通过',
    publishStatus: '已发布',
    publishedAt: '2026-05-20 10:30:00',
  },
  {
    id: 102,
    groupId: 1,
    title: '初夏城市漫步',
    type: 'once',
    categoryKey: 'sport',
    coverUrl: '/activities/share.jpg',
    location: '滨江步道南门',
    hostName: '张悦',
    capacity: 30,
    signedCount: 28,
    status: 'ended',
    detailHtml: '<p>初夏傍晚滨江漫步。</p>',
    likeCount: 12,
    startAt: '2026-06-01 17:00',
    endAt: '2026-06-01 19:00',
    deadlineMode: 'none',
    createdAt: '2026-05-10 09:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-05-10 09:20:00',
  },
  {
    id: 201,
    groupId: 2,
    title: '周末连营徒步',
    type: 'recurring',
    categoryKey: 'sport',
    coverUrl: '/activities/onboarding.jpg',
    location: '近郊 · 云栖谷营地',
    hostName: '陈产品',
    capacity: 24,
    signedCount: 18,
    status: 'ongoing',
    detailHtml: '<p>连续徒步连营。</p>',
    likeCount: 21,
    repeatWeekdays: [2],
    timeStart: '18:00',
    timeEnd: '16:00',
    sessions: [
      {
        id: '201-s0',
        startAt: '2026-06-02 18:00',
        endAt: '2026-06-04 16:00',
        capacity: 24,
        signedCount: 18,
        status: 'ongoing',
      },
      {
        id: '201-s1',
        startAt: '2026-06-09 18:00',
        endAt: '2026-06-11 16:00',
        capacity: 24,
        signedCount: 10,
        status: 'upcoming',
      },
    ],
    deadlineMode: 'none',
    createdAt: '2026-05-01 11:00:00',
    auditStatus: '已通过',
    publishStatus: '已发布',
    publishedAt: '2026-05-01 11:20:00',
  },
  {
    id: 301,
    groupId: 3,
    title: '周一晚共读 · 固定围读局',
    type: 'once',
    categoryKey: 'learning',
    coverUrl: '/activities/webinar.jpg',
    location: '三楼书吧',
    hostName: '王芳',
    capacity: 18,
    signedCount: 12,
    status: 'upcoming',
    detailHtml: '<p>每周一晚围读。</p>',
    likeCount: 29,
    startAt: '2026-06-16 19:00',
    endAt: '2026-06-16 20:00',
    deadlineMode: 'none',
    createdAt: '2026-06-01 08:00:00',
    auditStatus: '待审核',
    publishStatus: '未发布',
    publishedAt: '',
  },
  {
    id: 401,
    groupId: 4,
    title: '周五狼人杀局',
    type: 'once',
    categoryKey: 'game',
    coverUrl: '/activities/open-day.jpg',
    location: '总部休闲区',
    hostName: '黄码',
    capacity: 12,
    signedCount: 0,
    status: 'cancelled',
    detailHtml: '<p>已终止的桌游局。</p>',
    likeCount: 0,
    startAt: '2026-06-06 19:30',
    endAt: '2026-06-06 22:00',
    deadlineMode: 'none',
    createdAt: '2026-06-01 12:00:00',
    auditStatus: '已驳回',
    publishStatus: '未发布',
    publishedAt: '',
    rejectReason: '场次与园区占用冲突，请改期后再提交。',
  },
  {
    id: 501,
    groupId: 3,
    title: '夏季共读三期',
    type: 'series',
    categoryKey: 'learning',
    coverUrl: '/activities/webinar.jpg',
    location: '三楼书吧',
    hostName: '王芳',
    capacity: 18,
    signedCount: 8,
    status: 'upcoming',
    detailHtml: '<p>三期共读系列。</p>',
    likeCount: 6,
    seriesSignupMode: 'independent',
    sessions: [
      { id: '501-s1', startAt: '2026-06-20 19:00', endAt: '2026-06-20 21:00', capacity: 18, signedCount: 8, status: 'upcoming' },
      { id: '501-s2', startAt: '2026-06-27 19:00', endAt: '2026-06-27 21:00', capacity: 18, signedCount: 4, status: 'upcoming' },
      { id: '501-s3', startAt: '2026-07-04 19:00', endAt: '2026-07-04 21:00', capacity: 18, signedCount: 2, status: 'upcoming' },
    ],
    deadlineMode: 'fixed',
    deadlineAt: '2026-06-19 18:00',
    createdAt: '2026-06-05 10:00:00',
    auditStatus: '已通过',
    publishStatus: '未发布',
    publishedAt: '',
  },
];
