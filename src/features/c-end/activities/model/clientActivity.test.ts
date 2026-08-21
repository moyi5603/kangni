import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialActivities, type Activity } from '../../../activities/model/activity';
import { patchRelated, restoreRelatedComments, restoreRelatedSignups } from '../../../activities/model/related';
import {
  favoriteViews,
  filterSignupsByTitle,
  groupClientSignups,
  hasHomeFavoritesPane,
  hasHomeSignupsPane,
  HOME_FAVORITE_PREVIEW_LIMIT,
  HOME_MINE_TABS,
  homeMineMode,
  previewFavorites,
  SIGNUP_TABS,
  signupLimit,
  signupOccupiedCount,
  signupTypes,
  toClientActivity,
  type ClientSignupView,
} from './clientActivity';
import { resetEngagement, toggleLike } from './engagementStore';
import {
  DEMO_SIGNUP_USER,
  getUserSignups,
  resetClientSignups,
  submitSignup,
  type ClientSignup,
} from './signupStore';

const baseActivity = initialActivities[0];

describe('client activity signup model', () => {
  it('normalizes signup types without changing first-seen order', () => {
    const activity: Activity = {
      ...baseActivity,
      signupSettings: [
        { type: ' 个人报名 ', needAudit: true },
        { type: ' ', needAudit: true },
        { type: '团体报名', needAudit: false },
        { type: '个人报名', needAudit: false },
        { type: '', needAudit: true },
      ],
    };

    expect(signupTypes(activity)).toEqual(['个人报名', '团体报名']);
  });

  it('sums configured signup limits', () => {
    const activity: Activity = {
      ...baseActivity,
      signupSettings: [
        { type: '个人报名', limit: 20, needAudit: true },
        { type: '团体报名', limit: 20, needAudit: false },
        { type: '家属报名', limit: 10, needAudit: false },
      ],
    };

    expect(signupLimit(activity)).toBe(50);
  });

  it('returns undefined when no signup limits are configured', () => {
    const activity: Activity = {
      ...baseActivity,
      signupSettings: [{ type: '个人报名', needAudit: true }],
    };

    expect(signupLimit(activity)).toBeUndefined();
  });

  it('counts pending and approved signups as occupied seats', () => {
    expect(signupOccupiedCount(1)).toBe(3);
    expect(signupOccupiedCount(2)).toBe(8);
  });

  it('groups signups by activity status and sorts newest first', () => {
    const upcomingActivity: Activity = {
      ...baseActivity,
      id: 2,
      activityStatus: '进行中',
    };
    const signups: ClientSignup[] = [
      {
        activityId: baseActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-01 09:00',
      },
      {
        activityId: upcomingActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '团体报名',
        status: '已通过',
        createdAt: '2026-08-03 09:00',
      },
      {
        activityId: 999,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-04 09:00',
      },
      {
        activityId: upcomingActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-02 09:00',
      },
    ];

    const grouped = groupClientSignups(signups, [baseActivity, upcomingActivity]);

    expect(grouped.upcoming.map(({ signup }) => signup.createdAt)).toEqual([
      '2026-08-03 09:00',
      '2026-08-02 09:00',
    ]);
    expect(grouped.upcoming.every(({ activity }) => activity === upcomingActivity)).toBe(true);
    expect(grouped.ended.map(({ signup }) => signup.createdAt)).toEqual([
      '2026-08-04 09:00',
      '2026-08-01 09:00',
    ]);
    expect(grouped.ended[0].activity).toBeUndefined();
    expect(grouped.ended[1].activity).toBe(baseActivity);
    expect(grouped.waiting).toEqual([]);
    expect(grouped.ongoing.map(({ signup }) => signup.createdAt)).toEqual([
      '2026-08-03 09:00',
      '2026-08-02 09:00',
    ]);
    expect(grouped.upcoming).toEqual(grouped.ongoing);
    expect(grouped.pending).toEqual([]);
    expect(grouped.rejected).toEqual([]);
  });

  it('splits pending waiting ongoing ended and rejected exclusively', () => {
    const waitingActivity: Activity = {
      ...baseActivity,
      id: 6,
      activityStatus: '未开始',
    };
    const ongoingActivity: Activity = {
      ...baseActivity,
      id: 2,
      activityStatus: '进行中',
    };
    const endedActivity: Activity = {
      ...baseActivity,
      id: 1,
      activityStatus: '已结束',
    };
    const pendingLiveActivity: Activity = {
      ...baseActivity,
      id: 9,
      activityStatus: '未开始',
    };
    const signups: ClientSignup[] = [
      {
        activityId: waitingActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-17T16:00:00.000Z',
      },
      {
        activityId: ongoingActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-18T16:00:00.000Z',
      },
      {
        activityId: endedActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已驳回',
        createdAt: '2026-04-12T10:00:00.000Z',
      },
      {
        activityId: 3,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '待审核',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
      {
        activityId: pendingLiveActivity.id,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '待审核',
        createdAt: '2026-08-16T16:00:00.000Z',
      },
    ];

    const grouped = groupClientSignups(signups, [
      waitingActivity,
      ongoingActivity,
      endedActivity,
      pendingLiveActivity,
    ]);

    expect(grouped.pending.map(({ signup }) => signup.activityId)).toEqual([9, 3]);
    expect(grouped.pending[1].activity).toBeUndefined();
    expect(grouped.waiting.map(({ signup }) => signup.activityId)).toEqual([6]);
    expect(grouped.ongoing.map(({ signup }) => signup.activityId)).toEqual([2]);
    expect(grouped.ended).toEqual([]);
    expect(grouped.rejected.map(({ signup }) => signup.activityId)).toEqual([1]);
    expect(grouped.upcoming.map(({ signup }) => signup.activityId)).toEqual([2, 6, 9]);
  });

  it('exposes five signup tabs without counts', () => {
    expect(SIGNUP_TABS.map((tab) => tab.label)).toEqual([
      '待审核',
      '待参加',
      '进行中',
      '已结束',
      '已驳回',
    ]);
    expect(SIGNUP_TABS.map((tab) => tab.empty)).toEqual([
      '暂无待审核活动',
      '暂无待参加活动',
      '暂无进行中活动',
      '暂无已结束活动',
      '暂无已驳回活动',
    ]);
    expect(SIGNUP_TABS.every((tab) => !('count' in tab))).toBe(true);
  });

  it('filters signup views by activity title', () => {
    const party: ClientSignupView = {
      signup: {
        activityId: 9,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '已通过',
        createdAt: '2026-08-16T16:00:00.000Z',
      },
      activity: { ...baseActivity, id: 9, title: '中秋员工晚会' },
    };
    const invalid: ClientSignupView = {
      signup: {
        activityId: -1,
        name: '陈产品',
        phone: '13800001111',
        type: '个人报名',
        status: '待审核',
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    };

    expect(filterSignupsByTitle([party, invalid], '晚会').map((item) => item.signup.activityId)).toEqual([9]);
    expect(filterSignupsByTitle([party, invalid], ' 晚会 ').map((item) => item.signup.activityId)).toEqual([9]);
    expect(filterSignupsByTitle([party, invalid], '   ')).toEqual([party, invalid]);
    expect(filterSignupsByTitle([party, invalid], '活动已失效').map((item) => item.signup.activityId)).toEqual([-1]);
    expect(filterSignupsByTitle([party], 'PARTY')).toEqual([]);
  });
});

describe('signup store user records', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });

  it('returns fresh arrays containing only the requested user signups', () => {
    expect(submitSignup(baseActivity.id, '个人报名')).toBe('ok');

    const first = getUserSignups();
    const second = getUserSignups(DEMO_SIGNUP_USER.phone);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first).toHaveLength(1);
    expect(getUserSignups('13900000000')).toEqual([]);
  });
});

