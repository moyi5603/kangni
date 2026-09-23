import dayjs from 'dayjs';
import type { ApprovalNode } from '../../activities/model/rules';
import {
  coerceRepeatRules,
  formatActivityScheduleTime,
  formatScheduleSignupTime,
  generateRecurringSessions,
  syncSignupEndAt,
  validateActivitySchedule,
  type ActivityScheduleType,
  type RepeatRule,
} from '../../activities/model/activitySchedule';
import {
  activityStatuses,
  applyCloseActivitySignup,
  applyReopenActivitySignup,
  canCloseActivitySignup,
  canReopenActivitySignup,
  lifecycleStatusColor,
  lifecycleStatuses,
  type LifecycleStatus,
  type Visibility,
} from '../../activities/model/activity';
import type { SignupField } from '../../activities/model/signupFields';
import type { ActivityPointRules } from '../../activities/model/activityPointRules';
import { defaultCheckInSettings, type CheckInSettings } from '../../activities/model/activityCheckIn';

export const INTEREST_GROUP_ACTIVITY_MOCK_VERSION = 17;

export const interestGroupNotifyAudiences = ['all', 'members'] as const;
export type InterestGroupNotifyAudience = (typeof interestGroupNotifyAudiences)[number];
export const interestGroupNotifyAudienceLabels: Record<InterestGroupNotifyAudience, string> = {
  all: '全员',
  members: '兴趣圈成员',
};

export type InterestGroupActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
export type InterestGroupActivityType = ActivityScheduleType;
export const interestGroupAuditStatuses = ['待提交', '待审核', '已通过', '已驳回', '无需审核'] as const;
export const interestGroupPublishStatuses = ['未发布', '已发布'] as const;
export type InterestGroupPublishStatus = (typeof interestGroupPublishStatuses)[number];
export const interestGroupPublishStatusColor: Record<InterestGroupPublishStatus, string> = {
  未发布: 'default',
  已发布: 'success',
};
export const interestGroupLifecycleStatuses = lifecycleStatuses;
export type InterestGroupAuditStatus = (typeof interestGroupAuditStatuses)[number];
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
  checkInToken?: string;
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
  repeatRules?: RepeatRule[];
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  sessions: InterestGroupActivitySession[];
  signupStartAt: string;
  signupEndAt: string;
  signupHoursBefore?: number;
  signupClosedAt?: string;
  signupEndAtBeforeClose?: string;
  terminatedAt?: string;
  visibility: Visibility;
  departments: string[];
  customPeople: string[];
  importFileName: string;
  importedPeople: string[];
  notifyOnPublish: boolean;
  notifyAudience: InterestGroupNotifyAudience;
  needAudit: boolean;
  minSeniorityYears?: number;
  signupApprovalNodes: ApprovalNode[];
  signupFields: SignupField[];
  signupPoints: number;
  signupPointsEnabled: boolean;
  checkInEnabled: boolean;
  checkInOpenMode: CheckInSettings['checkInOpenMode'];
  checkInOpenMinutesBefore: number;
  checkInValidAfterStart: number;
  checkInValidAfterStartUnit: CheckInSettings['checkInValidAfterStartUnit'];
  checkInDynamicQr: boolean;
  checkInToken?: string;
  pinned: boolean;
  sortIndex: number;
  createdAt: string;
  creator: string;
};

export type InterestGroupActivityFormValues = {
  coverUrl: string;
  title: string;
  groupId: number;
  categoryKey: string;
  type: InterestGroupActivityType;
  startAt?: string;
  endAt?: string;
  repeatRules?: RepeatRule[];
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
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
  notifyAudience: InterestGroupNotifyAudience;
  needAudit: boolean;
  minSeniorityYears?: number;
  signupApprovalNodes: ApprovalNode[];
  signupFields: SignupField[];
  signupPoints: number;
  signupPointsEnabled: boolean;
  checkInEnabled: boolean;
  checkInOpenMode: CheckInSettings['checkInOpenMode'];
  checkInOpenMinutesBefore: number;
  checkInValidAfterStart: number;
  checkInValidAfterStartUnit: CheckInSettings['checkInValidAfterStartUnit'];
  checkInDynamicQr: boolean;
};

