import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { orgPeopleByName } from '../../activities/model/activity';
import {
  INTEREST_GROUP_MOCK_VERSION,
  canReviewInterestGroup,
  initialInterestGroups,
  normalizeInterestGroupTags,
  type InterestGroup,
  type InterestGroupFormValues,
  type InterestGroupSource,
} from './interestGroup';
import {
  INTEREST_GROUP_CATEGORY_MOCK_VERSION,
  compareInterestGroupCategories,
  countInterestGroupCategoryUsage,
  initialInterestGroupCategories,
  nextInterestGroupCategoryOrder,
  type InterestGroupCategory,
  type InterestGroupCategoryFormValues,
  type InterestGroupCategoryStatus,
} from './interestGroupCategory';
import {
  INTEREST_GROUP_ACTIVITY_MOCK_VERSION,
  canDeleteInterestGroupActivity,
  canPublishInterestGroupActivity,
  canReviewInterestGroupActivity,
  canSubmitInterestGroupActivity,
  canTerminateInterestGroupActivity,
  countGroupActivities,
  groupHasOngoingActivity,
  igActivityAlignDefaults,
  initialInterestGroupActivities,
  validateInterestGroupActivityForm,
  type InterestGroupActivity,
  type InterestGroupActivityFormValues,
} from './interestGroupActivity';
import {
  initialInterestGroupMembers,
  type InterestGroupMember,
  type InterestGroupMemberStatus,
} from './interestGroupMember';
import { INTEREST_GROUP_COMMENT_MOCK_VERSION, initialInterestGroupComments, type InterestGroupComment } from './interestGroupComment';
import {
  generateRecurringSessions,
  needsSessionPick,
  syncSessionBounds,
  syncSignupEndAt,
  createSessionId,
} from '../../activities/model/activitySchedule';
import { removeCommentsAndDescendants } from '../../activities/model/commentTree';
import type { CommentRecord } from '../../activities/model/related';
import {
  INTEREST_GROUP_MOMENT_MOCK_VERSION,
  initialInterestGroupMoments,
  type InterestGroupMoment,
} from './interestGroupMoment';
import { validateRejectReason, normalizeRejectReason } from '../../activities/model/moment';
import {
  canReviewInterestGroupSignup,
  interestGroupSignupInitialStatus,
  occupiesInterestGroupSignupSlot,
  initialInterestGroupSignups,
  type InterestGroupSignup,
  type InterestGroupSignupStatus,
} from './interestGroupSignup';
import { employeeCreatedGroupAuditStatus } from './interestGroupSettings';
import { getInterestGroupSettings } from './interestGroupSettingsStore';

let mockVersion = INTEREST_GROUP_MOCK_VERSION;
let categoryMockVersion = INTEREST_GROUP_CATEGORY_MOCK_VERSION;
let activityMockVersion = INTEREST_GROUP_ACTIVITY_MOCK_VERSION;
let momentMockVersion = INTEREST_GROUP_MOMENT_MOCK_VERSION;
let commentMockVersion = INTEREST_GROUP_COMMENT_MOCK_VERSION;

let groups = [...initialInterestGroups];
let categories = [...initialInterestGroupCategories];
let activities = [...initialInterestGroupActivities];
let members = [...initialInterestGroupMembers];
let comments = [...initialInterestGroupComments];
let moments = [...initialInterestGroupMoments];
let signups = [...initialInterestGroupSignups];
let activityLikers: Record<number, string[]> = {};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncActivityCounts() {
  groups = groups.map((group) => ({
    ...group,
    activityCount: countGroupActivities(group.id, activities),
  }));
}

function syncMockData() {
  let changed = false;
  if (mockVersion !== INTEREST_GROUP_MOCK_VERSION) {
    groups = [...initialInterestGroups];
    members = [...initialInterestGroupMembers];
    comments = [...initialInterestGroupComments];
    moments = [...initialInterestGroupMoments];
    mockVersion = INTEREST_GROUP_MOCK_VERSION;
    changed = true;
  }
  if (activityMockVersion !== INTEREST_GROUP_ACTIVITY_MOCK_VERSION) {
    activities = [...initialInterestGroupActivities];
    signups = [...initialInterestGroupSignups];
    activityMockVersion = INTEREST_GROUP_ACTIVITY_MOCK_VERSION;
    changed = true;
  }
  if (categoryMockVersion !== INTEREST_GROUP_CATEGORY_MOCK_VERSION) {
    categories = [...initialInterestGroupCategories];
    categoryMockVersion = INTEREST_GROUP_CATEGORY_MOCK_VERSION;
    changed = true;
  }
  if (momentMockVersion !== INTEREST_GROUP_MOMENT_MOCK_VERSION) {
    moments = [...initialInterestGroupMoments];
    momentMockVersion = INTEREST_GROUP_MOMENT_MOCK_VERSION;
    changed = true;
  }
  if (commentMockVersion !== INTEREST_GROUP_COMMENT_MOCK_VERSION) {
    comments = [...initialInterestGroupComments];
    commentMockVersion = INTEREST_GROUP_COMMENT_MOCK_VERSION;
    changed = true;
  }
  if (changed) {
    syncActivityCounts();
    emit();
  }
}

