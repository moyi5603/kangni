import { describe, expect, it } from 'vitest';
import {
  canDeleteInterestGroupActivity,
  applyCloseInterestGroupSignup,
  applyReopenInterestGroupSignup,
  canCloseInterestGroupSignup,
  canReopenInterestGroupSignup,
  canRevokeInterestGroupActivity,
  canTerminateInterestGroupActivity,
  getInterestGroupLifecycleStatus,
  igActivityAlignDefaults,
  totalSignedCount,
  validateInterestGroupActivityForm,
  type InterestGroupActivity,
  type InterestGroupActivityFormValues,
} from './interestGroupActivity';

const base: InterestGroupActivity = {
  ...igActivityAlignDefaults(),
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

  it('allows terminate only after start', () => {
    expect(canTerminateInterestGroupActivity({ ...base, status: 'upcoming' })).toBe(false);
    expect(canTerminateInterestGroupActivity({ ...base, status: 'ongoing' })).toBe(true);
    expect(canTerminateInterestGroupActivity({ ...base, status: 'ended' })).toBe(false);
    expect(canTerminateInterestGroupActivity({ ...base, status: 'cancelled' })).toBe(false);
    expect(canTerminateInterestGroupActivity({ ...base, status: 'ongoing', publishStatus: '未发布' })).toBe(false);
  });

  it('closes and reopens signup like the activities app', () => {
    const now = '2026-05-20 10:00';
    expect(canCloseInterestGroupSignup(base, now)).toBe(true);
    const closed = applyCloseInterestGroupSignup(base, now);
    expect(closed.signupClosedAt).toBe(now);
    expect(closed.signupEndAt).toBe(now);
    expect(canReopenInterestGroupSignup(closed)).toBe(true);
    expect(applyReopenInterestGroupSignup(closed).signupEndAt).toBe(base.signupEndAt);
    expect(canRevokeInterestGroupActivity(base)).toBe(true);
    expect(canRevokeInterestGroupActivity({ ...base, status: 'ongoing' })).toBe(false);
  });

  it('maps lifecycle like the activities app', () => {
    expect(getInterestGroupLifecycleStatus(base)).toBe('未开始');
    expect(getInterestGroupLifecycleStatus({ ...base, publishStatus: '未发布' })).toBe('未发布');
    expect(getInterestGroupLifecycleStatus({ ...base, status: 'cancelled' })).toBe('已终止');
    expect(getInterestGroupLifecycleStatus({ ...base, status: 'ended' })).toBe('已结束');
  });

  it('requires weekday rules and activity window for recurring', () => {
    const values: InterestGroupActivityFormValues = {
      ...igActivityAlignDefaults(),
      coverUrl: '/x.jpg',
      title: '夜跑',
      groupId: 1,
      categoryKey: 'sport',
      type: 'recurring',
      timeStart: '19:00',
      timeEnd: '21:00',
      location: '南门',
      capacity: 20,
      detailHtml: '<p>ok</p>',
      signupStartAt: '2026-05-01 09:00',
      signupHoursBefore: 0,
    };
    expect(validateInterestGroupActivityForm(values, true)).toBe('请选择活动时间');
    expect(validateInterestGroupActivityForm({ ...values, repeatRules: [{ weekday: 4, timeStart: '19:00', timeEnd: '21:00' }] }, true)).toBe(
      '请选择活动时间',
    );
    expect(
      validateInterestGroupActivityForm(
        {
          ...values,
          startAt: '2026-06-01 19:00',
          endAt: '2026-06-30 21:00',
          repeatRules: [{ weekday: 4, timeStart: '19:00', timeEnd: '21:00' }],
        },
        true,
      ),
    ).toBeNull();
    expect(
      validateInterestGroupActivityForm(
        {
          ...values,
          visibility: '按部门',
          startAt: '2026-06-01 19:00',
          endAt: '2026-06-30 21:00',
          repeatRules: [{ weekday: 4, timeStart: '19:00', timeEnd: '21:00' }],
          notifyOnPublish: true,
          notifyAudience: 'all',
        },
        true,
      ),
    ).toBeNull();
    expect(
      validateInterestGroupActivityForm(
        {
          ...values,
          startAt: '2026-06-01 19:00',
          endAt: '2026-06-30 21:00',
          repeatRules: [{ weekday: 4, timeStart: '19:00', timeEnd: '21:00' }],
          notifyOnPublish: true,
          notifyAudience: undefined,
        },
        true,
      ),
    ).toBeNull();
  });
});
