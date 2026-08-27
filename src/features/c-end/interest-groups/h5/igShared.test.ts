import { describe, expect, it } from 'vitest';
import { ACTS, GROUPS, enrollInfo, filterGroups, isCEndGroupDiscoverable, type Group } from './igShared';

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
    expect(filterGroups([pending, GROUPS[0]], '')).toEqual([GROUPS[0]]);
    expect(filterGroups([pending, GROUPS[0]], '午休')).toEqual([]);
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