if (import.meta.hot) {
  import.meta.hot.accept('./interestGroup', (mod) => {
    if (!mod) return;
    groups = [...mod.initialInterestGroups];
    mockVersion = mod.INTEREST_GROUP_MOCK_VERSION;
    syncActivityCounts();
    emit();
  });
  import.meta.hot.accept('./interestGroupCategory', (mod) => {
    if (!mod) return;
    categories = [...mod.initialInterestGroupCategories];
    categoryMockVersion = mod.INTEREST_GROUP_CATEGORY_MOCK_VERSION;
    emit();
  });
}

export function getInterestGroups(): InterestGroup[] {
  syncMockData();
  return groups;
}

export function getInterestGroup(id: number): InterestGroup | undefined {
  syncMockData();
  return groups.find((item) => item.id === id);
}

export function getInterestGroupCategories(): InterestGroupCategory[] {
  syncMockData();
  return categories;
}

export function getInterestGroupActivities(): InterestGroupActivity[] {
  syncMockData();
  return activities;
}

export function getInterestGroupMembers(): InterestGroupMember[] {
  syncMockData();
  return members;
}

export function addInterestGroupMembers(groupId: number, employeeIds: string[]): { added: number; skipped: string[] } {
  syncMockData();
  const existing = new Set(members.filter((item) => item.groupId === groupId).map((item) => item.employeeId));
  const skipped: string[] = [];
  const created: InterestGroupMember[] = [];
  const joinedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  for (const employeeId of employeeIds) {
    const person = orgPeopleByName[employeeId];
    if (!person) {
      skipped.push(`${employeeId}不在组织中`);
      continue;
    }
    if (existing.has(person.name) || created.some((item) => item.employeeId === person.name)) {
      skipped.push(`${person.name}已是成员`);
      continue;
    }
    created.push({
      groupId,
      employeeId: person.name,
      name: person.name,
      department: person.department,
      role: 'member',
      status: '已通过',
      joinedAt,
    });
  }
  if (created.length) {
    members = [...created, ...members];
    groups = groups.map((group) =>
      group.id === groupId ? { ...group, memberCount: group.memberCount + created.length } : group,
    );
    emit();
  }
  return { added: created.length, skipped };
}

export function removeInterestGroupMembers(groupId: number, employeeIds: string[]): { removed: number; skipped: string[] } {
  syncMockData();
  const skipped: string[] = [];
  const drop = new Set<string>();
  for (const employeeId of employeeIds) {
    const current = members.find((item) => item.groupId === groupId && item.employeeId === employeeId);
    if (!current) {
      skipped.push(`${employeeId}不是成员`);
      continue;
    }
    if (current.role === 'lead') {
      skipped.push(`${current.name}是小组负责人`);
      continue;
    }
    drop.add(employeeId);
  }
  if (drop.size) {
    members = members.filter((item) => !(item.groupId === groupId && drop.has(item.employeeId)));
    groups = groups.map((group) =>
      group.id === groupId ? { ...group, memberCount: Math.max(0, group.memberCount - drop.size) } : group,
    );
    emit();
  }
  return { removed: drop.size, skipped };
}

export function setInterestGroupMemberStatus(
  groupId: number,
  employeeIds: string[],
  status: Exclude<InterestGroupMemberStatus, '待审核'>,
  rejectReason?: string,
): { done: number; skipped: number } {
  syncMockData();
  const idSet = new Set(employeeIds);
  let done = 0;
  let skipped = 0;
  const reason = status === '已驳回' ? normalizeRejectReason(rejectReason) : undefined;
  members = members.map((item) => {
    if (item.groupId !== groupId || !idSet.has(item.employeeId)) return item;
    if (item.role === 'lead' || item.status !== '待审核') {
      skipped += 1;
      return item;
    }
    done += 1;
    return {
      ...item,
      status,
      rejectReason: status === '已驳回' ? reason : undefined,
    };
  });
  if (done) emit();
  return { done, skipped };
}

export function getInterestGroupComments(): InterestGroupComment[] {
  syncMockData();
  return comments;
}

export function getInterestGroupMoments(): InterestGroupMoment[] {
  syncMockData();
  return moments;
}

export function getInterestGroupSignups(): InterestGroupSignup[] {
  syncMockData();
  return signups;
}

export type AddInterestGroupSignupInput = {
  activityId: number;
  name: string;
  department: string;
  sessionId?: string;
};

function adjustSignedCount(activityId: number, sessionId: string | undefined, delta: number) {
  activities = activities.map((activity) => {
    if (activity.id !== activityId) return activity;
    if (activity.sessions?.length && sessionId) {
      const sessions = activity.sessions.map((session) =>
        session.id === sessionId ? { ...session, signedCount: Math.max(0, session.signedCount + delta) } : session,
      );
      return { ...activity, sessions, signedCount: Math.max(0, activity.signedCount + delta) };
    }
    return { ...activity, signedCount: Math.max(0, activity.signedCount + delta) };
  });
}

export function addInterestGroupSignup(input: AddInterestGroupSignupInput): InterestGroupSignup {
  syncMockData();
  const activity = activities.find((item) => item.id === input.activityId);
  if (!activity) throw new Error('活动不存在');
  const created: InterestGroupSignup = {
    id: Math.max(0, ...signups.map((item) => item.id)) + 1,
    activityId: input.activityId,
    sessionId: input.sessionId,
    name: input.name,
    department: input.department,
    signedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    status: interestGroupSignupInitialStatus(activity.needAudit),
  };
  signups = [created, ...signups];
  if (occupiesInterestGroupSignupSlot(created.status)) adjustSignedCount(input.activityId, input.sessionId, 1);
  emit();
  return created;
}

