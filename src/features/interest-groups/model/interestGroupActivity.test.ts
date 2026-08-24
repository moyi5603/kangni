import { describe, expect, it } from 'vitest';
import {
  canDeleteInterestGroupActivity,
  canPublishInterestGroupActivity,
  canReviewInterestGroupActivity,
  canSubmitInterestGroupActivity,
  canTerminateInterestGroupActivity,
  displayInterestGroupActivityStatus,
  totalSignedCount,
  validateInterestGroupActivityForm,
  type InterestGroupActivity,
  type InterestGroupActivityFormValues,
} from './interestGroupActivity';

const base: InterestGroupActivity = {
  id: 1,
  groupId: 1,
  title: '测试',
  type: 'once',
  categoryKey: 'sport',
  coverUrl: '/x.jpg',
  location: '总部',
  hostName: '张悦',
  capacity: 10,
  signedCount: 0,
  status: 'upcoming',
  detailHtml: '',
  likeCount: 0,
  startAt: '2026-06-01 19:00',
  endAt: '2026-06-01 21:00',
  deadlineMode: 'none',
  createdAt: '2026-05-01 10:00:00',
  auditStatus: '已通过',
  publishStatus: '已发布',
  publishedAt: '2026-05-01 10:10:00',
};

describe('interest group activity rules', () => {
  it('blocks delete when anyone signed', () => {
    expect(canDeleteInterestGroupActivity({ ...base, signedCount: 2 })).toBe(false);
    expect(canDeleteInterestGroupActivity({ ...base, signedCount: 0 })).toBe(true);
  });

  it('sums series session signups for delete', () => {
    const series: InterestGroupActivity = {
      ...base,
      type: 'series',
      signedCount: 0,
      sessions: [
        { id: 'a', startAt: '2026-06-01 19:00', endAt: '2026-06-01 21:00', capacity: 10, signedCount: 3, status: 'upcoming' },
      ],
    };
    expect(totalSignedCount(series)).toBe(3);
    expect(canDeleteInterestGroupActivity(series)).toBe(false);
  });

  it('allows terminate only for upcoming', () => {
    expect(canTerminateInterestGroupActivity({ ...base, status: 'upcoming' })).toBe(true);
    expect(canTerminateInterestGroupActivity({ ...base, status: 'ongoing' })).toBe(false);
    expect(canTerminateInterestGroupActivity({ ...base, status: 'ended' })).toBe(false);
  });

  it('shows 已满员 when full and not ended', () => {
    expect(displayInterestGroupActivityStatus({ ...base, signedCount: 10, status: 'upcoming' })).toBe('已满员');
  });

  it('requires exactly one weekday for recurring', () => {
    const values: InterestGroupActivityFormValues = {
      coverUrl: '/x.jpg',
      title: '夜跑',
      groupId: 1,
      categoryKey: 'sport',
      type: 'recurring',
      timeStart: '19:00',
      timeEnd: '21:00',
      deadlineMode: 'none',
      location: '南门',
      capacity: 20,
      detailHtml: '',
    };
    expect(validateInterestGroupActivityForm(values, true)).toBe('请选择重复的周几');
    expect(validateInterestGroupActivityForm({ ...values, repeatWeekday: 4 }, true)).toBeNull();
  });

  it('gates publish and review like the activities app', () => {
    expect(canPublishInterestGroupActivity({ auditStatus: '已通过' })).toBe(true);
    expect(canPublishInterestGroupActivity({ auditStatus: '无需审核' })).toBe(true);
    expect(canPublishInterestGroupActivity({ auditStatus: '待审核' })).toBe(false);
    expect(canSubmitInterestGroupActivity({ auditStatus: '待提交' })).toBe(true);
    expect(canSubmitInterestGroupActivity({ auditStatus: '已驳回' })).toBe(true);
    expect(canReviewInterestGroupActivity({ auditStatus: '待审核' })).toBe(true);
    expect(canReviewInterestGroupActivity({ auditStatus: '已通过' })).toBe(false);
  });
});
