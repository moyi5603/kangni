import type { ApprovalNode } from '../../activities/model/rules';
import {
  formatActivityScheduleTime,
  formatScheduleSignupTime,
  validateActivitySchedule,
  type ActivityScheduleType,
} from '../../activities/model/activitySchedule';
import {
  activityStatuses,
  lifecycleStatusColor,
  lifecycleStatuses,
  type LifecycleStatus,
  type Visibility,
} from '../../activities/model/activity';
import { defaultSignupFields, type SignupField } from '../../activities/model/signupFields';

export const INTEREST_GROUP_ACTIVITY_MOCK_VERSION = 4;

export type InterestGroupActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
export type InterestGroupActivityType = ActivityScheduleType;
export const interestGroupAuditStatuses = ['待提交', '待审核', '已通过', '已驳回', '无需审核'] as const;
export const interestGroupPublishStatuses = ['未发布', '已发布'] as const;
export const interestGroupLifecycleStatuses = lifecycleStatuses;
export type InterestGroupAuditStatus = (typeof interestGroupAuditStatuses)[number];
export type InterestGroupPublishStatus = (typeof interestGroupPublishStatuses)[number];
export type InterestGroupActivityStatusLabel = (typeof activityStatuses)[number];

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
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  cycleStart?: string;
  cycleEnd?: string;
  sessions: InterestGroupActivitySession[];
  signupStartAt: string;
  signupEndAt: string;
  signupHoursBefore?: number;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  importFileName: string;
  importedPeople: string[];
  notifyOnPublish: boolean;
  needAudit: boolean;
  minSeniorityYears?: number;
  signupApprovalNodes: ApprovalNode[];
  signupFields: SignupField[];
  signupPoints: number;
  signupPointsEnabled: boolean;
  pinned: boolean;
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
  cycleStart?: string;
  cycleEnd?: string;
  sessions?: Array<{ startAt: string; endAt: string }>;
  signupStartAt: string;
  signupEndAt: string;
  signupHoursBefore?: number;
  location: string;
  capacity: number;
  detailHtml: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  importFileName: string;
  importedPeople: string[];
  notifyOnPublish: boolean;
  needAudit: boolean;
  minSeniorityYears?: number;
  signupApprovalNodes: ApprovalNode[];
  signupFields: SignupField[];
  signupPoints: number;
  signupPointsEnabled: boolean;
};

export { activityScheduleTypeLabels as interestGroupActivityTypeLabels } from '../../activities/model/activitySchedule';
export { lifecycleStatusColor, lifecycleStatuses };

export const interestGroupActivityStatusLabels: Record<InterestGroupActivityStatus, string> = {
  upcoming: '未开始',
  ongoing: '进行中',
  ended: '已结束',
  cancelled: '已结束',
};

export function igActivityAlignDefaults(): Pick<
  InterestGroupActivity,
  | 'sessions'
  | 'signupStartAt'
  | 'signupEndAt'
  | 'signupHoursBefore'
  | 'visibility'
  | 'departments'
  | 'customPeople'
  | 'importFileName'
  | 'importedPeople'
  | 'notifyOnPublish'
  | 'needAudit'
  | 'signupApprovalNodes'
  | 'signupFields'
  | 'signupPoints'
  | 'signupPointsEnabled'
  | 'pinned'
> {
  return {
    sessions: [],
    signupStartAt: '2026-05-01 09:00',
    signupEndAt: '2026-06-30 18:00',
    signupHoursBefore: 0,
    visibility: '全员',
    departments: [],
    customPeople: [],
    importFileName: '',
    importedPeople: [],
    notifyOnPublish: false,
    needAudit: false,
    signupApprovalNodes: [],
    signupFields: defaultSignupFields(),
    signupPoints: 1,
    signupPointsEnabled: false,
    pinned: false,
  };
}

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

export function getInterestGroupLifecycleStatus(
  activity: Pick<InterestGroupActivity, 'publishStatus' | 'status'>,
): LifecycleStatus {
  if (activity.publishStatus !== '已发布') return '未发布';
  if (activity.status === 'cancelled' || activity.status === 'ended') return '已结束';
  if (activity.status === 'ongoing') return '进行中';
  return '未开始';
}

export function formatInterestGroupPublishedAt(value: string) {
  return value || '—';
}

export function formatInterestGroupActivityTime(activity: InterestGroupActivity): string {
  return formatActivityScheduleTime({
    scheduleType: activity.type,
    startAt: activity.startAt ?? '',
    endAt: activity.endAt ?? '',
    repeatWeekday: activity.repeatWeekday,
    timeStart: activity.timeStart,
    timeEnd: activity.timeEnd,
    cycleStart: activity.cycleStart,
    cycleEnd: activity.cycleEnd,
    sessions: (activity.sessions ?? []).map(({ id, startAt, endAt }) => ({ id, startAt, endAt })),
  });
}

