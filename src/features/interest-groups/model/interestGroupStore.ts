import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { orgPeopleByName } from '../../activities/model/activity';
import {
  INTEREST_GROUP_MOCK_VERSION,
  initialInterestGroups,
  normalizeInterestGroupTags,
  type InterestGroup,
  type InterestGroupFormValues,
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
  initialInterestGroupActivities,
  type InterestGroupActivity,
  type InterestGroupActivityFormValues,
} from './interestGroupActivity';
import {
  initialInterestGroupMembers,
  type InterestGroupMember,
  type InterestGroupMemberStatus,
} from './interestGroupMember';
import { INTEREST_GROUP_COMMENT_MOCK_VERSION, initialInterestGroupComments, type InterestGroupComment } from './interestGroupComment';
import { removeCommentsAndDescendants } from '../../activities/model/commentTree';
import type { CommentRecord } from '../../activities/model/related';
import {
  INTEREST_GROUP_MOMENT_MOCK_VERSION,
  initialInterestGroupMoments,
  type InterestGroupMoment,
} from './interestGroupMoment';
import { validateRejectReason } from '../../activities/model/moment';
import { initialInterestGroupSignups, type InterestGroupSignup } from './interestGroupSignup';

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
): { done: number; skipped: number } {
  syncMockData();
  const idSet = new Set(employeeIds);
  let done = 0;
  let skipped = 0;
  members = members.map((item) => {
    if (item.groupId !== groupId || !idSet.has(item.employeeId)) return item;
    if (item.role === 'lead' || item.status !== '待审核') {
      skipped += 1;
      return item;
    }
    done += 1;
    return { ...item, status };
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

export function upsertInterestGroup(values: InterestGroupFormValues, id?: number): InterestGroup {
  syncMockData();
  const employee = orgPeopleByName[values.leadEmployeeId];
  const payload = {
    name: values.name.trim(),
    categoryKey: values.categoryKey,
    leadEmployeeId: values.leadEmployeeId,
    leadName: employee?.name ?? values.leadEmployeeId,
    joinMode: values.joinMode,
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
  const created: InterestGroup = {
    id: nextId,
    ...payload,
    memberCount: 1,
    activityCount: 0,
    createdAt,
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
  const sessions =
    values.type === 'series'
      ? (values.sessions ?? []).map((session, index) => ({
          id: current?.sessions?.[index]?.id ?? `s-${Date.now()}-${index}`,
          startAt: session.startAt,
          endAt: session.endAt,
          capacity: values.capacity,
          signedCount: current?.sessions?.[index]?.signedCount ?? 0,
          status: current?.sessions?.[index]?.status ?? ('upcoming' as const),
        }))
      : values.type === 'recurring'
        ? current?.sessions
        : undefined;
  return {
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
    startAt: values.type === 'once' ? values.startAt : current?.startAt,
    endAt: values.type === 'once' ? values.endAt : current?.endAt,
    repeatWeekdays: values.type === 'recurring' ? (current?.repeatWeekdays ?? (values.repeatWeekday != null ? [values.repeatWeekday] : [])) : undefined,
    timeStart: values.type === 'recurring' ? values.timeStart : current?.timeStart,
    timeEnd: values.type === 'recurring' ? values.timeEnd : current?.timeEnd,
    sessions,
    seriesSignupMode: values.type === 'series' ? values.seriesSignupMode ?? 'independent' : undefined,
    deadlineMode: values.deadlineMode,
    deadlineAt: values.deadlineMode === 'fixed' ? values.deadlineAt : undefined,
    deadlineHoursBefore: values.deadlineMode === 'hours_before' ? values.deadlineHoursBefore : undefined,
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
          rejectReason: pass ? undefined : comment.trim(),
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
    return { ...item, status: '已驳回' as const, rejectReason: reason.trim(), updatedAt: stamp };
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
  mockVersion = INTEREST_GROUP_MOCK_VERSION;
  categoryMockVersion = INTEREST_GROUP_CATEGORY_MOCK_VERSION;
  activityMockVersion = INTEREST_GROUP_ACTIVITY_MOCK_VERSION;
  momentMockVersion = INTEREST_GROUP_MOMENT_MOCK_VERSION;
  commentMockVersion = INTEREST_GROUP_COMMENT_MOCK_VERSION;
  syncActivityCounts();
  emit();
}