export { activityScheduleTypeLabels as interestGroupActivityTypeLabels } from '../../activities/model/activitySchedule';
export { lifecycleStatusColor, lifecycleStatuses };

export const interestGroupActivityStatusLabels: Record<InterestGroupActivityStatus, string> = {
  upcoming: '未开始',
  ongoing: '进行中',
  ended: '已结束',
  cancelled: '已终止',
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
  | 'notifyAudience'
  | 'needAudit'
  | 'signupApprovalNodes'
  | 'signupFields'
  | 'signupPoints'
  | 'signupPointsEnabled'
  | 'checkInEnabled'
  | 'checkInOpenMode'
  | 'checkInOpenMinutesBefore'
  | 'checkInValidAfterStart'
  | 'checkInValidAfterStartUnit'
  | 'checkInDynamicQr'
  | 'pinned'
  | 'sortIndex'
  | 'creator'
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
    notifyAudience: 'members',
    needAudit: false,
    signupApprovalNodes: [],
    signupFields: [],
    signupPoints: 1,
    signupPointsEnabled: true,
    ...defaultCheckInSettings(),
    pinned: false,
    sortIndex: 0,
    creator: '陈产品',
  };
}

export function formatInterestGroupActivityNotify(
  notifyOnPublish: boolean,
  audience: InterestGroupNotifyAudience | undefined,
): string {
  if (!notifyOnPublish) return '不发送';
  return audience === 'all' ? interestGroupNotifyAudienceLabels.all : interestGroupNotifyAudienceLabels.members;
}