export function setInterestGroupSignupStatus(
  activityId: number,
  ids: number[],
  status: Exclude<InterestGroupSignupStatus, '待审核'>,
  rejectReason?: string,
): { done: number; skipped: number } {
  syncMockData();
  const activity = activities.find((item) => item.id === activityId);
  if (!activity) return { done: 0, skipped: ids.length };
  const idSet = new Set(ids);
  let done = 0;
  let skipped = 0;
  const reason = status === '已驳回' ? normalizeRejectReason(rejectReason) : undefined;
  signups = signups.map((item) => {
    if (!idSet.has(item.id) || item.activityId !== activityId) return item;
    if (!canReviewInterestGroupSignup(item, activity)) {
      skipped += 1;
      return item;
    }
    done += 1;
    if (status === '已驳回') adjustSignedCount(activityId, item.sessionId, -1);
    return {
      ...item,
      status,
      rejectReason: status === '已驳回' ? reason : undefined,
    };
  });
  if (done) emit();
  return { done, skipped };
}

export function getInterestGroupActivity(id: number): InterestGroupActivity | undefined {
  syncMockData();
  return activities.find((item) => item.id === id);
}

export function canDeleteInterestGroup(groupId: number): boolean {
  syncMockData();
  return !groupHasOngoingActivity(groupId, activities);
}

export function countDetachableActivities(groupId: number): number {
  syncMockData();
  return activities.filter((activity) => activity.groupId === groupId).length;
}

export type DeleteInterestGroupResult = { ok: true } | { ok: false; reason: 'not-found' | 'has-ongoing' };

export function deleteInterestGroup(groupId: number): DeleteInterestGroupResult {
  syncMockData();
  if (!groups.some((group) => group.id === groupId)) return { ok: false, reason: 'not-found' };
  if (groupHasOngoingActivity(groupId, activities)) return { ok: false, reason: 'has-ongoing' };
  groups = groups.filter((group) => group.id !== groupId);
  activities = activities.map((activity) => (activity.groupId === groupId ? { ...activity, groupId: null } : activity));
  members = members.filter((member) => member.groupId !== groupId);
  moments = moments.filter((moment) => moment.groupId !== groupId);
  emit();
  return { ok: true };
}

export function clearInterestGroupCategory(categoryKey: string) {
  if (!categoryKey) return;
  groups = groups.map((group) => (group.categoryKey === categoryKey ? { ...group, categoryKey: '' } : group));
  activities = activities.map((activity) =>
    activity.categoryKey === categoryKey ? { ...activity, categoryKey: '' } : activity,
  );
  emit();
}

export type DeleteCategoryResult =
  | { ok: true; groupCount: number; activityCount: number }
  | { ok: false; reason: 'not-found' };

export function deleteInterestGroupCategory(key: string): DeleteCategoryResult {
  syncMockData();
  if (!categories.some((item) => item.key === key)) return { ok: false, reason: 'not-found' };
  const usage = countInterestGroupCategoryUsage(key, groups, activities);
  categories = categories.filter((item) => item.key !== key);
  groups = groups.map((group) => (group.categoryKey === key ? { ...group, categoryKey: '' } : group));
  activities = activities.map((activity) => (activity.categoryKey === key ? { ...activity, categoryKey: '' } : activity));
  emit();
  return { ok: true, ...usage };
}

export function upsertInterestGroupCategory(values: InterestGroupCategoryFormValues, key?: string): InterestGroupCategory {
  syncMockData();
  const label = values.label.trim();
  if (key) {
    const current = categories.find((item) => item.key === key);
    if (!current) throw new Error('分类不存在');
    const next: InterestGroupCategory = {
      ...current,
      label,
      order: values.order ?? current.order,
    };
    categories = categories.map((item) => (item.key === key ? next : item));
    emit();
    return next;
  }
  const created: InterestGroupCategory = {
    key: `c${Date.now()}`,
    label,
    order: values.order ?? nextInterestGroupCategoryOrder(categories),
    status: '启用',
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  categories = [created, ...categories];
  emit();
  return created;
}

export function setInterestGroupCategoryStatus(keys: string[], status: InterestGroupCategoryStatus) {
  syncMockData();
  const keySet = new Set(keys);
  categories = categories.map((item) => (keySet.has(item.key) ? { ...item, status } : item));
  emit();
}

export function moveInterestGroupCategory(key: string, dir: -1 | 1): boolean {
  syncMockData();
  const sorted = [...categories].sort(compareInterestGroupCategories);
  const index = sorted.findIndex((item) => item.key === key);
  const nextIndex = index + dir;
  if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) return false;
  const current = sorted[index];
  const neighbor = sorted[nextIndex];
  if (current.order === neighbor.order) {
    const currentCreated = current.createdAt;
    sorted[index] = { ...current, createdAt: neighbor.createdAt };
    sorted[nextIndex] = { ...neighbor, createdAt: currentCreated };
  } else {
    sorted[index] = { ...current, order: neighbor.order };
    sorted[nextIndex] = { ...neighbor, order: current.order };
  }
  const nextByKey = new Map(sorted.map((item) => [item.key, item]));
  categories = categories.map((item) => nextByKey.get(item.key) ?? item);
  emit();
  return true;
}

