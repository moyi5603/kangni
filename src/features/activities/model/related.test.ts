import { afterEach, describe, expect, it } from 'vitest';
import { initialActivities } from './activity';
import { needsSessionPick, parseSessionIds } from './activitySchedule';
import { approveSignupRecord, getRelatedList, patchRelated, restoreRelatedComments, restoreRelatedSignups, subscribeRelated } from './related';

describe('related signups seed and subscribe', () => {
  afterEach(() => {
    restoreRelatedSignups();
  });

  it('seeds 陈产品 with the C-end demo rows including basketball check-in', () => {
    const mine = getRelatedList('signups').filter((item) => item.phone === '13800001111');
    const byActivity = Object.fromEntries(mine.map((item) => [item.activityId, item]));

    expect(mine.length).toBeGreaterThanOrEqual(8);
    const camp = mine.filter((item) => item.activityId === 2);
    expect(camp).toHaveLength(3);
    expect(camp.map((item) => item.answers?.['场次']).sort()).toEqual(['onboard-1', 'onboard-2', 'onboard-3']);
    expect(byActivity[28]).toMatchObject({ id: 900, status: '待审核', currentNodeIndex: 0 });
    expect(camp[0]).toMatchObject({
      signupType: '个人报名',
      status: '已通过',
      createdAt: '2026-08-18 16:00:00',
      department: '华东大区',
    });
    expect(camp.every((item) => item.answers?.['分组选择'] === '技术组' && item.answers?.['岗位'] === '产品经理')).toBe(true);
    expect(mine.some((item) => item.id === 15 && item.activityId === 6)).toBe(true);
    expect(getRelatedList('signups').find((item) => item.id === 15 && item.activityId === 6)).toMatchObject({
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
      status: '已通过',
      createdAt: '2026-04-12 10:00:00',
    });
    expect(byActivity[26]).toMatchObject({
      id: 18,
      status: '已通过',
      answers: { 场次: 's-0-202608271400', 分组选择: '红队' },
    });
    const workshop = mine.filter((item) => item.activityId === 27);
    expect(workshop.map((item) => item.answers?.['场次']).sort()).toEqual(['s-0-202609050900', 's-1-202609120900']);
    expect(byActivity[10]).toMatchObject({
      id: 20,
      status: '已通过',
    });
    expect(getRelatedList('signups').some((item) => item.activityId === 26 && item.name === '张悦' && item.status === '已通过')).toBe(
      true,
    );
    expect(getRelatedList('signups').some((item) => item.phone === '13800001001')).toBe(true);
  });

  it('seeds 50 approved people on the pinned camp activity', () => {
    const approved = getRelatedList('signups').filter(
      (item) => item.activityId === 2 && item.status === '已通过',
    );
    expect(new Set(approved.map((item) => item.name)).size).toBe(50);
    expect(approved).toHaveLength(150);
    expect(approved.some((item) => item.name === '张悦')).toBe(true);
    expect(approved.some((item) => item.name === '学员01')).toBe(true);
  });

  it('stores one session id per occupying series or recurring signup row', () => {
    const byId = Object.fromEntries(initialActivities.map((item) => [item.id, item]));
    const rows = getRelatedList('signups').filter((item) => {
      const activity = byId[item.activityId];
      return activity && needsSessionPick(activity.scheduleType) && item.status !== '已取消';
    });
    expect(rows.length).toBeGreaterThan(0);
    for (const item of rows) {
      expect(parseSessionIds(item.answers?.['场次']), `${item.name}#${item.id}`).toHaveLength(1);
    }
  });

  it('pins occupying series/recurring signups to real session ids', () => {
    const byId = Object.fromEntries(initialActivities.map((item) => [item.id, item]));
    const invalid = getRelatedList('signups').filter((item) => {
      const activity = byId[item.activityId];
      if (!activity || !needsSessionPick(activity.scheduleType)) return false;
      if (item.status === '已取消') return false;
      const ids = parseSessionIds(item.answers?.['场次']);
      const allowed = new Set((activity.sessions ?? []).map((session) => session.id));
      return !ids.length || ids.some((id) => !allowed.has(id));
    });
    expect(invalid.map((item) => ({ id: item.id, activityId: item.activityId, name: item.name }))).toEqual([]);
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

describe('quality improvement activity seed', () => {
  it('seeds 质量改进项目启动 with signup groups and approved members', () => {
    const activity = initialActivities.find((item) => item.id === 14);
    expect(activity?.title).toBe('质量改进项目启动');
    expect(activity?.signupFields.some((field) => field.inputType === 'group')).toBe(true);
    const groups = activity?.signupFields.find((field) => field.inputType === 'group')?.groups?.map((item) => item.name);
    expect(groups).toEqual(['质量组', '工艺组']);
    const rows = getRelatedList('signups').filter((item) => item.activityId === 14 && item.status === '已通过');
    expect(rows.some((item) => item.answers?.['分组选择'] === '质量组')).toBe(true);
    expect(rows.some((item) => item.answers?.['分组选择'] === '工艺组')).toBe(true);
  });
});

describe('approveSignupRecord', () => {
  const pending = {
    id: 1,
    activityId: 2,
    name: '张三',
    phone: '139',
    signupType: '个人报名',
    department: '研发',
    status: '待审核' as const,
    createdAt: '',
  };

  it('advances to the next node while more nodes remain', () => {
    const next = approveSignupRecord(pending, 2);
    expect(next.status).toBe('待审核');
    expect(next.currentNodeIndex).toBe(1);
  });

  it('approves outright at the last node or when no nodes configured', () => {
    const last = approveSignupRecord({ ...pending, currentNodeIndex: 1 }, 2);
    expect(last.status).toBe('已通过');
    expect(last.currentNodeIndex).toBeUndefined();
    expect(approveSignupRecord(pending, 0).status).toBe('已通过');
  });
});