describe('live social counts and favorites', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('reads likes from engagement and comments from related', () => {
    const activity = initialActivities.find((item) => item.id === 1)!;
    expect(toClientActivity(activity).likes).toBe(3);
    expect(toClientActivity(activity).stars).toBe(0);
    expect(toClientActivity(activity).comments).toBe(26);
    toggleLike(1);
    expect(toClientActivity(activity).likes).toBe(4);
  });

  it('updates comment count after a related delete', () => {
    const activity = initialActivities.find((item) => item.id === 1)!;
    patchRelated('comments', (list) => list.filter((item) => item.id !== 1));
    expect(toClientActivity(activity).comments).toBe(26);
  });

  it('builds favorite views with unpublished as invalid', () => {
    const views = favoriteViews([2, 3, 9], initialActivities);
    expect(views[0]?.activity?.title).toBe('新员工入职训练营');
    expect(views[1]?.activity).toBeUndefined();
    expect(views[2]?.activity?.title).toBe('中秋员工晚会');
    expect(HOME_FAVORITE_PREVIEW_LIMIT).toBe(2);
    const preview = previewFavorites([2, 3, 9], initialActivities);
    expect(preview.map((item) => item.activity?.id)).toEqual([2, 9]);
  });
});

describe('home mine mode', () => {
  const signup: ClientSignup = {
    activityId: 2,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-18T16:00:00.000Z',
  };

  it('hides when both panes are empty', () => {
    expect(hasHomeSignupsPane([])).toBe(false);
    expect(hasHomeFavoritesPane(previewFavorites([3], initialActivities))).toBe(false);
    expect(homeMineMode(false, false)).toBe('hidden');
  });

  it('uses a single pane when only one side has data', () => {
    expect(hasHomeSignupsPane([signup])).toBe(true);
    expect(hasHomeFavoritesPane(previewFavorites([2, 9], initialActivities))).toBe(true);
    expect(homeMineMode(true, false)).toBe('signups');
    expect(homeMineMode(false, true)).toBe('favorites');
  });

  it('uses tabs when both sides have data', () => {
    expect(homeMineMode(true, true)).toBe('tabs');
    expect(HOME_MINE_TABS.map((item) => item.label)).toEqual(['我的活动', '我的收藏']);
  });
});
