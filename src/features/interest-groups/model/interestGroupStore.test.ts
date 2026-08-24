import { describe, expect, it, beforeEach } from 'vitest';
import {
  __resetInterestGroupStoreForTest,
  canDeleteInterestGroup,
  countDetachableActivities,
  deleteInterestGroup,
  getInterestGroup,
  getInterestGroupActivities,
  terminateInterestGroupActivity,
  upsertInterestGroup,
  upsertInterestGroupActivity,
  submitInterestGroupActivities,
  reviewInterestGroupActivity,
  publishInterestGroupActivities,
  deleteInterestGroupActivity,
  deleteInterestGroupCategory,
  getInterestGroupCategories,
  getInterestGroups,
  moveInterestGroupCategory,
  setInterestGroupCategoryStatus,
  upsertInterestGroupCategory,
  approveInterestGroupMoments,
  rejectInterestGroupMoments,
  deleteInterestGroupMoment,
  deleteInterestGroupMomentComment,
  getInterestGroupMoments,
  getInterestGroupComments,
  removeInterestGroupComments,
  addInterestGroupMembers,
  removeInterestGroupMembers,
  getInterestGroupMembers,
  setInterestGroupMemberStatus,
} from './interestGroupStore';

describe('interestGroupStore delete rules', () => {
  beforeEach(() => {
    __resetInterestGroupStoreForTest();
  });

  it('blocks delete when group has ongoing activity', () => {
    expect(canDeleteInterestGroup(2)).toBe(false);
    expect(deleteInterestGroup(2)).toEqual({ ok: false, reason: 'has-ongoing' });
    expect(getInterestGroup(2)).toBeDefined();
  });

  it('allows delete and detaches activities when no ongoing activity', () => {
    expect(canDeleteInterestGroup(3)).toBe(true);
    expect(countDetachableActivities(3)).toBe(2);
    expect(deleteInterestGroup(3)).toEqual({ ok: true });
    expect(getInterestGroup(3)).toBeUndefined();
    expect(getInterestGroupActivities().find((item) => item.id === 301)?.groupId).toBeNull();
  });

  it('blocks terminate on ongoing activity', () => {
    expect(terminateInterestGroupActivity(201)).toEqual({ ok: false, reason: 'not-allowed' });
  });

  it('creates unpublished draft then submit/review/publish and blocks delete when signed', () => {
    const created = upsertInterestGroupActivity({
      coverUrl: '/activities/share.jpg',
      title: '测试新建活动',
      groupId: 1,
      categoryKey: 'sport',
      type: 'once',
      startAt: '2026-08-24 19:00',
      endAt: '2026-08-24 21:00',
      deadlineMode: 'none',
      location: '总部',
      capacity: 10,
      detailHtml: '<p>ok</p>',
    });
    expect(created.status).toBe('upcoming');
    expect(created.auditStatus).toBe('待提交');
    expect(created.publishStatus).toBe('未发布');
    expect(created.signedCount).toBe(0);
    expect(submitInterestGroupActivities([created.id])).toBe(1);
    expect(reviewInterestGroupActivity(created.id, true, '')).toBe(true);
    expect(publishInterestGroupActivities([created.id])).toBe(1);
    expect(deleteInterestGroupActivity(created.id)).toEqual({ ok: true });
    expect(deleteInterestGroupActivity(101)).toEqual({ ok: false, reason: 'has-signups' });
  });

  it('deletes category and unassigns groups and activities', () => {
    const result = deleteInterestGroupCategory('sport');
    expect(result).toEqual({ ok: true, groupCount: 2, activityCount: 3 });
    expect(getInterestGroupCategories().some((item) => item.key === 'sport')).toBe(false);
    expect(getInterestGroups().filter((item) => item.categoryKey === 'sport')).toHaveLength(0);
    expect(getInterestGroupActivities().filter((item) => item.categoryKey === 'sport')).toHaveLength(0);
    expect(getInterestGroup(1)?.categoryKey).toBe('');
  });

  it('moves category by swapping order with neighbor', () => {
    const before = getInterestGroupCategories();
    const sport = before.find((item) => item.key === 'sport');
    const learning = before.find((item) => item.key === 'learning');
    expect(sport && learning && sport.order < learning.order).toBe(true);
    expect(moveInterestGroupCategory('sport', 1)).toBe(true);
    const after = getInterestGroupCategories();
    expect(after.find((item) => item.key === 'sport')?.order).toBe(learning?.order);
    expect(after.find((item) => item.key === 'learning')?.order).toBe(sport?.order);
  });

  it('disables category without changing existing bindings', () => {
    setInterestGroupCategoryStatus(['sport'], '禁用');
    expect(getInterestGroupCategories().find((item) => item.key === 'sport')?.status).toBe('禁用');
    expect(getInterestGroup(1)?.categoryKey).toBe('sport');
  });

  it('creates category with generated key', () => {
    const created = upsertInterestGroupCategory({ label: '团队拓展' });
    expect(created.key.startsWith('c')).toBe(true);
    expect(created.status).toBe('启用');
    expect(created.order).toBeGreaterThan(70);
  });

  it('approves pending moment and skips others', () => {
    expect(approveInterestGroupMoments([2, 1])).toEqual({ done: 1, skipped: 1 });
    expect(getInterestGroupMoments().find((item) => item.id === 2)?.status).toBe('已通过');
  });

  it('rejects pending moment with reason', () => {
    expect(rejectInterestGroupMoments([2], '信息不完整')).toEqual({ done: 1, skipped: 0 });
    expect(getInterestGroupMoments().find((item) => item.id === 2)?.rejectReason).toBe('信息不完整');
  });

  it('deletes moment and its comments', () => {
    expect(deleteInterestGroupMomentComment(1, 11)).toBe(true);
    expect(getInterestGroupMoments().find((item) => item.id === 1)?.comments).toEqual([]);
    expect(deleteInterestGroupMoment(1)).toBe(true);
    expect(getInterestGroupMoments().some((item) => item.id === 1)).toBe(false);
  });

  it('deletes comment and its replies', () => {
    expect(removeInterestGroupComments([1])).toBe(true);
    const left = getInterestGroupComments().filter((item) => item.activityId === 101);
    expect(left.some((item) => item.id === 1 || item.id === 5)).toBe(false);
    expect(left.some((item) => item.id === 2)).toBe(true);
  });

  it('adds members and blocks removing lead', () => {
    const added = addInterestGroupMembers(1, ['赵人事', '张悦']);
    expect(added.added).toBe(1);
    expect(added.skipped.length).toBeGreaterThan(0);
    expect(getInterestGroup(1)?.memberCount).toBe(129);
    expect(removeInterestGroupMembers(1, ['张悦'])).toEqual({ removed: 0, skipped: ['张悦是小组负责人'] });
    expect(removeInterestGroupMembers(1, ['赵人事']).removed).toBe(1);
    expect(getInterestGroup(1)?.memberCount).toBe(128);
    expect(getInterestGroupMembers().find((item) => item.employeeId === '李明' && item.groupId === 1)?.status).toBe('已通过');
    expect(setInterestGroupMemberStatus(2, ['林销'], '已通过')).toEqual({ done: 1, skipped: 0 });
    expect(getInterestGroupMembers().find((item) => item.employeeId === '林销' && item.groupId === 2)?.status).toBe('已通过');
  });

  it('auto-approves pending members when group switches to free join', () => {
    const group = getInterestGroup(2);
    expect(group).toBeDefined();
    upsertInterestGroup(
      {
        name: group!.name,
        categoryKey: group!.categoryKey,
        leadEmployeeId: group!.leadEmployeeId,
        joinMode: 'free',
        area: group!.area,
        tags: group!.tags,
        intro: group!.intro,
        coverUrl: group!.coverUrl,
      },
      2,
    );
    expect(getInterestGroupMembers().find((item) => item.employeeId === '林销' && item.groupId === 2)?.status).toBe('已通过');
  });

  it('creates group with one member', () => {
    const created = upsertInterestGroup({
      name: '测试小组',
      categoryKey: 'sport',
      leadEmployeeId: '赵人事',
      joinMode: 'free',
      area: '总部',
      tags: ['新人友好'],
      intro: '简介',
      coverUrl: '/activities/share.jpg',
    });
    expect(created.memberCount).toBe(1);
    expect(created.activityCount).toBe(0);
    expect(getInterestGroup(created.id)?.name).toBe('测试小组');
  });
});