export function formatInterestGroupSignupTime(activity: InterestGroupActivity): string {
  return formatScheduleSignupTime({
    scheduleType: activity.type,
    signupStartAt: activity.signupStartAt,
    signupEndAt: activity.signupEndAt,
    signupHoursBefore: activity.signupHoursBefore,
  });
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((item) => item.value === value)?.label ?? `周${value}`;
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

export function validateInterestGroupActivityForm(values: InterestGroupActivityFormValues, _isCreate: boolean): string | null {
  if (!values.coverUrl.trim()) return '请上传封面图片';
  if (!values.title.trim()) return '请输入活动标题';
  if (values.title.trim().length > 20) return '活动标题不超过 20 个字';
  if (!values.groupId) return '请选择所属小组';
  if (!values.categoryKey) return '请选择分类';
  if (!values.detailHtml.trim()) return '请填写活动详情';
  if (!values.capacity || values.capacity < 1) return '请输入人数上限';
  if (!values.visibility) return '请选择可见范围';
  if (!values.signupStartAt) return '请选择报名开始时间';
  if (values.type === 'once') {
    if (!values.startAt || !values.endAt) return '请填写开始和结束时间';
    if (!values.signupEndAt) return '请选择报名时间';
  }
  const scheduleError = validateActivitySchedule({
    scheduleType: values.type,
    repeatWeekday: values.repeatWeekday,
    timeStart: values.timeStart,
    timeEnd: values.timeEnd,
    cycleStart: values.cycleStart,
    cycleEnd: values.cycleEnd,
    sessions: (values.sessions ?? []).map((session, index) => ({
      id: `draft-${index}`,
      startAt: session.startAt,
      endAt: session.endAt,
    })),
  });
  if (scheduleError) return scheduleError;
  if ((values.type === 'recurring' || values.type === 'series') && values.signupHoursBefore == null) {
    return '请填写开场前小时数';
  }
  return null;
}

export const initialInterestGroupActivities: InterestGroupActivity[] = [
  {
    ...igActivityAlignDefaults(),
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
    repeatWeekday: 4,
    timeStart: '19:30',
    timeEnd: '21:00',
    cycleStart: '2026-06-01',
    cycleEnd: '2026-06-30',
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
    signupHoursBefore: 2,
    createdAt: '2026-05-20 10:00:00',
    auditStatus: '已通过',
    publishStatus: '已发布',
    publishedAt: '2026-05-20 10:30:00',
  },
  {
    ...igActivityAlignDefaults(),
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
    sessions: [],
    signupStartAt: '2026-05-10 09:00',
    signupEndAt: '2026-05-31 18:00',
    createdAt: '2026-05-10 09:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-05-10 09:20:00',
  },
  {
    ...igActivityAlignDefaults(),
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
    repeatWeekday: 2,
    timeStart: '18:00',
    timeEnd: '16:00',
    cycleStart: '2026-06-02',
    cycleEnd: '2026-06-11',
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
    createdAt: '2026-05-01 11:00:00',
    auditStatus: '已通过',
    publishStatus: '已发布',
    publishedAt: '2026-05-01 11:20:00',
  },
  {
    ...igActivityAlignDefaults(),
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
    sessions: [],
    signupStartAt: '2026-06-01 08:00',
    signupEndAt: '2026-06-16 18:00',
    createdAt: '2026-06-01 08:00:00',
    auditStatus: '待审核',
    publishStatus: '未发布',
    publishedAt: '',
  },
  {
    ...igActivityAlignDefaults(),
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
    sessions: [],
    createdAt: '2026-06-01 12:00:00',
    auditStatus: '已驳回',
    publishStatus: '未发布',
    publishedAt: '',
    rejectReason: '场次与园区占用冲突，请改期后再提交。',
  },
  {
    ...igActivityAlignDefaults(),
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
    sessions: [
      { id: '501-s1', startAt: '2026-06-20 19:00', endAt: '2026-06-20 21:00', capacity: 18, signedCount: 8, status: 'upcoming' },
      { id: '501-s2', startAt: '2026-06-27 19:00', endAt: '2026-06-27 21:00', capacity: 18, signedCount: 4, status: 'upcoming' },
      { id: '501-s3', startAt: '2026-07-04 19:00', endAt: '2026-07-04 21:00', capacity: 18, signedCount: 2, status: 'upcoming' },
    ],
    signupStartAt: '2026-06-05 10:00',
    signupHoursBefore: 24,
    createdAt: '2026-06-05 10:00:00',
    auditStatus: '已通过',
    publishStatus: '未发布',
    publishedAt: '',
  },
];
