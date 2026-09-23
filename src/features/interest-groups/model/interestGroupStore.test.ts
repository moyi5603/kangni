import { describe, expect, it, beforeEach } from 'vitest';
import {
  __resetInterestGroupStoreForTest,
  canDeleteInterestGroup,
  countDetachableActivities,
  deleteInterestGroup,
  getInterestGroup,
  getInterestGroupActivities,
  getInterestGroupActivity,
  getInterestGroupSignups,
  addInterestGroupSignup,
  setInterestGroupSignupStatus,
  terminateInterestGroupActivity,
  upsertInterestGroup,
  reviewInterestGroup,
  upsertInterestGroupActivity,
  createEmployeeInterestGroupActivity,
  deleteInterestGroupActivity,
  deleteInterestGroupCategory,
  getInterestGroupCategories,
  getInterestGroups,
  moveInterestGroup,
  moveInterestGroupActivity,
  toggleInterestGroupPin,
  toggleInterestGroupActivityPin,
  moveInterestGroupCategory,
  setInterestGroupCategoryStatus,
  upsertInterestGroupCategory,
  approveInterestGroupMoments,
  rejectInterestGroupMoments,
  deleteInterestGroupMoment,
  deleteInterestGroupMomentComment,
  getInterestGroupMoments,
  getInterestGroupComments,
  addEmployeeInterestGroupMoment,
  removeInterestGroupComments,
  addInterestGroupMembers,
  removeInterestGroupMembers,
  getInterestGroupMembers,
  setInterestGroupMemberStatus,
} from './interestGroupStore';
import { igActivityAlignDefaults } from './interestGroupActivity';
import { comparePinSort } from './pinSort';
import { defaultInterestGroupSettings } from './interestGroupSettings';
import { saveInterestGroupSettings } from './interestGroupSettingsStore';

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

  it('terminates ongoing activity and cancels unheld sessions', () => {
    expect(terminateInterestGroupActivity(201)).toEqual({ ok: true });
    const activity = getInterestGroupActivity(201);
    expect(activity?.status).toBe('cancelled');
    expect(activity?.terminatedAt).toBeTruthy();
    expect(activity?.sessions?.map((session) => session.status)).toEqual(['ongoing', 'cancelled']);
    expect(terminateInterestGroupActivity(201)).toEqual({ ok: false, reason: 'not-allowed' });
  });

  it('creates unpublished draft then submit/review/publish and blocks delete when signed', () => {
    const created = upsertInterestGroupActivity({
      ...igActivityAlignDefaults(),
      coverUrl: '/activities/share.jpg',
      title: '测试新建活动',
      groupId: 1,
      categoryKey: 'sport',
      type: 'once',
      startAt: '2026-08-24 19:00',
      endAt: '2026-08-24 21:00',
      signupStartAt: '2026-08-01 09:00',
      signupEndAt: '2026-08-24 18:00',
      location: '总部',
      capacity: 10,
      detailHtml: '<p>ok</p>',
    });
    expect(created.status).toBe('upcoming');
    expect(created.auditStatus).toBe('无需审核');
    expect(created.publishStatus).toBe('已发布');
    expect(created.signedCount).toBe(0);
    expect(created.publishedAt).toBeTruthy();
    expect(created.creator).toBe('陈产品');
    expect(deleteInterestGroupActivity(created.id)).toEqual({ ok: true });
    expect(deleteInterestGroupActivity(101)).toEqual({ ok: false, reason: 'has-signups' });
  });

  it('deletes category and unassigns groups and activities', () => {
    const result = deleteInterestGroupCategory('sport');
    expect(result).toEqual({ ok: true, groupCount: 4, activityCount: 5 });
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

  it('rejects pending moment without reason', () => {
    expect(rejectInterestGroupMoments([2], '')).toEqual({ done: 1, skipped: 0 });
    expect(getInterestGroupMoments().find((item) => item.id === 2)?.rejectReason).toBeUndefined();
  });

  it('skips member review when the member is already 已通过', () => {
    expect(setInterestGroupMemberStatus(2, ['林销'], '已驳回', '资料不全')).toEqual({ done: 0, skipped: 1 });
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
    expect(removeInterestGroupMembers(1, ['张悦'])).toEqual({ removed: 0, skipped: ['张悦是兴趣圈负责人'] });
    expect(removeInterestGroupMembers(1, ['赵人事']).removed).toBe(1);
    expect(getInterestGroup(1)?.memberCount).toBe(128);
    expect(getInterestGroupMembers().find((item) => item.employeeId === '李明' && item.groupId === 1)?.status).toBe('已通过');
    expect(setInterestGroupMemberStatus(2, ['林销'], '已通过')).toEqual({ done: 0, skipped: 1 });
    expect(getInterestGroupMembers().find((item) => item.employeeId === '林销' && item.groupId === 2)?.status).toBe('已通过');
  });

  it('does not enable signup audit or seniority on interest-group activities', () => {
    expect(getInterestGroupActivity(101)?.needAudit).toBe(false);
    expect(getInterestGroupActivity(101)?.minSeniorityYears).toBeUndefined();
    expect(getInterestGroupSignups().find((item) => item.name === '李明' && item.activityId === 101)?.status).toBe('已通过');
    const added = addInterestGroupSignup({ activityId: 101, name: '周测', department: '测试组', sessionId: '101-s1' });
    expect(added.status).toBe('已通过');
    expect(setInterestGroupSignupStatus(101, [added.id], '已通过')).toEqual({ done: 0, skipped: 1 });
  });

  it('auto-approves pending members when group switches to free join', () => {
    const group = getInterestGroup(2);
    expect(group).toBeDefined();
    upsertInterestGroup(
      {
        name: group!.name,
        categoryKey: group!.categoryKey,
        leadEmployeeIds: group!.leadEmployeeIds,
        joinMode: 'free',
        intro: group!.intro,
        coverUrl: group!.coverUrl,
      },
      2,
    );
    expect(getInterestGroupMembers().find((item) => item.employeeId === '林销' && item.groupId === 2)?.status).toBe('已通过');
  });

  it('creates group with selected leads as members', () => {
    const created = upsertInterestGroup({
      name: '测试兴趣圈',
      categoryKey: 'sport',
      leadEmployeeIds: ['赵人事', '张悦'],
      joinMode: 'approve',
      intro: '简介',
      coverUrl: '/activities/share.jpg',
    });
    expect(created.leadEmployeeIds).toEqual(['赵人事', '张悦']);
    expect(created.leadName).toBe('赵人事、张悦');
    expect(created.memberCount).toBe(2);
    expect(created.area).toBe('');
    expect(created.tags).toEqual([]);
    expect(
      getInterestGroupMembers()
        .filter((item) => item.groupId === created.id && item.role === 'lead')
        .map((item) => item.employeeId)
        .sort(),
    ).toEqual(['张悦', '赵人事']);
    expect(created.activityCount).toBe(0);
    expect(created.joinMode).toBe('free');
    expect(created.auditStatus).toBe('无需审核');
    expect(created.publishStatus).toBe('未发布');
    expect(created.source).toBe('admin');
    expect(getInterestGroup(created.id)?.name).toBe('测试兴趣圈');
  });

  it('auto-publishes employee-created groups when no audit is needed', () => {
    saveInterestGroupSettings({ ...defaultInterestGroupSettings, employeeCreateGroupNeedAudit: false });
    const created = upsertInterestGroup(
      {
        name: '员工免审建圈',
        categoryKey: 'sport',
        leadEmployeeIds: ['林浅'],
        joinMode: 'free',
        intro: '员工创建',
        coverUrl: '/activities/share.jpg',
      },
      undefined,
      { source: 'employee' },
    );
    expect(created.auditStatus).toBe('无需审核');
    expect(created.publishStatus).toBe('已发布');
    expect(getInterestGroup(created.id)?.publishStatus).toBe('已发布');
    saveInterestGroupSettings(defaultInterestGroupSettings);
  });

  it('puts employee-created groups into 待审核 when settings require audit', () => {
    expect(getInterestGroup(5)?.auditStatus).toBe('待审核');
    expect(getInterestGroup(5)?.source).toBe('employee');
    const created = upsertInterestGroup(
      {
        name: 'C端新建兴趣圈',
        categoryKey: 'sport',
        leadEmployeeIds: ['赵人事'],
        joinMode: 'free',
        intro: '员工创建',
        coverUrl: '/activities/share.jpg',
      },
      undefined,
      { source: 'employee' },
    );
    expect(created.auditStatus).toBe('待审核');
    expect(created.publishStatus).toBe('未发布');
    expect(created.source).toBe('employee');
    expect(reviewInterestGroup(created.id, true, '')).toBe(true);
    expect(getInterestGroup(created.id)?.auditStatus).toBe('已通过');
    expect(reviewInterestGroup(5, false, '封面不符')).toBe(true);
    expect(getInterestGroup(5)?.auditStatus).toBe('已驳回');
    expect(getInterestGroup(5)?.rejectReason).toBe('封面不符');
  });

  it('creates employee activity with schedule fields from C-end form', () => {
    const created = createEmployeeInterestGroupActivity({
      ...igActivityAlignDefaults(),
      coverUrl: '/activities/share.jpg',
      title: 'H5 夜跑加练',
      groupId: 5,
      categoryKey: 'sport',
      type: 'once',
      startAt: '2026-09-04 19:30',
      endAt: '2026-09-04 21:00',
      signupStartAt: '2026-08-27 09:00',
      signupEndAt: '2026-09-04 18:00',
      location: '总部草坪',
      capacity: 12,
      detailHtml: '<p>加练</p>',
      hostName: '林浅',
    });
    expect(created?.title).toBe('H5 夜跑加练');
    expect(created?.type).toBe('once');
    expect(created?.startAt).toBe('2026-09-04 19:30');
    expect(created?.capacity).toBe(12);
    expect(created?.auditStatus).toBe('无需审核');
    expect(created?.publishStatus).toBe('已发布');
    expect(created?.hostName).toBe('林浅');
  });

  it('requires a matching group activity when publishing a moment', () => {
    expect(
      addEmployeeInterestGroupMoment({
        groupId: 1,
        author: '林浅',
        content: '无活动',
        imageUrls: ['/a.jpg'],
      }),
    ).toBeNull();
    expect(
      addEmployeeInterestGroupMoment({
        groupId: 1,
        activityId: 201,
        author: '林浅',
        content: '跨圈',
        imageUrls: ['/a.jpg'],
      }),
    ).toBeNull();
    const created = addEmployeeInterestGroupMoment({
      groupId: 1,
      activityId: 102,
      author: '林浅',
      content: '夜跑收工',
      imageUrls: ['/a.jpg'],
    });
    expect(created?.groupId).toBe(1);
    expect(created?.activityId).toBe(102);
  });

  it('pins groups to the top and inserts new groups after the pin zone', () => {
    expect(toggleInterestGroupPin(2)).toBe(true);
    expect(getInterestGroup(2)?.pinned).toBe(true);
    const created = upsertInterestGroup({
      name: '新圈排序',
      categoryKey: 'sport',
      leadEmployeeIds: ['张悦'],
      joinMode: 'free',
      intro: '排序',
      coverUrl: '/activities/share.jpg',
    });
    const ordered = [...getInterestGroups()].sort(comparePinSort);
    expect(ordered.filter((item) => item.pinned).map((item) => item.id)[0]).toBe(2);
    expect(ordered.find((item) => !item.pinned)?.id).toBe(created.id);
  });

  it('moves unpinned groups immediately and skips pinned rows', () => {
    const visible = [...getInterestGroups()].sort(comparePinSort);
    const unpinned = visible.filter((item) => !item.pinned);
    expect(moveInterestGroup(unpinned[0].id, 'up', visible)).toBe(false);
    expect(moveInterestGroup(visible[0].id, 'down', visible)).toBe(false);
    expect(moveInterestGroup(unpinned[1].id, 'up', visible)).toBe(true);
    const next = [...getInterestGroups()].sort(comparePinSort).filter((item) => !item.pinned);
    expect(next[0].id).toBe(unpinned[1].id);
    expect(next[1].id).toBe(unpinned[0].id);
  });

  it('pins activities and inserts new activities after the pin zone', () => {
    expect(toggleInterestGroupActivityPin(102)).toBe(true);
    expect(getInterestGroupActivity(102)?.pinned).toBe(true);
    const created = upsertInterestGroupActivity({
      ...igActivityAlignDefaults(),
      coverUrl: '/activities/share.jpg',
      title: '排序插入活动',
      groupId: 1,
      categoryKey: 'sport',
      type: 'once',
      startAt: '2026-10-01 19:00',
      endAt: '2026-10-01 21:00',
      signupStartAt: '2026-09-01 09:00',
      signupEndAt: '2026-10-01 18:00',
      location: '总部',
      capacity: 12,
      detailHtml: '<p>排序</p>',
    });
    const ordered = [...getInterestGroupActivities()].sort(comparePinSort);
    expect(ordered[0].pinned).toBe(true);
    expect(ordered.find((item) => !item.pinned)?.id).toBe(created.id);
    const visible = ordered;
    const unpinned = visible.filter((item) => !item.pinned);
    expect(moveInterestGroupActivity(unpinned[1].id, 'up', visible)).toBe(true);
  });
});
