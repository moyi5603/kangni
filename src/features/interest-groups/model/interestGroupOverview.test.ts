import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { initialInterestGroups } from './interestGroup';
import { initialInterestGroupActivities } from './interestGroupActivity';
import { initialInterestGroupCategories } from './interestGroupCategory';
import { initialInterestGroupComments } from './interestGroupComment';
import { initialInterestGroupMoments } from './interestGroupMoment';
import {
  buildInterestGroupAttentionRows,
  buildInterestGroupInProgressRows,
  computeInterestGroupOverviewStats,
  interestGroupActivityInDateRange,
  interestGroupInDateRange,
} from './interestGroupOverview';

describe('interestGroupOverview', () => {
  it('summarizes seed groups, activities and social records', () => {
    const stats = computeInterestGroupOverviewStats({
      groups: initialInterestGroups,
      activities: initialInterestGroupActivities,
      comments: initialInterestGroupComments,
      moments: initialInterestGroupMoments,
      categories: initialInterestGroupCategories,
    });

    expect(stats.groupCount).toBe(initialInterestGroups.length);
    expect(stats.pendingGroupCount).toBe(1);
    expect(stats.employeeGroupCount).toBe(3);
    expect(stats.publishedActivityCount).toBeGreaterThan(0);
    expect(stats.ongoingActivityCount).toBe(1);
    expect(stats.groupAuditCounts.待审核).toBe(1);
    expect(stats.activityStatusCounts.进行中).toBe(1);
    expect(stats.activityStatusCounts.已终止).toBe(1);
    expect(stats.categoryCounts.some((item) => item.label === '运动健身' && item.value >= 1)).toBe(true);
    expect(stats.categoryCounts.reduce((sum, item) => sum + item.value, 0)).toBe(initialInterestGroupActivities.length);
  });

  it('lists only pending groups in follow-up work', () => {
    const rows = buildInterestGroupAttentionRows(initialInterestGroups);
    expect(rows.map((item) => item.kind)).toEqual(['兴趣圈待审核']);
    expect(rows[0]?.title).toBe('午休飞盘局');
  });

  it('filters groups by created date', () => {
    const group = initialInterestGroups.find((item) => item.name === '午休飞盘局')!;
    expect(interestGroupInDateRange(group, dayjs('2026-08-01'), dayjs('2026-08-31'))).toBe(true);
    expect(interestGroupInDateRange(group, dayjs('2026-06-01'), dayjs('2026-06-30'))).toBe(false);
  });

  it('filters activities by start/end overlap', () => {
    const activity = { startAt: '2026-08-31 09:00', endAt: '2026-09-10 16:00' };
    expect(interestGroupActivityInDateRange(activity, dayjs('2026-08-04'), dayjs('2026-09-02'))).toBe(true);
    expect(interestGroupActivityInDateRange(activity, dayjs('2026-07-01'), dayjs('2026-07-31'))).toBe(false);
  });

  it('lists ongoing activities with group names', () => {
    const rows = buildInterestGroupInProgressRows(initialInterestGroupActivities, initialInterestGroups);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: '周末连营徒步', groupName: '周末徒步野行' });
  });
});