export function lockInterestGroupActivityPolicy(
  values: InterestGroupActivityFormValues,
  pointRules: ActivityPointRules,
): InterestGroupActivityFormValues {
  return {
    ...values,
    visibility: '全员',
    departments: [],
    customPeople: [],
    importFileName: '',
    importedPeople: [],
    signupFields: [],
    signupPointsEnabled: true,
    signupPoints: pointRules.signupPointsMax,
    notifyAudience: 'members',
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

function igLifecycleAsActivityStatus(
  status: InterestGroupActivityStatus,
): '未开始' | '进行中' | '已结束' | '已终止' {
  if (status === 'cancelled') return '已终止';
  if (status === 'ended') return '已结束';
  if (status === 'ongoing') return '进行中';
  return '未开始';
}

function toSignupCloseFields(activity: InterestGroupActivity) {
  return {
    publishStatus: activity.publishStatus,
    activityStatus: igLifecycleAsActivityStatus(activity.status),
    scheduleType: activity.type,
    signupEndAt: activity.signupEndAt,
    signupHoursBefore: activity.signupHoursBefore,
    signupClosedAt: activity.signupClosedAt,
    signupEndAtBeforeClose: activity.signupEndAtBeforeClose,
    sessions: activity.sessions ?? [],
  };
}

export function canCloseInterestGroupSignup(activity: InterestGroupActivity, now?: dayjs.Dayjs | string): boolean {
  const clock = typeof now === 'string' ? dayjs(now) : now;
  return canCloseActivitySignup(toSignupCloseFields(activity), clock);
}

export function canReopenInterestGroupSignup(activity: InterestGroupActivity): boolean {
  return canReopenActivitySignup(toSignupCloseFields(activity));
}

export function applyCloseInterestGroupSignup(activity: InterestGroupActivity, now?: dayjs.Dayjs | string): InterestGroupActivity {
  const clock = typeof now === 'string' ? dayjs(now) : now;
  const next = applyCloseActivitySignup(toSignupCloseFields(activity), clock);
  return {
    ...activity,
    signupEndAt: next.signupEndAt,
    signupClosedAt: next.signupClosedAt,
    signupEndAtBeforeClose: next.signupEndAtBeforeClose,
  };
}

export function applyReopenInterestGroupSignup(activity: InterestGroupActivity, now?: dayjs.Dayjs | string): InterestGroupActivity {
  const clock = typeof now === 'string' ? dayjs(now) : now;
  const next = applyReopenActivitySignup(toSignupCloseFields(activity), clock);
  return {
    ...activity,
    signupEndAt: next.signupEndAt,
    signupClosedAt: next.signupClosedAt,
    signupEndAtBeforeClose: next.signupEndAtBeforeClose,
  };
}

export function canRevokeInterestGroupActivity(activity: Pick<InterestGroupActivity, 'publishStatus' | 'status'>): boolean {
  return activity.publishStatus === '已发布' && activity.status === 'upcoming';
}

export function revokeInterestGroupActivityBlockReason(
  activity: Pick<InterestGroupActivity, 'publishStatus' | 'status'>,
): string | undefined {
  if (canRevokeInterestGroupActivity(activity)) return undefined;
  if (activity.publishStatus !== '已发布') return '未发布活动无需撤销';
  if (activity.status === 'ongoing') return '进行中请使用终止活动，不能撤销发布';
  return '已结束或已终止的活动不能撤销发布';
}

export function canTerminateInterestGroupActivity(activity: InterestGroupActivity): boolean {
  if (activity.publishStatus !== '已发布') return false;
  if (activity.status === 'cancelled' || activity.status === 'ended') return false;
  if (activity.status === 'ongoing') return true;
  return (activity.sessions ?? []).some((session) => session.status === 'ongoing');
}

export function canEditInterestGroupActivity(activity: InterestGroupActivity): boolean {
  return activity.status === 'upcoming' || activity.status === 'ongoing';
}

export function getInterestGroupLifecycleStatus(
  activity: Pick<InterestGroupActivity, 'publishStatus' | 'status'>,
): LifecycleStatus {
  if (activity.publishStatus !== '已发布') return '未发布';
  if (activity.status === 'cancelled') return '已终止';
  if (activity.status === 'ended') return '已结束';
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
    repeatRules: coerceRepeatRules(activity),
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
  if (!values.groupId) return '请选择所属兴趣圈';
  if (!values.categoryKey) return '请选择分类';
  if (!values.detailHtml.trim()) return '请填写活动详情';
  if (!values.capacity || values.capacity < 1) return '请输入人数上限';
  if (!values.signupStartAt) return '请选择报名开始时间';
  if (values.type === 'once') {
    if (!values.startAt || !values.endAt) return '请填写开始和结束时间';
    if (!values.signupEndAt) return '请选择报名时间';
  }
  const scheduleError = validateActivitySchedule({
    scheduleType: values.type,
    windowStart: values.startAt,
    windowEnd: values.endAt,
    repeatRules: coerceRepeatRules(values),
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

const seedInterestGroupActivities: InterestGroupActivity[] = [
  (() => {
    const windowStart = '2026-06-04 19:30';
    const windowEnd = '2026-09-24 21:00';
    const repeatRules = [{ weekday: 4, timeStart: '19:30', timeEnd: '21:00' }];
    const generated = generateRecurringSessions({ rules: repeatRules, windowStart, windowEnd });
    const now = dayjs('2026-08-31 12:00');
    const sessions = generated.map((session, index) => {
      const ended = now.isAfter(session.endAt);
      return {
        id: index === 0 ? '101-s1' : session.id,
        startAt: session.startAt,
        endAt: session.endAt,
        capacity: 40,
        signedCount: index === 0 ? 1 : session.startAt.startsWith('2026-09-03') ? 1 : 0,
        status: (ended ? 'ended' : 'upcoming') as InterestGroupActivityStatus,
        checkInToken: `ck-101-${index === 0 ? 's1' : session.id}`,
      };
    });
    return {
      ...igActivityAlignDefaults(),
      checkInEnabled: true,
      id: 101,
      groupId: 1,
      title: '滨江 8K 夜跑 · 江风配速团',
      type: 'recurring' as const,
      categoryKey: 'sport',
      coverUrl: '/activities/basketball.jpg',
      location: '滨江园区南门集合',
      hostName: '张悦',
      capacity: 40,
      signedCount: 2,
      status: 'upcoming' as const,
      detailHtml: '<p>沿滨江绿道往返 8 公里，按配速分组。</p>',
      likeCount: 86,
      startAt: windowStart,
      endAt: windowEnd,
      repeatRules,
      sessions,
      signupHoursBefore: 2,
      signupEndAt: syncSignupEndAt(generated, 2),
      createdAt: '2026-05-20 10:00:00',
      auditStatus: '无需审核' as const,
      publishStatus: '已发布' as const,
      publishedAt: '2026-05-20 10:30:00',
    };
  })(),
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
    signedCount: 1,
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
    signedCount: 2,
    status: 'ongoing',
    detailHtml: '<p>连续徒步连营。</p>',
    likeCount: 21,
    startAt: '2026-08-31 09:00',
    endAt: '2026-09-10 16:00',
    repeatRules: [{ weekday: 2, timeStart: '18:00', timeEnd: '21:00' }],
    sessions: [
      {
        id: '201-s0',
        startAt: '2026-08-31 09:00',
        endAt: '2026-09-02 16:00',
        capacity: 24,
        signedCount: 1,
        status: 'ongoing',
      },
      {
        id: '201-s1',
        startAt: '2026-09-08 18:00',
        endAt: '2026-09-10 16:00',
        capacity: 24,
        signedCount: 1,
        status: 'upcoming',
      },
    ],
    signupStartAt: '2026-08-10 09:00',
    signupEndAt: syncSignupEndAt(
      [
        { id: '201-s0', startAt: '2026-08-31 09:00', endAt: '2026-09-02 16:00' },
        { id: '201-s1', startAt: '2026-09-08 18:00', endAt: '2026-09-10 16:00' },
      ],
      0,
    ),
    createdAt: '2026-05-01 11:00:00',
    auditStatus: '无需审核',
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
    signedCount: 1,
    status: 'upcoming',
    detailHtml: '<p>每周一晚围读。</p>',
    likeCount: 29,
    startAt: '2026-09-14 19:00',
    endAt: '2026-09-14 20:00',
    sessions: [],
    signupStartAt: '2026-08-20 08:00',
    signupEndAt: '2026-09-14 18:00',
    createdAt: '2026-06-01 08:00:00',
    auditStatus: '无需审核',
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
    auditStatus: '无需审核',
    publishStatus: '未发布',
    publishedAt: '',
    terminatedAt: '2026-06-06 18:00',
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
    signedCount: 3,
    status: 'ended',
    detailHtml: '<p>三期共读系列。</p>',
    likeCount: 6,
    sessions: [
      { id: '501-s1', startAt: '2026-06-20 19:00', endAt: '2026-06-20 21:00', capacity: 18, signedCount: 1, status: 'ended' },
      { id: '501-s2', startAt: '2026-06-27 19:00', endAt: '2026-06-27 21:00', capacity: 18, signedCount: 1, status: 'ended' },
      { id: '501-s3', startAt: '2026-07-04 19:00', endAt: '2026-07-04 21:00', capacity: 18, signedCount: 1, status: 'ended' },
    ],
    signupStartAt: '2026-06-05 10:00',
    signupHoursBefore: 24,
    signupEndAt: syncSignupEndAt(
      [
        { id: '501-s1', startAt: '2026-06-20 19:00', endAt: '2026-06-20 21:00' },
        { id: '501-s2', startAt: '2026-06-27 19:00', endAt: '2026-06-27 21:00' },
        { id: '501-s3', startAt: '2026-07-04 19:00', endAt: '2026-07-04 21:00' },
      ],
      24,
    ),
    createdAt: '2026-06-05 10:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-06-05 10:20:00',
  },
  {
    ...igActivityAlignDefaults(),
    id: 601,
    groupId: 6,
    title: '午间拉伸十分钟',
    type: 'once',
    categoryKey: 'sport',
    coverUrl: '/activities/share.jpg',
    location: '总部 · 工位区',
    hostName: '林浅',
    checkInEnabled: true,
    checkInToken: 'ck-once-601',
    capacity: 16,
    signedCount: 1,
    status: 'upcoming',
    detailHtml: '<p>跟练颈肩和髋部，10 分钟回工位。</p>',
    likeCount: 3,
    startAt: '2026-09-15 12:10',
    endAt: '2026-09-15 12:20',
    sessions: [],
    signupStartAt: '2026-08-20 09:00',
    signupEndAt: '2026-09-15 12:00',
    createdAt: '2026-07-01 09:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-07-01 09:20:00',
  },
  {
    ...igActivityAlignDefaults(),
    id: 602,
    groupId: 7,
    title: '周末胶片冲洗局',
    type: 'once',
    categoryKey: 'other',
    coverUrl: '/activities/open-day.jpg',
    location: '总部 · 暗房角落',
    hostName: '林浅',
    checkInEnabled: true,
    checkInToken: 'ck-once-602',
    capacity: 8,
    signedCount: 1,
    status: 'upcoming',
    detailHtml: '<p>带一卷拍完的胶卷来，现场冲洗扫片。</p>',
    likeCount: 2,
    startAt: '2026-09-19 14:00',
    endAt: '2026-09-19 17:00',
    sessions: [],
    signupStartAt: '2026-08-20 10:00',
    signupEndAt: '2026-09-19 12:00',
    createdAt: '2026-07-04 10:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-07-04 10:15:00',
  },
  {
    ...igActivityAlignDefaults(),
    id: 603,
    groupId: 4,
    title: '周五开黑体验局',
    type: 'once',
    categoryKey: 'game',
    coverUrl: '/activities/open-day.jpg',
    location: '总部休闲区',
    hostName: '黄码',
    capacity: 12,
    signedCount: 1,
    status: 'upcoming',
    detailHtml: '<p>新手友好，带麦即可。</p>',
    likeCount: 4,
    startAt: '2026-09-04 19:30',
    endAt: '2026-09-04 22:00',
    sessions: [],
    signupStartAt: '2026-08-20 09:00',
    signupEndAt: '2026-09-04 18:00',
    createdAt: '2026-07-10 09:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-07-10 09:20:00',
  },
  {
    ...igActivityAlignDefaults(),
    id: 604,
    groupId: 6,
    title: '午间拉伸跟练三期',
    type: 'series',
    categoryKey: 'sport',
    coverUrl: '/activities/share.jpg',
    location: '总部 · 工位区',
    hostName: '林浅',
    checkInEnabled: true,
    capacity: 16,
    signedCount: 1,
    status: 'upcoming',
    detailHtml: '<p>三期跟练，每场 10 分钟颈肩髋拉伸。林浅发起，可按场次签到。</p>',
    likeCount: 1,
    startAt: '2026-09-08 12:10',
    endAt: '2026-09-22 12:20',
    sessions: [
      {
        id: '604-s1',
        startAt: '2026-09-08 12:10',
        endAt: '2026-09-08 12:20',
        capacity: 16,
        signedCount: 1,
        status: 'upcoming',
        checkInToken: 'ck-604-s1',
      },
      {
        id: '604-s2',
        startAt: '2026-09-15 12:10',
        endAt: '2026-09-15 12:20',
        capacity: 16,
        signedCount: 0,
        status: 'upcoming',
        checkInToken: 'ck-604-s2',
      },
      {
        id: '604-s3',
        startAt: '2026-09-22 12:10',
        endAt: '2026-09-22 12:20',
        capacity: 16,
        signedCount: 0,
        status: 'upcoming',
        checkInToken: 'ck-604-s3',
      },
    ],
    signupStartAt: '2026-08-20 09:00',
    signupHoursBefore: 2,
    signupEndAt: syncSignupEndAt(
      [
        { id: '604-s1', startAt: '2026-09-08 12:10', endAt: '2026-09-08 12:20' },
        { id: '604-s2', startAt: '2026-09-15 12:10', endAt: '2026-09-15 12:20' },
        { id: '604-s3', startAt: '2026-09-22 12:10', endAt: '2026-09-22 12:20' },
      ],
      2,
    ),
    createdAt: '2026-08-25 09:00:00',
    auditStatus: '无需审核',
    publishStatus: '已发布',
    publishedAt: '2026-08-25 09:20:00',
  },
];

const PINNED_ACTIVITY_ID = 201;
const unpinnedActivityIds = seedInterestGroupActivities.filter((item) => item.id !== PINNED_ACTIVITY_ID).map((item) => item.id);
export const initialInterestGroupActivities: InterestGroupActivity[] = seedInterestGroupActivities.map((item) => ({
  ...item,
  pinned: item.id === PINNED_ACTIVITY_ID,
  sortIndex: item.id === PINNED_ACTIVITY_ID ? 0 : unpinnedActivityIds.indexOf(item.id),
}));
