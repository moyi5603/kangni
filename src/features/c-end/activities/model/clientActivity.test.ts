import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialActivities, type Activity } from '../../../activities/model/activity';
import type { MomentRecord } from '../../../activities/model/moment';
import { patchRelated, restoreRelatedComments, restoreRelatedSignups } from '../../../activities/model/related';
import {
  approvedSignupPeople,
  favoriteViews,
  filterApprovedSignupPeople,
  sessionOccupiedCount,
  userSignedRecentSessionCount,
  filterActivitiesByTitle,
  filterByTab,
  HOME_ACTIVITY_PREVIEW_LIMIT,
  HOME_PAST_HIGHLIGHT_LIMIT,
  PC_ACTIVITY_PREVIEW_LIMIT,
  PC_PAST_HIGHLIGHT_LIMIT,
  listPastHighlightMoments,
  pastHighlightMoments,
  filterSignupsByTitle,
  formatPcDateTime,
  formatPcDateTimeRange,
  formatShortActivityDate,
  isSignupOpen,
  groupClientSignups,
  hasHomeFavoritesPane,
  hasHomeSignupsPane,
  HOME_FAVORITE_PREVIEW_LIMIT,
  HOME_MINE_TABS,
  homeMineMode,
  previewFavorites,
  SIGNUP_TABS,
  signupCta,
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
    expect(signupOccupiedCount(2)).toBe(54);
  });

  it('lists only approved signup people with name and department', () => {
    const people = approvedSignupPeople(2);
    expect(people).toHaveLength(50);
    expect(people.slice(0, 4)).toEqual([
      { id: 6, name: '张悦', department: '前端组' },
      { id: 9, name: '周工', department: '总装车间' },
      { id: 12, name: '赵人事', department: '人力资源' },
      { id: 4, name: '陈产品', department: '职能中心' },
    ]);
    expect(people[4]).toEqual({ id: 2000, name: '学员01', department: '研发中心' });
    expect(approvedSignupPeople(21)).toEqual([]);
  });

  it('filters approved people by name or department', () => {
    const people = approvedSignupPeople(2);
    expect(filterApprovedSignupPeople(people, ' 张 ')).toEqual([
      { id: 6, name: '张悦', department: '前端组' },
    ]);
    expect(filterApprovedSignupPeople(people, '前端').map((item) => item.name)).toEqual(['张悦']);
    expect(filterApprovedSignupPeople(people, '')).toHaveLength(50);
  });

  it('filters approved people by picked session', () => {
    expect(approvedSignupPeople(26).map((item) => item.name)).toEqual(['陈产品']);
    expect(approvedSignupPeople(26, 's-0-202608271400').map((item) => item.name)).toEqual(['陈产品']);
    expect(approvedSignupPeople(26, 's-1-202609031400')).toEqual([]);
  });

  it('counts occupied seats and the current user signed unfinished sessions per session', () => {
    const basketball = initialActivities.find((item) => item.id === 26)!;
    const now = Date.parse('2026-08-27T11:00:00');
    expect(sessionOccupiedCount(26, 's-0-202608271400')).toBe(1);
    expect(sessionOccupiedCount(26, 's-1-202609031400')).toBe(0);
    expect(userSignedRecentSessionCount(basketball, DEMO_SIGNUP_USER.phone, now)).toBe(1);
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

  it('filters activities by title', () => {
    const openDay = { ...baseActivity, title: '春季员工开放日' };
    const camp = { ...baseActivity, id: 2, title: '新员工入职训练营' };

    expect(filterActivitiesByTitle([openDay, camp], '训练营').map((item) => item.id)).toEqual([2]);
    expect(filterActivitiesByTitle([openDay, camp], ' 开放 ').map((item) => item.id)).toEqual([openDay.id]);
    expect(filterActivitiesByTitle([openDay, camp], '   ')).toEqual([openDay, camp]);
    expect(filterActivitiesByTitle([openDay, camp], 'PARTY')).toEqual([]);
  });

  it('limits the home catalog preview to three H5 activities and six PC activities', () => {
    expect(HOME_ACTIVITY_PREVIEW_LIMIT).toBe(3);
    expect(PC_ACTIVITY_PREVIEW_LIMIT).toBe(6);
  });

  it('takes three newest approved moments on H5 and five on PC', () => {
    const ended = { ...baseActivity, id: 1, activityStatus: '已结束' as const };
    const live = { ...baseActivity, id: 2, activityStatus: '进行中' as const };
    const stamp = (day: string): MomentRecord => ({
      id: Number(day),
      activityId: 1,
      author: 'a',
      content: `m${day}`,
      type: '图文类型',
      imageUrls: [`/${day}.jpg`],
      status: '已通过',
      createdAt: `2026-01-${day} 12:00:00`,
      updatedAt: `2026-01-${day} 12:00:00`,
      likedBy: [],
      comments: [],
    });

    expect(HOME_PAST_HIGHLIGHT_LIMIT).toBe(3);
    expect(PC_PAST_HIGHLIGHT_LIMIT).toBe(5);
    const pool = [
      stamp('01'),
      { ...stamp('04'), id: 4 },
      { ...stamp('05'), id: 5, status: '待审核' as const },
      { ...stamp('03'), id: 3 },
      { ...stamp('09'), id: 9, activityId: 2 },
      { ...stamp('02'), id: 2, imageUrls: [] },
      { ...stamp('02'), id: 7, createdAt: '2026-01-02 18:00:00', imageUrls: ['/7.jpg'] },
      { ...stamp('08'), id: 8, createdAt: '2026-01-01 18:00:00', imageUrls: ['/8.jpg'] },
      { ...stamp('06'), id: 6, activityId: 9 },
    ];
    const unpublishedEnded = {
      ...baseActivity,
      id: 9,
      publishStatus: '未发布' as const,
      activityStatus: '已结束' as const,
    };

    expect(pastHighlightMoments(pool, [ended, live, unpublishedEnded]).map((item) => item.id)).toEqual([4, 3, 7]);
    expect(pastHighlightMoments(pool, [ended, live, unpublishedEnded], PC_PAST_HIGHLIGHT_LIMIT).map((item) => item.id)).toEqual([
      4, 3, 7, 8, 1,
    ]);
    expect(listPastHighlightMoments(pool, [ended, live, unpublishedEnded]).map((item) => item.id)).toEqual([
      4, 3, 7, 8, 1,
    ]);
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

describe('signupCta cancel window', () => {
  const now = Date.parse('2026-08-21T12:00:00');
  const open = {
    ...baseActivity,
    activityStatus: '进行中' as const,
    signupStartAt: '2026-08-01 09:00',
    signupEndAt: '2026-08-31 18:00',
  };

  it('lets a signed-up user cancel before the signup deadline', () => {
    expect(signupCta(open, true, now, { allowCancel: true })).toEqual({ label: '取消报名', enabled: true, action: 'cancel' });
  });

  it('opens session adjust instead of cancel for multi-session signups', () => {
    const series = {
      ...open,
      scheduleType: 'series' as const,
      signupHoursBefore: 0,
      sessions: [
        { id: 'a', startAt: '2026-08-27 14:00', endAt: '2026-08-27 23:00' },
        { id: 'b', startAt: '2026-09-03 14:00', endAt: '2026-09-03 23:00' },
      ],
    };
    expect(signupCta(series, true, now, { allowCancel: true })).toEqual({
      label: '调整报名',
      enabled: true,
      action: 'adjust',
    });
  });

  it('keeps signed-up list labels as 已报名', () => {
    expect(signupCta(open, true, now, { allowCancel: false })).toEqual({ label: '已报名', enabled: false });
  });

  it('blocks cancel after the signup deadline', () => {
    const closed = { ...open, signupEndAt: '2026-08-20 18:00' };
    expect(signupCta(closed, true, now, { allowCancel: true })).toEqual({ label: '已报名', enabled: false });
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

describe('PC datetime display', () => {
  const now = new Date('2026-08-24T12:00:00');

  it('drops the year for datetimes in the current year', () => {
    expect(formatPcDateTime('2026-08-18 09:30', now)).toBe('08-18 09:30');
    expect(formatPcDateTimeRange('2026-08-01 09:00', '2026-08-31 18:00', now)).toBe(
      '08-01 09:00 ~ 08-31 18:00',
    );
  });

  it('keeps the year when the datetime is outside the current year', () => {
    expect(formatPcDateTime('2025-12-31 23:59', now)).toBe('2025-12-31 23:59');
    expect(formatPcDateTimeRange('2026-12-31 09:00', '2027-01-01 18:00', now)).toBe(
      '12-31 09:00 ~ 2027-01-01 18:00',
    );
  });
});

describe('short activity date', () => {
  it('keeps month/day for once activities', () => {
    expect(formatShortActivityDate(baseActivity)).toBe('04/12');
  });

  it('summarizes recurring and series', () => {
    const recurring = initialActivities.find((item) => item.id === 26);
    const series = initialActivities.find((item) => item.id === 27);
    expect(recurring).toBeDefined();
    expect(series).toBeDefined();
    expect(formatShortActivityDate(recurring!)).toMatch(/^每周四 · \d+场$/);
    expect(formatShortActivityDate(series!)).toMatch(/^首场 \d{2}\/\d{2} · \d+场$/);
  });

  it('keeps multi-session signup open while a later session is still open', () => {
    const series = initialActivities.find((item) => item.id === 27)!;
    expect(isSignupOpen(series, Date.parse('2026-09-06T12:00:00'))).toBe(true);
    expect(isSignupOpen(series, Date.parse('2026-09-12T13:00:00'))).toBe(false);
  });
});
