import { describe, expect, it } from 'vitest';
import { computeActivityStats } from './activityStats';
import type { CommentRecord, SignupRecord, SurveyRecord } from './related';
import type { MomentRecord } from './moment';
import type { SignupSetting } from './activity';

function signup(id: number, status: SignupRecord['status']): SignupRecord {
  return { id, activityId: 1, name: `用户${id}`, phone: '13800000000', signupType: '个人报名', department: '研发中心', status, createdAt: '2026-08-01 10:00:00' };
}

describe('computeActivityStats', () => {
  it('counts signups excluding 已取消, and 待审核 separately', () => {
    const stats = computeActivityStats({
      signups: [signup(1, '已通过'), signup(2, '待审核'), signup(3, '已取消'), signup(4, '待审核')],
      comments: [],
      moments: [],
      surveys: [],
      signupSettings: [],
    });
    expect(stats.signupCount).toBe(3);
    expect(stats.pendingSignupCount).toBe(2);
  });

  it('computes quota usage as rounded percent, null when quota unlimited', () => {
    const settings: SignupSetting[] = [
      { type: '个人报名', limit: 40, needAudit: false },
      { type: '团体报名', limit: 60, needAudit: false },
    ];
    const stats = computeActivityStats({
      signups: [signup(1, '已通过'), signup(2, '已通过'), signup(3, '待审核')],
      comments: [],
      moments: [],
      surveys: [],
      signupSettings: settings,
    });
    expect(stats.quotaUsage).toBe(3);

    const unlimited = computeActivityStats({
      signups: [signup(1, '已通过')],
      comments: [],
      moments: [],
      surveys: [],
      signupSettings: [{ type: '个人报名', needAudit: false }],
    });
    expect(unlimited.quotaUsage).toBeNull();
  });

  it('sums comments, moments and survey responses', () => {
    const comments = [
      { id: 1, activityId: 1, content: '好', author: '张悦', createdAt: '2026-08-01 10:00:00', likedBy: [] },
      { id: 2, activityId: 1, content: '顶', author: '李明', parentId: 1, createdAt: '2026-08-01 11:00:00', likedBy: [] },
    ] satisfies CommentRecord[];
    const moments = [
      { id: 1, activityId: 1 },
      { id: 2, activityId: 1 },
      { id: 3, activityId: 1 },
    ] as unknown as MomentRecord[];
    const surveys = [
      { id: 1, activityId: 1, title: 'A', status: '已结束', responseCount: 126, collectStartAt: '', collectEndAt: '', createdAt: '' },
      { id: 2, activityId: 1, title: 'B', status: '收集中', responseCount: 18, collectStartAt: '', collectEndAt: '', createdAt: '' },
    ] satisfies SurveyRecord[];
    const stats = computeActivityStats({ signups: [], comments, moments, surveys, signupSettings: [] });
    expect(stats.commentCount).toBe(2);
    expect(stats.momentCount).toBe(3);
    expect(stats.surveyResponseCount).toBe(144);
  });

  it('returns zeros for empty inputs', () => {
    expect(computeActivityStats({ signups: [], comments: [], moments: [], surveys: [], signupSettings: [] })).toEqual({
      signupCount: 0,
      pendingSignupCount: 0,
      quotaUsage: null,
      commentCount: 0,
      momentCount: 0,
      surveyResponseCount: 0,
    });
  });
});
