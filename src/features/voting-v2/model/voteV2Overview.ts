import dayjs from 'dayjs';
import {
  resolveVoteV2Status,
  sumVoteV2ContestantVotes,
  voteV2Statuses,
  type VoteV2Campaign,
  type VoteV2Cast,
  type VoteV2Contestant,
  type VoteV2Status,
} from './voteV2';

export type VoteV2OverviewStats = {
  campaignCount: number;
  upcomingCount: number;
  ongoingCount: number;
  endedCount: number;
  participantCount: number;
  totalViewCount: number;
  statusCounts: Record<VoteV2Status, number>;
};

export type VoteV2InProgressRow = {
  campaignId: number;
  title: string;
  startAt: string;
  endAt: string;
  optionCount: number;
  voteCount: number;
  viewCount: number;
};

export function voteV2InDateRange(
  campaign: Pick<VoteV2Campaign, 'startAt' | 'endAt' | 'createdAt'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  const start = dayjs(campaign.startAt);
  const end = dayjs(campaign.endAt);
  const created = dayjs(campaign.createdAt);
  const scheduleOverlap = !end.isBefore(from, 'day') && !start.isAfter(to, 'day');
  const createdInRange = !created.isBefore(from, 'day') && !created.isAfter(to, 'day');
  return scheduleOverlap || createdInRange;
}

const emptyStatus = (): Record<VoteV2Status, number> => ({
  未开始: 0,
  进行中: 0,
  已结束: 0,
});

export function computeVoteV2OverviewStats(
  campaigns: VoteV2Campaign[],
  casts: VoteV2Cast[],
  now: string,
): VoteV2OverviewStats {
  const statusCounts = emptyStatus();
  campaigns.forEach((campaign) => {
    statusCounts[resolveVoteV2Status(campaign, now)] += 1;
  });

  const scopedIds = new Set(campaigns.map((item) => item.id));
  const participants = new Set(
    casts.filter((item) => scopedIds.has(item.campaignId)).map((item) => item.userId),
  );

  return {
    campaignCount: campaigns.length,
    upcomingCount: statusCounts.未开始,
    ongoingCount: statusCounts.进行中,
    endedCount: statusCounts.已结束,
    participantCount: participants.size,
    totalViewCount: campaigns.reduce((sum, item) => sum + item.viewCount, 0),
    statusCounts,
  };
}

export function buildVoteV2InProgressRows(
  campaigns: VoteV2Campaign[],
  contestants: VoteV2Contestant[],
  now: string,
): VoteV2InProgressRow[] {
  return campaigns
    .filter((item) => resolveVoteV2Status(item, now) === '进行中')
    .map((campaign) => {
      const rows = contestants.filter((item) => item.campaignId === campaign.id);
      return {
        campaignId: campaign.id,
        title: campaign.name,
        startAt: campaign.startAt,
        endAt: campaign.endAt,
        optionCount: rows.length,
        voteCount: sumVoteV2ContestantVotes(rows),
        viewCount: campaign.viewCount,
      };
    })
    .sort((left, right) => dayjs(left.endAt).valueOf() - dayjs(right.endAt).valueOf());
}

const voteStatusColors: Record<VoteV2Status, string> = {
  未开始: '#8c8c8c',
  进行中: '#1677ff',
  已结束: '#52c41a',
};

export function voteV2StatusSegments(counts: Record<VoteV2Status, number>) {
  return voteV2Statuses.map((status) => ({
    label: status,
    value: counts[status],
    color: voteStatusColors[status],
  }));
}