export type UpsertInterestGroupOptions = { source?: InterestGroupSource };

export function upsertInterestGroup(
  values: InterestGroupFormValues,
  id?: number,
  options?: UpsertInterestGroupOptions,
): InterestGroup {
  syncMockData();
  const employee = orgPeopleByName[values.leadEmployeeId];
  const payload = {
    name: values.name.trim(),
    categoryKey: values.categoryKey,
    leadEmployeeId: values.leadEmployeeId,
    leadName: employee?.name ?? values.leadEmployeeId,
    joinMode: 'free',
    area: values.area.trim(),
    tags: normalizeInterestGroupTags(values.tags),
    intro: values.intro.trim(),
    coverUrl: values.coverUrl,
  };

  if (id != null) {
    const current = groups.find((group) => group.id === id);
    if (!current) throw new Error('小组不存在');
    const next: InterestGroup = { ...current, ...payload };
    groups = groups.map((group) => (group.id === id ? next : group));
    members = members.map((member) => {
      if (member.groupId !== id) return member;
      if (member.role === 'lead') {
        return {
          ...member,
          name: next.leadName,
          employeeId: next.leadEmployeeId,
          department: employee?.department ?? member.department,
          status: '已通过' as const,
        };
      }
      if (next.joinMode === 'free' && member.status === '待审核') {
        return { ...member, status: '已通过' as const };
      }
      return member;
    });
    emit();
    return next;
  }

  const nextId = Math.max(0, ...groups.map((group) => group.id)) + 1;
  const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const source = options?.source ?? 'admin';
  const created: InterestGroup = {
    id: nextId,
    ...payload,
    memberCount: 1,
    activityCount: 0,
    createdAt,
    source,
    auditStatus: source === 'employee' ? employeeCreatedGroupAuditStatus(getInterestGroupSettings()) : '无需审核',
  };
  groups = [created, ...groups];
  members = [
    {
      groupId: nextId,
      employeeId: created.leadEmployeeId,
      name: created.leadName,
      department: employee?.department ?? '—',
      role: 'lead',
      status: '已通过',
      joinedAt: createdAt,
    },
    ...members,
  ];
  emit();
  return created;
}

function buildActivityFromForm(values: InterestGroupActivityFormValues, current?: InterestGroupActivity): InterestGroupActivity {
  const group = groups.find((item) => item.id === values.groupId);
  const align = igActivityAlignDefaults();
  let sessions = current?.sessions ?? [];
  if (values.type === 'once') {
    sessions = [];
  } else if (values.type === 'recurring' && values.repeatWeekday != null && values.timeStart && values.timeEnd && values.cycleStart && values.cycleEnd) {
    sessions = generateRecurringSessions({
      repeatWeekday: values.repeatWeekday,
      timeStart: values.timeStart,
      timeEnd: values.timeEnd,
      cycleStart: values.cycleStart,
      cycleEnd: values.cycleEnd,
    }).map((session, index) => ({
      ...session,
      capacity: values.capacity,
      signedCount: current?.sessions?.[index]?.signedCount ?? 0,
      status: current?.sessions?.[index]?.status ?? ('upcoming' as const),
    }));
  } else if (values.type === 'series') {
    sessions = (values.sessions ?? []).map((session, index) => ({
      id: current?.sessions?.[index]?.id ?? createSessionId(session.startAt, index),
      startAt: session.startAt,
      endAt: session.endAt,
      capacity: values.capacity,
      signedCount: current?.sessions?.[index]?.signedCount ?? 0,
      status: current?.sessions?.[index]?.status ?? ('upcoming' as const),
    }));
  }
  const bounds = syncSessionBounds(sessions.map(({ id, startAt, endAt }) => ({ id, startAt, endAt })));
  return {
    ...align,
    ...current,
    id: current?.id ?? Math.max(0, ...activities.map((item) => item.id)) + 1,
    groupId: values.groupId,
    title: values.title.trim(),
    type: current?.type ?? values.type,
    categoryKey: values.categoryKey,
    coverUrl: values.coverUrl,
    location: values.location.trim(),
    hostName: group?.leadName ?? current?.hostName ?? '',
    capacity: values.capacity,
    signedCount: current?.signedCount ?? 0,
    status: current?.status ?? 'upcoming',
    detailHtml: values.detailHtml,
    likeCount: current?.likeCount ?? 0,
    startAt: values.type === 'once' ? values.startAt : bounds.startAt || current?.startAt,
    endAt: values.type === 'once' ? values.endAt : bounds.endAt || current?.endAt,
    repeatWeekday: values.type === 'recurring' ? values.repeatWeekday : undefined,
    timeStart: values.type === 'recurring' ? values.timeStart : undefined,
    timeEnd: values.type === 'recurring' ? values.timeEnd : undefined,
    cycleStart: values.type === 'recurring' ? values.cycleStart : undefined,
    cycleEnd: values.type === 'recurring' ? values.cycleEnd : undefined,
    sessions,
    signupStartAt: values.signupStartAt,
    signupEndAt: values.type === 'once' ? values.signupEndAt : values.signupEndAt || current?.signupEndAt || align.signupEndAt,
    signupHoursBefore: values.type === 'once' ? 0 : values.signupHoursBefore ?? 0,
    visibility: values.visibility,
    departments: values.departments,
    customPeople: values.customPeople,
    importFileName: values.importFileName,
    importedPeople: values.importedPeople,
    notifyOnPublish: values.notifyOnPublish,
    needAudit: false,
    minSeniorityYears: undefined,
    signupApprovalNodes: [],
    signupFields: values.signupFields,
    signupPoints: values.signupPoints,
    signupPointsEnabled: values.signupPointsEnabled,
    pinned: current?.pinned ?? false,
    createdAt: current?.createdAt ?? dayjs().format('YYYY-MM-DD HH:mm:ss'),
    auditStatus: current?.auditStatus ?? '待提交',
    publishStatus: current?.publishStatus ?? '未发布',
    publishedAt: current?.publishedAt ?? '',
    rejectReason: current?.rejectReason,
  };
}

