import dayjs from 'dayjs';
import { describe, expect, it, beforeEach } from 'vitest';
import { defaultVoteV2Campaign, defaultVoteV2Contestant } from './voteV2';
import {
  buildVoteV2InProgressRows,
  computeVoteV2OverviewStats,
  voteV2InDateRange,
  voteV2StatusSegments,
} from './voteV2Overview';
import { __resetVoteV2StoreForTests, getVoteV2Campaigns, getVoteV2Casts } from './voteV2Store';

describe('voteV2Overview', () => {
  beforeEach(() => {
    __resetVoteV2StoreForTests();
  });

  it('summarizes seed campaigns and unique participants', () => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const stats = computeVoteV2OverviewStats(getVoteV2Campaigns(), getVoteV2Casts(), now);
    expect(stats.campaignCount).toBe(8);
    expect(stats.ongoingCount).toBeGreaterThan(0);
    expect(stats.upcomingCount).toBeGreaterThan(0);
    expect(stats.endedCount).toBeGreaterThan(0);
    expect(stats.participantCount).toBeGreaterThan(0);
    expect(stats.totalViewCount).toBe(
      getVoteV2Campaigns().reduce((sum, item) => sum + item.viewCount, 0),
    );
    expect(voteV2StatusSegments(stats.statusCounts).map((item) => item.label)).toEqual(['未开始', '进行中', '已结束']);
  });

  it('counts unique voters as participants', () => {
    const campaigns = [
      defaultVoteV2Campaign({
        id: 1,
        name: 'A',
        startAt: '2026-08-20 09:00:00',
        endAt: '2026-09-10 18:00:00',
        createdAt: '2026-08-10 10:00:00',
      }),
    ];
    const stats = computeVoteV2OverviewStats(
      campaigns,
      [
        { campaignId: 1, contestantId: 1, userId: '李明', at: '2026-08-21 09:00:00' },
        { campaignId: 1, contestantId: 2, userId: '李明', at: '2026-08-21 09:00:00' },
        { campaignId: 1, contestantId: 1, userId: '王芳', at: '2026-08-22 09:00:00' },
      ],
      '2026-09-02 12:00:00',
    );
    expect(stats.participantCount).toBe(2);
  });

  it('lists only ongoing campaigns', () => {
    const now = '2026-09-02 12:00:00';
    const campaigns = [
      defaultVoteV2Campaign({
        id: 1,
        name: '进行中',
        startAt: '2026-08-20 09:00:00',
        endAt: '2026-09-10 18:00:00',
        createdAt: '2026-08-10 10:00:00',
      }),
      defaultVoteV2Campaign({
        id: 2,
        name: '未开始',
        startAt: '2026-09-10 09:00:00',
        endAt: '2026-09-20 18:00:00',
        createdAt: '2026-08-20 10:00:00',
      }),
    ];
    const contestants = [defaultVoteV2Contestant({ id: 1, campaignId: 1, name: '甲', voteCount: 8 })];
    const rows = buildVoteV2InProgressRows(campaigns, contestants, now);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: '进行中', optionCount: 1, voteCount: 8, viewCount: 0 });
  });

  it('filters campaigns by schedule overlap or createdAt', () => {
    const campaign = defaultVoteV2Campaign({
      id: 9,
      name: 'R',
      startAt: '2026-09-20 09:00:00',
      endAt: '2026-09-25 18:00:00',
      createdAt: '2026-08-10 10:00:00',
    });
    expect(voteV2InDateRange(campaign, dayjs('2026-08-04'), dayjs('2026-09-02'))).toBe(true);
    expect(voteV2InDateRange(campaign, dayjs('2026-07-01'), dayjs('2026-07-31'))).toBe(false);
  });
});
