import { afterEach, describe, expect, it } from 'vitest';
import { getRelatedList, patchRelated, restoreRelatedComments, restoreRelatedSignups, subscribeRelated } from './related';

describe('related signups seed and subscribe', () => {
  afterEach(() => {
    restoreRelatedSignups();
  });

  it('seeds 陈产品 with the C-end demo five rows', () => {
    const mine = getRelatedList('signups').filter((item) => item.phone === '13800001111');
    const byActivity = Object.fromEntries(mine.map((item) => [item.activityId, item]));

    expect(mine).toHaveLength(5);
    expect(byActivity[2]).toMatchObject({
      id: 4,
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-08-18 16:00:00',
      department: '职能中心',
    });
    expect(byActivity[6]).toMatchObject({
      id: 15,
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-08-17 16:00:00',
    });
    expect(byActivity[9]).toMatchObject({
      id: 16,
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-08-16 16:00:00',
    });
    expect(byActivity[1]).toMatchObject({
      id: 14,
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-04-12 10:00:00',
    });
    expect(byActivity[12]).toMatchObject({
      id: 17,
      signupType: '个人报名',
      status: '已驳回',
      createdAt: '2026-04-12 10:00:00',
    });
    expect(getRelatedList('signups').some((item) => item.phone === '13800001001')).toBe(true);
  });

  it('notifies subscribeRelated when signups change', () => {
    let calls = 0;
    const stop = subscribeRelated(() => {
      calls += 1;
    });
    patchRelated('signups', (list) => list);
    stop();
    expect(calls).toBeGreaterThan(0);
  });
});

describe('related comments restore', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('restores comment seed after C-end inserts', () => {
    const before = getRelatedList('comments').length;
    patchRelated('comments', (list) => [
      { id: 99, activityId: 2, content: '临时评论', author: '陈产品', createdAt: '2026-08-20 10:00:00', likedBy: [] },
      ...list,
    ]);
    expect(getRelatedList('comments')).toHaveLength(before + 1);
    restoreRelatedComments();
    expect(getRelatedList('comments')).toHaveLength(before);
    expect(getRelatedList('comments').some((item) => item.id === 99)).toBe(false);
    expect(getRelatedList('comments').some((item) => item.id === 1 && item.author === '张悦')).toBe(true);
  });
});
