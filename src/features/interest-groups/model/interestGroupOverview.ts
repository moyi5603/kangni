import dayjs from 'dayjs';
import type { InterestGroup } from './interestGroup';
import type { InterestGroupActivity, InterestGroupActivityStatus } from './interestGroupActivity';
import { getInterestGroupCategoryLabel, type InterestGroupCategory } from './interestGroupCategory';
import type { InterestGroupComment } from './interestGroupComment';
import type { InterestGroupMoment } from './interestGroupMoment';

export type InterestGroupOverviewStats = {
  groupCount: number;
  pendingGroupCount: number;
  employeeGroupCount: number;
  memberTotal: number;
  activityCount: number;
  publishedActivityCount: number;
  ongoingActivityCount: number;
  commentCount: number;
  momentCount: number;
  pendingMomentCount: number;
  groupAuditCounts: Record<'待审核' | '已通过' | '已驳回' | '无需审核', number>;
  activityStatusCounts: Record<'未开始' | '进行中' | '已结束' | '已终止', number>;
  categoryCounts: { key: string; label: string; value: number }[];
};

export type InterestGroupAttentionRow = {
  key: string;
  kind: '兴趣圈待审核';
  title: string;
  targetPage: 'interest-group-detail';
  recordId: string;
};

export function interestGroupInDateRange(
  group: Pick<InterestGroup, 'createdAt'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  const created = dayjs(group.createdAt);
  return !created.isBefore(from, 'day') && !created.isAfter(to, 'day');
}

export function interestGroupActivityInDateRange(
  activity: Pick<InterestGroupActivity, 'startAt' | 'endAt' | 'createdAt'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  const start = dayjs(activity.startAt || activity.createdAt);
  const end = dayjs(activity.endAt || activity.startAt || activity.createdAt);
  return !end.isBefore(from, 'day') && !start.isAfter(to, 'day');
}

const emptyGroupAudit = (): InterestGroupOverviewStats['groupAuditCounts'] => ({
  待审核: 0,
  已通过: 0,
  已驳回: 0,
  无需审核: 0,
});

const emptyActivityStatus = (): InterestGroupOverviewStats['activityStatusCounts'] => ({
  未开始: 0,
  进行中: 0,
  已结束: 0,
  已终止: 0,
});

const statusLabel: Record<InterestGroupActivityStatus, keyof InterestGroupOverviewStats['activityStatusCounts']> = {
  upcoming: '未开始',
  ongoing: '进行中',
  ended: '已结束',
  cancelled: '已终止',
};

export function computeInterestGroupOverviewStats(input: {
  groups: InterestGroup[];
  activities: InterestGroupActivity[];
  comments: InterestGroupComment[];
  moments: InterestGroupMoment[];
  categories: InterestGroupCategory[];
}): InterestGroupOverviewStats {
  const groupAuditCounts = emptyGroupAudit();
  input.groups.forEach((group) => {
    groupAuditCounts[group.auditStatus] += 1;
  });

  const activityStatusCounts = emptyActivityStatus();
  let publishedActivityCount = 0;
  let ongoingActivityCount = 0;

  input.activities.forEach((activity) => {
    activityStatusCounts[statusLabel[activity.status]] += 1;
    if (activity.publishStatus === '已发布') publishedActivityCount += 1;
    if (activity.status === 'ongoing') ongoingActivityCount += 1;
  });

  const categoryMap = new Map<string, number>();
  input.activities.forEach((activity) => {
    categoryMap.set(activity.categoryKey, (categoryMap.get(activity.categoryKey) ?? 0) + 1);
  });

  return {
    groupCount: input.groups.length,
    pendingGroupCount: groupAuditCounts.待审核,
    employeeGroupCount: input.groups.filter((item) => item.source === 'employee').length,
    memberTotal: input.groups.reduce((sum, item) => sum + item.memberCount, 0),
    activityCount: input.activities.length,
    publishedActivityCount,
    ongoingActivityCount,
    commentCount: input.comments.length,
    momentCount: input.moments.filter((item) => item.status !== '已驳回').length,
    pendingMomentCount: input.moments.filter((item) => item.status === '待审核').length,
    groupAuditCounts,
    activityStatusCounts,
    categoryCounts: [...categoryMap.entries()]
      .map(([key, value]) => ({
        key,
        label: getInterestGroupCategoryLabel(key, input.categories),
        value,
      }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label)),
  };
}

export type InterestGroupInProgressActivityRow = {
  activityId: number;
  title: string;
  groupName: string;
  startAt: string;
  endAt: string;
  signedCount: number;
};

export function buildInterestGroupInProgressRows(
  activities: InterestGroupActivity[],
  groups: InterestGroup[],
): InterestGroupInProgressActivityRow[] {
  const groupNameById = new Map(groups.map((item) => [item.id, item.name]));
  return activities
    .filter((activity) => activity.status === 'ongoing')
    .map((activity) => ({
      activityId: activity.id,
      title: activity.title,
      groupName: (activity.groupId != null ? groupNameById.get(activity.groupId) : undefined) ?? '—',
      startAt: activity.startAt ?? activity.createdAt,
      endAt: activity.endAt ?? activity.startAt ?? activity.createdAt,
      signedCount: activity.signedCount,
    }))
    .sort((left, right) => dayjs(left.startAt).valueOf() - dayjs(right.startAt).valueOf());
}

export function buildInterestGroupAttentionRows(groups: InterestGroup[]): InterestGroupAttentionRow[] {
  return groups
    .filter((item) => item.auditStatus === '待审核')
    .map((group) => ({
      key: `group-${group.id}`,
      kind: '兴趣圈待审核',
      title: group.name,
      targetPage: 'interest-group-detail',
      recordId: String(group.id),
    }));
}
