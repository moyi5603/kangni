import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { Activity } from './activity';
import {
  buildAttentionRows,
  buildSignupOpenRows,
  computeActivityOverviewStats,
  isSignupOpen,
} from './activityOverviewStats';
import type { SignupRecord } from './related';

function activity(partial: Partial<Activity> & Pick<Activity, 'id' | 'title'>): Activity {
  return {
    type: '公司活动',
    category: '文化',
    tags: [],
    startAt: '2026-09-01 09:00',
    endAt: '2026-09-01 18:00',
    location: '总部',
    organizer: '张悦',
    phone: '13800001001',
    coverUrl: '',
    detailHtml: '',
    visibility: '全员',
    departments: [],
    customPeople: [],
    signupStartAt: '2026-08-01 09:00',
    signupEndAt: '2026-08-31 18:00',
    signupSettings: [{ type: '个人报名', limit: 100, needAudit: true }],
    signupFields: [],
    auditStatus: '已通过',
    publishStatus: '已发布',
    activityStatus: '未开始',
    createdAt: '2026-07-01 10:00:00',
    publishedAt: '2026-07-02 10:00:00',
    itinerary: '',
    extraFeeRule: '',
    momentAuditEnabled: false,
    activityApprovalEnabled: true,
    signupApprovalNodes: [],
    signupPoints: 1,
    firstCommentPoints: 10,
    ratingPoints: 10,
    firstMomentPoints: 10,
    signupPointsEnabled: true,
    firstCommentPointsEnabled: true,
    ratingPointsEnabled: true,
    firstMomentPointsEnabled: true,
    notifyOnPublish: false,
    importFileName: '',
    importedPeople: [],
    pinned: false,
    ...partial,
  };
}

function signup(id: number, activityId: number, status: SignupRecord['status']): SignupRecord {
  return {
    id,
    activityId,
    name: `用户${id}`,
    phone: '13800000000',
    signupType: '个人报名',
    department: '研发中心',
    status,
    createdAt: '2026-08-01 10:00:00',
  };
}

describe('activityOverviewStats', () => {
  it('detects signup window', () => {
    const now = dayjs('2026-08-15 12:00');
    expect(
      isSignupOpen({ signupStartAt: '2026-08-01 09:00', signupEndAt: '2026-08-31 18:00' }, now),
    ).toBe(true);
    expect(
      isSignupOpen({ signupStartAt: '2026-09-01 09:00', signupEndAt: '2026-09-30 18:00' }, now),
    ).toBe(false);
  });

  it('aggregates overview counters', () => {
    const now = dayjs('2026-08-15 12:00');
    const stats = computeActivityOverviewStats({
      activities: [
        activity({ id: 1, title: 'A', publishStatus: '已发布', activityStatus: '未开始' }),
        activity({
          id: 2,
          title: 'B',
          publishStatus: '未发布',
          auditStatus: '待审核',
          activityStatus: '进行中',
          signupStartAt: '2026-09-01 09:00',
          signupEndAt: '2026-09-30 18:00',
        }),
        activity({
          id: 3,
          title: 'C',
          publishStatus: '已发布',
          activityStatus: '已结束',
          signupStartAt: '2026-06-01 09:00',
          signupEndAt: '2026-06-30 18:00',
        }),
      ],
      signups: [
        signup(1, 1, '已通过'),
        signup(2, 1, '待审核'),
        signup(3, 1, '已取消'),
        signup(4, 3, '待审核'),
      ],
      comments: [{ id: 1, activityId: 1, content: '好', author: '张', createdAt: '', likedBy: [] }],
      moments: [{ id: 1, activityId: 1 } as never],
      surveys: [{ id: 1, activityId: 1, title: 'Q', status: '收集中', responseCount: 12, collectStartAt: '', collectEndAt: '', createdAt: '' }],
      now,
    });
    expect(stats.totalCount).toBe(3);
    expect(stats.publishedCount).toBe(2);
    expect(stats.signupOpenCount).toBe(1);
    expect(stats.pendingAuditActivityCount).toBe(1);
    expect(stats.pendingSignupCount).toBe(2);
    expect(stats.approvedSignupCount).toBe(1);
    expect(stats.rejectedSignupCount).toBe(0);
    expect(stats.cancelledSignupCount).toBe(1);
    expect(stats.unpublishedCount).toBe(1);
    expect(stats.inProgressActivityCount).toBe(1);
    expect(stats.pendingSubmitActivityCount).toBe(0);
    expect(stats.rejectedAuditActivityCount).toBe(0);
    expect(stats.surveyCount).toBe(1);
    expect(stats.surveysCollectingCount).toBe(1);
    expect(stats.publishRate).toBe(67);
    expect(stats.globalQuotaUsage).toBe(1);
    expect(stats.totalSignupCount).toBe(3);
    expect(stats.commentCount).toBe(1);
    expect(stats.momentCount).toBe(1);
    expect(stats.surveyResponseCount).toBe(12);
    expect(stats.activityStatusCounts).toEqual({ 未开始: 1, 进行中: 1, 已结束: 1 });
  });

  it('builds attention rows for audit and pending signups', () => {
    const rows = buildAttentionRows(
      [
        activity({ id: 1, title: '待审活动', auditStatus: '待审核' }),
        activity({ id: 2, title: '有报名待审' }),
      ],
      [signup(1, 2, '待审核'), signup(2, 2, '待审核'), signup(3, 2, '已通过')],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ activityId: 1, kind: '活动待审核' });
    expect(rows[1]).toMatchObject({ activityId: 2, kind: '报名待审核', count: 2 });
  });

  it('lists published signup-open activities with per-activity stats', () => {
    const now = dayjs('2026-08-15 12:00');
    const rows = buildSignupOpenRows(
      [
        activity({ id: 1, title: '开放报名', publishStatus: '已发布', signupEndAt: '2026-08-20 18:00' }),
        activity({
          id: 2,
          title: '未开放',
          publishStatus: '已发布',
          signupStartAt: '2026-09-01 09:00',
          signupEndAt: '2026-09-30 18:00',
        }),
      ],
      [signup(1, 1, '已通过'), signup(2, 1, '待审核')],
      [],
      [],
      [],
      now,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      activityId: 1,
      signupCount: 2,
      pendingSignupCount: 1,
      quotaUsage: 2,
    });
  });
});