export function upsertInterestGroupActivity(values: InterestGroupActivityFormValues, id?: number): InterestGroupActivity {
  syncMockData();
  if (id != null) {
    const current = activities.find((item) => item.id === id);
    if (!current) throw new Error('活动不存在');
    const next = buildActivityFromForm(values, current);
    activities = activities.map((item) => (item.id === id ? next : item));
    if (!next.needAudit) {
      signups = signups.map((item) =>
        item.activityId === id && item.status === '待审核'
          ? { ...item, status: '已通过' as const, rejectReason: undefined }
          : item,
      );
    }
    syncActivityCounts();
    emit();
    return next;
  }
  const created = buildActivityFromForm(values);
  activities = [created, ...activities];
  syncActivityCounts();
  emit();
  return created;
}

export function patchInterestGroupActivities(updater: (list: InterestGroupActivity[]) => InterestGroupActivity[]) {
  syncMockData();
  activities = updater(activities);
  emit();
}

export function reviewInterestGroup(id: number, pass: boolean, comment: string): boolean {
  syncMockData();
  const current = groups.find((item) => item.id === id);
  if (!current || !canReviewInterestGroup(current)) return false;
  groups = groups.map((item) =>
    item.id === id
      ? {
          ...item,
          auditStatus: pass ? '已通过' : '已驳回',
          rejectReason: pass ? undefined : normalizeRejectReason(comment),
        }
      : item,
  );
  emit();
  return true;
}

export function submitInterestGroupActivities(ids: number[]): number {
  syncMockData();
  const idSet = new Set(ids);
  let done = 0;
  activities = activities.map((item) => {
    if (!idSet.has(item.id) || !canSubmitInterestGroupActivity(item)) return item;
    done += 1;
    return { ...item, auditStatus: '待审核', rejectReason: undefined };
  });
  if (done) emit();
  return done;
}

export function reviewInterestGroupActivity(id: number, pass: boolean, comment: string): boolean {
  syncMockData();
  const current = activities.find((item) => item.id === id);
  if (!current || !canReviewInterestGroupActivity(current)) return false;
  activities = activities.map((item) =>
    item.id === id
      ? {
          ...item,
          auditStatus: pass ? '已通过' : '已驳回',
          rejectReason: pass ? undefined : normalizeRejectReason(comment),
        }
      : item,
  );
  emit();
  return true;
}

export function publishInterestGroupActivities(ids: number[]): number {
  syncMockData();
  const idSet = new Set(ids);
  const stamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  let done = 0;
  activities = activities.map((item) => {
    if (!idSet.has(item.id) || item.publishStatus === '已发布' || !canPublishInterestGroupActivity(item)) return item;
    done += 1;
    return { ...item, publishStatus: '已发布', publishedAt: item.publishedAt || stamp };
  });
  if (done) emit();
  return done;
}

export function unpublishInterestGroupActivities(ids: number[]): number {
  syncMockData();
  const idSet = new Set(ids);
  let done = 0;
  activities = activities.map((item) => {
    if (!idSet.has(item.id) || item.publishStatus !== '已发布') return item;
    done += 1;
    return { ...item, publishStatus: '未发布', publishedAt: '' };
  });
  if (done) emit();
  return done;
}

export type DeleteActivityResult = { ok: true } | { ok: false; reason: 'not-found' | 'has-signups' };
export type TerminateActivityResult = { ok: true } | { ok: false; reason: 'not-found' | 'not-allowed' };

export function deleteInterestGroupActivity(id: number): DeleteActivityResult {
  syncMockData();
  const current = activities.find((item) => item.id === id);
  if (!current) return { ok: false, reason: 'not-found' };
  if (!canDeleteInterestGroupActivity(current)) return { ok: false, reason: 'has-signups' };
  activities = activities.filter((item) => item.id !== id);
  signups = signups.filter((item) => item.activityId !== id);
  syncActivityCounts();
  emit();
  return { ok: true };
}

export function terminateInterestGroupActivity(id: number): TerminateActivityResult {
  syncMockData();
  const current = activities.find((item) => item.id === id);
  if (!current) return { ok: false, reason: 'not-found' };
  if (!canTerminateInterestGroupActivity(current)) return { ok: false, reason: 'not-allowed' };
  activities = activities.map((item) =>
    item.id === id
      ? {
          ...item,
          status: 'cancelled',
          sessions: item.sessions?.map((session) => ({ ...session, status: 'cancelled' as const })),
        }
      : item,
  );
  emit();
  return { ok: true };
}

