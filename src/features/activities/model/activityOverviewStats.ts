import dayjs from 'dayjs';
import type { Activity, ActivityStatus } from './activity';
import { computeActivityStats } from './activityStats';
import type { MomentRecord } from './moment';
import type { CommentRecord, SignupRecord, SurveyRecord } from './related';

export function isSignupOpen(
  activity: Pick<Activity, 'signupStartAt' | 'signupEndAt'>,
  now = dayjs(),
): boolean {
  const start = dayjs(activity.signupStartAt);
  const end = dayjs(activity.signupEndAt);
  return !now.isBefore(start) && !now.isAfter(end);
}

export type ActivityOverviewStats = {
  totalCount: number;
  publishedCount: number;
  unpublishedCount: number;
  signupOpenCount: number;
  inProgressActivityCount: number;
  pendingAuditActivityCount: number;
  pendingSubmitActivityCount: number;
  rejectedAuditActivityCount: number;
  pinnedCount: number;
  pendingSignupCount: number;
  approvedSignupCount: number;
  rejectedSignupCount: number;
  cancelledSignupCount: number;
  totalSignupCount: number;
  commentCount: number;
  momentCount: number;
  surveyCount: number;
  surveysCollectingCount: number;
  surveyResponseCount: number;
  activityStatusCounts: Record<ActivityStatus, number>;
  publishRate: number | null;
  globalQuotaUsage: number | null;
};

export type ActivityAttentionRow = {
  key: string;
  activityId: number;
  title: string;
  type: Activity['type'];
  kind: '活动待审核' | '报名待审核';
  count?: number;
};

export type SignupOpenActivityRow = {
  activityId: number;
  title: string;
  type: Activity['type'];
  signupEndAt: string;
  signupCount: number;
  pendingSignupCount: number;
  quotaUsage: number | null;
};

const emptyStatusCounts = (): Record<ActivityStatus, number> => ({
  未开始: 0,
  进行中: 0,
  已结束: 0,
});

export function computeActivityOverviewStats(input: {
  activities: Activity[];
  signups: SignupRecord[];
  comments: CommentRecord[];
  moments: MomentRecord[];
  surveys: SurveyRecord[];
  now?: dayjs.Dayjs;
}): ActivityOverviewStats {
  const now = input.now ?? dayjs();
  const activityStatusCounts = emptyStatusCounts();
  let publishedCount = 0;
  let signupOpenCount = 0;
  let pendingAuditActivityCount = 0;
  let pendingSubmitActivityCount = 0;
  let rejectedAuditActivityCount = 0;
  let pinnedCount = 0;
  let inProgressActivityCount = 0;

  input.activities.forEach((activity) => {
    activityStatusCounts[activity.activityStatus] += 1;
    if (activity.publishStatus === '已发布') publishedCount += 1;
    if (activity.auditStatus === '待审核') pendingAuditActivityCount += 1;
    if (activity.auditStatus === '待提交' || activity.auditStatus === '已驳回') pendingSubmitActivityCount += 1;
    if (activity.auditStatus === '已驳回') rejectedAuditActivityCount += 1;
    if (activity.pinned) pinnedCount += 1;
    if (activity.activityStatus === '进行中') inProgressActivityCount += 1;
    if (activity.publishStatus === '已发布' && isSignupOpen(activity, now)) signupOpenCount += 1;
  });

  const activeSignups = input.signups.filter((item) => item.status !== '已取消');
  const pendingSignupCount = input.signups.filter((item) => item.status === '待审核').length;
  const approvedSignupCount = input.signups.filter((item) => item.status === '已通过').length;
  const rejectedSignupCount = input.signups.filter((item) => item.status === '已驳回').length;
  const cancelledSignupCount = input.signups.filter((item) => item.status === '已取消').length;
  const surveysCollectingCount = input.surveys.filter((item) => item.status === '收集中').length;
  const totalCount = input.activities.length;
  let globalQuota = 0;
  let globalSignupUsed = 0;
  input.activities.forEach((activity) => {
    const limit = activity.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0);
    if (limit <= 0) return;
    globalQuota += limit;
    globalSignupUsed += input.signups.filter(
      (signup) => signup.activityId === activity.id && signup.status !== '已取消',
    ).length;
  });

  return {
    totalCount,
    publishedCount,
    unpublishedCount: totalCount - publishedCount,
    signupOpenCount,
    inProgressActivityCount,
    pendingAuditActivityCount,
    pendingSubmitActivityCount,
    rejectedAuditActivityCount,
    pinnedCount,
    pendingSignupCount,
    approvedSignupCount,
    rejectedSignupCount,
    cancelledSignupCount,
    totalSignupCount: activeSignups.length,
    commentCount: input.comments.length,
    momentCount: input.moments.length,
    surveyCount: input.surveys.length,
    surveysCollectingCount,
    surveyResponseCount: input.surveys.reduce((sum, item) => sum + item.responseCount, 0),
    activityStatusCounts,
    publishRate: totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : null,
    globalQuotaUsage: globalQuota > 0 ? Math.round((globalSignupUsed / globalQuota) * 100) : null,
  };
}

export function buildAttentionRows(activities: Activity[], signups: SignupRecord[]): ActivityAttentionRow[] {
  const rows: ActivityAttentionRow[] = [];

  activities
    .filter((item) => item.auditStatus === '待审核')
    .forEach((activity) => {
      rows.push({
        key: `audit-${activity.id}`,
        activityId: activity.id,
        title: activity.title,
        type: activity.type,
        kind: '活动待审核',
      });
    });

  const pendingByActivity = new Map<number, number>();
  signups.forEach((signup) => {
    if (signup.status !== '待审核') return;
    pendingByActivity.set(signup.activityId, (pendingByActivity.get(signup.activityId) ?? 0) + 1);
  });

  activities
    .filter((activity) => (pendingByActivity.get(activity.id) ?? 0) > 0)
    .sort((left, right) => (pendingByActivity.get(right.id) ?? 0) - (pendingByActivity.get(left.id) ?? 0))
    .forEach((activity) => {
      rows.push({
        key: `signup-${activity.id}`,
        activityId: activity.id,
        title: activity.title,
        type: activity.type,
        kind: '报名待审核',
        count: pendingByActivity.get(activity.id) ?? 0,
      });
    });

  return rows;
}

export function buildSignupOpenRows(
  activities: Activity[],
  signups: SignupRecord[],
  comments: CommentRecord[],
  moments: MomentRecord[],
  surveys: SurveyRecord[],
  now = dayjs(),
): SignupOpenActivityRow[] {
  return activities
    .filter((activity) => activity.publishStatus === '已发布' && isSignupOpen(activity, now))
    .map((activity) => {
      const activitySignups = signups.filter((item) => item.activityId === activity.id);
      const activityComments = comments.filter((item) => item.activityId === activity.id);
      const activityMoments = moments.filter((item) => item.activityId === activity.id);
      const activitySurveys = surveys.filter((item) => item.activityId === activity.id);
      const stats = computeActivityStats({
        signups: activitySignups,
        comments: activityComments,
        moments: activityMoments,
        surveys: activitySurveys,
        signupSettings: activity.signupSettings,
      });
      return {
        activityId: activity.id,
        title: activity.title,
        type: activity.type,
        signupEndAt: activity.signupEndAt,
        signupCount: stats.signupCount,
        pendingSignupCount: stats.pendingSignupCount,
        quotaUsage: stats.quotaUsage,
      };
    })
    .sort((left, right) => dayjs(left.signupEndAt).valueOf() - dayjs(right.signupEndAt).valueOf());
}
