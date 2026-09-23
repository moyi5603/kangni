import { describe, expect, it } from 'vitest';
import {
  ACTS,
  GROUPS,
  enrollInfo,
  filterActs,
  filterGroups,
  isCEndGroupDiscoverable,
  momentEligibleActs,
  momentEligibleGroups,
  pickActs,
  searchActsByName,
  searchGroupsByName,
  type Act,
  type Group,
} from './igShared';

const pending: Group = {
  ...GROUPS[0],
  id: 'g-pending',
  name: '午休飞盘局',
  auditStatus: '待审核',
};

describe('C-end group audit visibility', () => {
  it('hides 待审核 / 已驳回 groups from discovery', () => {
    expect(isCEndGroupDiscoverable(GROUPS[0])).toBe(true);
    expect(isCEndGroupDiscoverable(pending)).toBe(false);
    expect(isCEndGroupDiscoverable({ ...pending, auditStatus: '已驳回' })).toBe(false);
    expect(isCEndGroupDiscoverable({ ...pending, auditStatus: '已通过' })).toBe(true);
    expect(isCEndGroupDiscoverable({ ...pending, auditStatus: '已通过', publishStatus: '未发布' })).toBe(false);
    expect(filterGroups([pending, GROUPS[0]], '')).toEqual([GROUPS[0]]);
    expect(filterGroups([pending, GROUPS[0]], '午休')).toEqual([]);
    expect(filterGroups(GROUPS, '滨江园区')).toEqual([]);
  });

  it('orders 全部兴趣圈 by admin pin then sortIndex', () => {
    const later: Group = { ...GROUPS[0], id: '2', name: '后排', pinned: false, sortIndex: 1 };
    const pinned: Group = { ...GROUPS[0], id: '9', name: '置顶圈', pinned: true, sortIndex: 0 };
    const earlier: Group = { ...GROUPS[0], id: '3', name: '先排', pinned: false, sortIndex: 0 };
    expect(filterGroups([later, pinned, earlier], '').map((item) => item.name)).toEqual(['置顶圈', '先排', '后排']);
  });
});

describe('C-end all activity list sort', () => {
  it('orders 全部活动 by admin pin then sortIndex', () => {
    const later: Act = { ...ACTS[0], id: '2', title: '后排活动', pinned: false, sortIndex: 1 };
    const pinned: Act = { ...ACTS[0], id: '9', title: '置顶活动', pinned: true, sortIndex: 0 };
    const earlier: Act = { ...ACTS[0], id: '3', title: '先排活动', pinned: false, sortIndex: 0 };
    expect(filterActs([later, pinned, earlier], GROUPS, '').map((item) => item.title)).toEqual([
      '置顶活动',
      '先排活动',
      '后排活动',
    ]);
  });

  it('keeps 推荐/热门 ahead of admin pin on home activity tabs', () => {
    const hot: Act = { ...ACTS[0], id: '2', title: '热门活动', pinned: false, sortIndex: 1, recReason: '因为你', likes: 99 };
    const pinned: Act = { ...ACTS[0], id: '9', title: '置顶活动', pinned: true, sortIndex: 0, recReason: undefined, likes: 0 };
    expect(pickActs('rec', [hot, pinned], 2).map((item) => item.title)).toEqual(['热门活动', '置顶活动']);
    expect(pickActs('hot', [hot, pinned], 2).map((item) => item.title)).toEqual(['热门活动', '置顶活动']);
  });
});

describe('home name search', () => {
  it('matches activity and group titles only', () => {
    expect(searchActsByName(ACTS, '夜跑').map((item) => item.title).some((title) => title.includes('夜跑'))).toBe(true);
    expect(searchActsByName(ACTS, '夜跑').every((item) => item.title.includes('夜跑'))).toBe(true);
    expect(searchGroupsByName(GROUPS, '夜跑').map((item) => item.name)).toEqual(['城市夜跑团']);
    expect(searchGroupsByName([pending, GROUPS[0]], '飞盘')).toEqual([]);
  });
});

describe('moment publish eligibility', () => {
  const base: Act = {
    id: 'a-m',
    gid: GROUPS[0].id,
    title: '周四夜跑',
    cat: 'sport',
    type: 'once',
    when: '今晚',
    dateKey: 1,
    loc: '滨江',
    host: '江野',
    signed: 1,
    cap: 32,
    likes: 0,
    joinedByMe: true,
    status: 'ended',
    desc: '',
    tags: [],
  };

  it('allows joined ongoing and ended activities, not upcoming', () => {
    const acts: Act[] = [
      { ...base, id: 'ended', status: 'ended' },
      { ...base, id: 'ongoing', status: 'ongoing' },
      { ...base, id: 'upcoming', status: 'upcoming' },
      { ...base, id: 'other', gid: GROUPS[1].id, status: 'ended' },
      { ...base, id: 'skip', joinedByMe: false, status: 'ended' },
    ];
    expect(momentEligibleActs(acts, GROUPS[0].id).map((item) => item.id)).toEqual(['ended', 'ongoing']);
    expect(momentEligibleGroups(GROUPS, acts).map((item) => item.id)).toEqual([GROUPS[0].id, GROUPS[1].id]);
  });
});

describe('C-end activity signup has no audit', () => {
  it('does not seed 报名审核 on 初夏滨江摄影 Walk', () => {
    const walk = ACTS.find((item) => item.id === 'a16');
    expect(walk).toBeDefined();
    expect('needAudit' in (walk ?? {})).toBe(false);
  });

  it('shows 取消报名 when already signed, even if leftover status is 待审核', () => {
    const group = GROUPS[0];
    const act = {
      id: 'a-audit',
      gid: group.id,
      title: '周四羽毛球',
      cat: 'sport' as const,
      type: 'once' as const,
      when: '今晚',
      dateKey: 1,
      loc: '体育馆',
      host: '叶蓁',
      signed: 1,
      cap: 32,
      likes: 0,
      joinedByMe: true,
      status: 'upcoming' as const,
      desc: '',
      tags: [],
      signupStatus: '待审核' as const,
    };
    expect(enrollInfo(act, group).label).toBe('取消报名');
    expect(enrollInfo({ ...act, signupStatus: '已通过' }, group).label).toBe('取消报名');
  });
});