export function viewerHasLikedInterestGroupActivity(activityId: number, name: string): boolean {
  return Boolean(activityLikers[activityId]?.includes(name));
}

export function joinInterestGroupAsEmployee(
  groupId: number,
  employeeName: string,
): 'joined' | 'pending' | 'already' | 'missing' {
  syncMockData();
  const group = groups.find((item) => item.id === groupId);
  if (!group) return 'missing';
  const existing = members.find((item) => item.groupId === groupId && (item.employeeId === employeeName || item.name === employeeName));
  if (existing?.status === '已通过') return 'already';
  if (existing?.status === '待审核') return 'pending';
  const person = orgPeopleByName[employeeName];
  const status: InterestGroupMemberStatus = '已通过';
  members = [
    {
      groupId,
      employeeId: employeeName,
      name: employeeName,
      department: person?.department ?? '—',
      role: 'member',
      status,
      joinedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
    ...members,
  ];
  if (status === '已通过') {
    groups = groups.map((item) => (item.id === groupId ? { ...item, memberCount: item.memberCount + 1 } : item));
  }
  emit();
  return status === '已通过' ? 'joined' : 'pending';
}

export function leaveInterestGroupAsEmployee(groupId: number, employeeName: string): 'left' | 'lead' | 'missing' {
  syncMockData();
  const current = members.find((item) => item.groupId === groupId && (item.employeeId === employeeName || item.name === employeeName));
  if (!current) return 'missing';
  if (current.role === 'lead') return 'lead';
  const wasApproved = current.status === '已通过';
  members = members.filter((item) => !(item.groupId === groupId && (item.employeeId === employeeName || item.name === employeeName)));
  if (wasApproved) {
    groups = groups.map((item) =>
      item.id === groupId ? { ...item, memberCount: Math.max(0, item.memberCount - 1) } : item,
    );
  }
  const activityIds = activities.filter((item) => item.groupId === groupId).map((item) => item.id);
  for (const activityId of activityIds) {
    cancelInterestGroupViewerSignups(activityId, employeeName);
  }
  emit();
  return 'left';
}

export function cancelInterestGroupViewerSignups(activityId: number, name: string, sessionId?: string): number {
  syncMockData();
  const drop = signups.filter(
    (item) =>
      item.activityId === activityId &&
      item.name === name &&
      (sessionId == null || item.sessionId === sessionId) &&
      occupiesInterestGroupSignupSlot(item.status),
  );
  if (!drop.length) return 0;
  const dropIds = new Set(drop.map((item) => item.id));
  for (const item of drop) {
    adjustSignedCount(activityId, item.sessionId, -1);
  }
  signups = signups.filter((item) => !dropIds.has(item.id));
  emit();
  return drop.length;
}

export function setInterestGroupViewerSessions(
  activityId: number,
  name: string,
  department: string,
  sessionIds: string[],
): void {
  syncMockData();
  const activity = activities.find((item) => item.id === activityId);
  if (!activity?.sessions?.length) return;
  const want = new Set(sessionIds);
  for (const session of activity.sessions) {
    const occupying = signups.find(
      (item) =>
        item.activityId === activityId &&
        item.name === name &&
        item.sessionId === session.id &&
        occupiesInterestGroupSignupSlot(item.status),
    );
    if (want.has(session.id) && !occupying) {
      addInterestGroupSignup({ activityId, name, department, sessionId: session.id });
    } else if (!want.has(session.id) && occupying) {
      cancelInterestGroupViewerSignups(activityId, name, session.id);
    }
  }
}

export function toggleInterestGroupActivityLike(activityId: number, name: string): boolean {
  syncMockData();
  const activity = activities.find((item) => item.id === activityId);
  if (!activity) return false;
  const liked = viewerHasLikedInterestGroupActivity(activityId, name);
  const names = new Set(activityLikers[activityId] ?? []);
  if (liked) names.delete(name);
  else names.add(name);
  activityLikers = { ...activityLikers, [activityId]: [...names] };
  activities = activities.map((item) =>
    item.id === activityId ? { ...item, likeCount: Math.max(0, item.likeCount + (liked ? -1 : 1)) } : item,
  );
  emit();
  return !liked;
}

export function addInterestGroupComment(activityId: number, author: string, content: string): InterestGroupComment | null {
  syncMockData();
  if (!activities.some((item) => item.id === activityId)) return null;
  const created: InterestGroupComment = {
    id: Math.max(0, ...comments.map((item) => item.id)) + 1,
    activityId,
    author,
    content,
    likedBy: [],
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };
  comments = [created, ...comments];
  emit();
  return created;
}

export function toggleInterestGroupCommentLike(commentId: number, name: string): boolean {
  syncMockData();
  const current = comments.find((item) => item.id === commentId);
  if (!current) return false;
  const liked = current.likedBy.includes(name);
  comments = comments.map((item) =>
    item.id === commentId
      ? { ...item, likedBy: liked ? item.likedBy.filter((who) => who !== name) : [...item.likedBy, name] }
      : item,
  );
  emit();
  return !liked;
}

export function toggleInterestGroupMomentLike(momentId: number, name: string): boolean {
  syncMockData();
  const current = moments.find((item) => item.id === momentId);
  if (!current) return false;
  const liked = current.likedBy.includes(name);
  return patchInterestGroupMoment(momentId, (item) => ({
    ...item,
    likedBy: liked ? item.likedBy.filter((who) => who !== name) : [...item.likedBy, name],
  }));
}

export function addEmployeeInterestGroupMoment(input: {
  groupId: number;
  activityId?: number;
  author: string;
  content: string;
  imageUrls: string[];
  videoUrl?: string;
}): InterestGroupMoment | null {
  syncMockData();
  if (!groups.some((item) => item.id === input.groupId)) return null;
  const stamp = nowText();
  const created: InterestGroupMoment = {
    id: Math.max(0, ...moments.map((item) => item.id)) + 1,
    groupId: input.groupId,
    activityId: input.activityId,
    author: input.author,
    content: input.content,
    type: input.videoUrl ? '视频' : '图文类型',
    imageUrls: input.videoUrl ? [] : input.imageUrls,
    videoUrl: input.videoUrl,
    status: '待审核',
    createdAt: stamp,
    updatedAt: stamp,
    likedBy: [],
    comments: [],
  };
  moments = [created, ...moments];
  emit();
  return created;
}

function employeeActivitySignupEndAt(
  input: Pick<
    InterestGroupActivityFormValues,
    'type' | 'signupEndAt' | 'repeatWeekday' | 'timeStart' | 'timeEnd' | 'cycleStart' | 'cycleEnd' | 'sessions' | 'signupHoursBefore'
  >,
): string {
  if (!needsSessionPick(input.type)) return input.signupEndAt;
  if (
    input.type === 'recurring' &&
    input.repeatWeekday != null &&
    input.timeStart &&
    input.timeEnd &&
    input.cycleStart &&
    input.cycleEnd
  ) {
    return syncSignupEndAt(
      generateRecurringSessions({
        repeatWeekday: input.repeatWeekday,
        timeStart: input.timeStart,
        timeEnd: input.timeEnd,
        cycleStart: input.cycleStart,
        cycleEnd: input.cycleEnd,
      }),
      input.signupHoursBefore ?? 0,
    );
  }
  return syncSignupEndAt(
    (input.sessions ?? []).map((session, index) => ({
      id: `draft-${index}`,
      startAt: session.startAt,
      endAt: session.endAt,
    })),
    input.signupHoursBefore ?? 0,
  );
}

export function createEmployeeInterestGroupActivity(
  input: Omit<InterestGroupActivityFormValues, 'visibility' | 'departments' | 'customPeople' | 'importFileName' | 'importedPeople' | 'notifyOnPublish' | 'needAudit' | 'signupApprovalNodes' | 'signupFields' | 'signupPoints' | 'signupPointsEnabled' | 'minSeniorityYears'> & {
    hostName: string;
  },
): InterestGroupActivity | null {
  syncMockData();
  const group = groups.find((item) => item.id === input.groupId);
  if (!group) return null;
  const { hostName, ...form } = input;
  const align = igActivityAlignDefaults();
  const payload: InterestGroupActivityFormValues = {
    ...align,
    ...form,
    coverUrl: form.coverUrl.trim(),
    title: form.title.trim().slice(0, 20),
    location: form.location.trim(),
    signupEndAt: employeeActivitySignupEndAt(form) || align.signupEndAt,
    visibility: align.visibility,
    departments: [],
    customPeople: [],
    importFileName: '',
    importedPeople: [],
    notifyOnPublish: false,
    needAudit: false,
    signupApprovalNodes: [],
    signupFields: align.signupFields,
    signupPoints: align.signupPoints,
    signupPointsEnabled: align.signupPointsEnabled,
  };
  if (validateInterestGroupActivityForm(payload, true)) return null;
  const created = upsertInterestGroupActivity(payload);
  const audit = '待审核' as const;
  const publish = '未发布' as const;
  const stamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  activities = activities.map((item) =>
    item.id === created.id
      ? {
          ...item,
          hostName,
          auditStatus: audit,
          publishStatus: publish,
          publishedAt: '',
        }
      : item,
  );
  emit();
  return activities.find((item) => item.id === created.id) ?? created;
}

export function removeInterestGroupComment(commentId: number): boolean {
  return removeInterestGroupComments([commentId]);
}

export function removeInterestGroupComments(ids: number[]): boolean {
  syncMockData();
  if (!ids.length) return false;
  const before = comments.length;
  comments = removeCommentsAndDescendants(comments as CommentRecord[], ids) as InterestGroupComment[];
  if (comments.length === before) return false;
  emit();
  return true;
}

function useStoreSlice<T>(selector: () => T): T {
  const [value, setValue] = useState<T>(() => selector());
  useEffect(() => {
    syncMockData();
    setValue(selector());
    const onChange = () => setValue(selector());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return value;
}

export function useInterestGroups() {
  return useStoreSlice(() => [...groups]);
}

export function useInterestGroupCategories() {
  return useStoreSlice(() => [...categories]);
}

export function useInterestGroupActivities() {
  return useStoreSlice(() => [...activities]);
}

export function useInterestGroupMembers() {
  return useStoreSlice(() => [...members]);
}

export function useInterestGroupComments() {
  return useStoreSlice(() => [...comments]);
}

export function useInterestGroupMoments() {
  return useStoreSlice(() => [...moments]);
}

export function useInterestGroupSignups() {
  return useStoreSlice(() => [...signups]);
}

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function patchInterestGroupMoment(id: number, updater: (item: InterestGroupMoment) => InterestGroupMoment): boolean {
  const current = moments.find((item) => item.id === id);
  if (!current) return false;
  moments = moments.map((item) => (item.id === id ? updater(item) : item));
  emit();
  return true;
}

export function approveInterestGroupMoments(ids: number[]): { done: number; skipped: number } {
  syncMockData();
  const idSet = new Set(ids);
  let done = 0;
  let skipped = 0;
  const stamp = nowText();
  moments = moments.map((item) => {
    if (!idSet.has(item.id)) return item;
    if (item.status !== '待审核') {
      skipped += 1;
      return item;
    }
    done += 1;
    return { ...item, status: '已通过' as const, rejectReason: undefined, updatedAt: stamp };
  });
  emit();
  return { done, skipped };
}

export function rejectInterestGroupMoments(
  ids: number[],
  reason: string,
): { done: number; skipped: number } | { ok: false; message: string } {
  syncMockData();
  const invalid = validateRejectReason(reason);
  if (invalid) return { ok: false, message: invalid };
  const idSet = new Set(ids);
  let done = 0;
  let skipped = 0;
  const stamp = nowText();
  moments = moments.map((item) => {
    if (!idSet.has(item.id)) return item;
    if (item.status !== '待审核') {
      skipped += 1;
      return item;
    }
    done += 1;
    return { ...item, status: '已驳回' as const, rejectReason: normalizeRejectReason(reason), updatedAt: stamp };
  });
  emit();
  return { done, skipped };
}

export function deleteInterestGroupMoment(id: number): boolean {
  syncMockData();
  if (!moments.some((item) => item.id === id)) return false;
  moments = moments.filter((item) => item.id !== id);
  emit();
  return true;
}

function nextMomentLineId(list: { id: number }[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

export function addInterestGroupMomentComment(
  id: number,
  content: string,
  user: string,
): { ok: true } | { ok: false; message: string } {
  syncMockData();
  const text = content.trim();
  if (!text) return { ok: false, message: '请输入评论' };
  const current = moments.find((item) => item.id === id);
  if (!current || current.status !== '已通过') return { ok: false, message: '仅已通过的瞬间可以评论' };
  patchInterestGroupMoment(id, (item) => ({
    ...item,
    comments: [
      ...item.comments,
      { id: nextMomentLineId(item.comments), author: user, content: text, createdAt: nowText(), replies: [] },
    ],
  }));
  return { ok: true };
}

export function addInterestGroupMomentReply(
  id: number,
  commentId: number,
  content: string,
  user: string,
  replyTo?: string,
): { ok: true } | { ok: false; message: string } {
  syncMockData();
  const text = content.trim();
  if (!text) return { ok: false, message: '请输入回复' };
  const current = moments.find((item) => item.id === id);
  if (!current || current.status !== '已通过') return { ok: false, message: '仅已通过的瞬间可以回复' };
  const comment = current.comments.find((item) => item.id === commentId);
  if (!comment) return { ok: false, message: '评论不存在' };
  const target = replyTo?.trim() || comment.author;
  patchInterestGroupMoment(id, (item) => ({
    ...item,
    comments: item.comments.map((entry) =>
      entry.id === commentId
        ? {
            ...entry,
            replies: [
              ...entry.replies,
              { id: nextMomentLineId(entry.replies), author: user, content: text, createdAt: nowText(), replyTo: target },
            ],
          }
        : entry,
    ),
  }));
  return { ok: true };
}

export function deleteInterestGroupMomentComment(id: number, commentId: number): boolean {
  syncMockData();
  const current = moments.find((item) => item.id === id);
  if (!current?.comments.some((item) => item.id === commentId)) return false;
  return patchInterestGroupMoment(id, (item) => ({
    ...item,
    comments: item.comments.filter((entry) => entry.id !== commentId),
  }));
}

export function deleteInterestGroupMomentReply(id: number, commentId: number, replyId: number): boolean {
  syncMockData();
  const current = moments.find((item) => item.id === id);
  const comment = current?.comments.find((item) => item.id === commentId);
  if (!comment?.replies.some((item) => item.id === replyId)) return false;
  return patchInterestGroupMoment(id, (item) => ({
    ...item,
    comments: item.comments.map((entry) =>
      entry.id === commentId ? { ...entry, replies: entry.replies.filter((reply) => reply.id !== replyId) } : entry,
    ),
  }));
}

/** @internal test helper */
export function __resetInterestGroupStoreForTest() {
  groups = [...initialInterestGroups];
  categories = [...initialInterestGroupCategories];
  activities = [...initialInterestGroupActivities];
  members = [...initialInterestGroupMembers];
  comments = [...initialInterestGroupComments];
  moments = [...initialInterestGroupMoments];
  signups = [...initialInterestGroupSignups];
  activityLikers = {};
  mockVersion = INTEREST_GROUP_MOCK_VERSION;
  categoryMockVersion = INTEREST_GROUP_CATEGORY_MOCK_VERSION;
  activityMockVersion = INTEREST_GROUP_ACTIVITY_MOCK_VERSION;
  momentMockVersion = INTEREST_GROUP_MOMENT_MOCK_VERSION;
  commentMockVersion = INTEREST_GROUP_COMMENT_MOCK_VERSION;
  syncActivityCounts();
  emit();
}
