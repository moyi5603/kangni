import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { initialBoards, initialMutes, initialTopics } from './forum';
import {
  buildForumLatestRows,
  buildMailboxPendingRows,
  classifyForumHeat,
  computeForumOverviewStats,
  computeMailboxOverviewStats,
  defaultForumOverviewDateRange,
  forumBoardInDateRange,
  forumHeatThresholds,
  forumMuteInDateRange,
  forumTopicInDateRange,
} from './forumOverview';

describe('forum overview stats', () => {
  it('counts forum boards, posts, comments, pins and active mutes', () => {
    const stats = computeForumOverviewStats(initialBoards, initialTopics, initialMutes);
    expect(stats.boardCount).toBe(2);
    expect(stats.topicCount).toBe(14);
    expect(stats.commentCount).toBe(18);
    expect(stats.activeMuteCount).toBe(1);
    expect(stats.boardCounts).toEqual([
      { label: '二手论坛', value: 7 },
      { label: '建议论坛', value: 7 },
    ]);
    expect(stats.heatCounts.map((item) => item.label)).toEqual(['无评论', '低互动', '中互动', '高互动']);
    expect(stats.heatCounts.reduce((sum, item) => sum + item.value, 0)).toBe(14);
    expect(stats).not.toHaveProperty('tagCounts');
    expect(stats).not.toHaveProperty('pinCounts');
    expect(stats).not.toHaveProperty('pinnedCount');
  });

  it('bins interaction heat with zero / median / 80% of max', () => {
    const counts = [0, 0, 1, 2, 5, 10];
    const { median, highCut } = forumHeatThresholds(counts);
    expect(median).toBe(1.5);
    expect(highCut).toBe(8);
    expect(classifyForumHeat(0, median, highCut)).toBe('无评论');
    expect(classifyForumHeat(1, median, highCut)).toBe('低互动');
    expect(classifyForumHeat(2, median, highCut)).toBe('中互动');
    expect(classifyForumHeat(5, median, highCut)).toBe('中互动');
    expect(classifyForumHeat(10, median, highCut)).toBe('高互动');
  });

  it('gives high band priority when 80% of max sits below median', () => {
    const counts = [1, 1, 1];
    const { median, highCut } = forumHeatThresholds(counts);
    expect(median).toBe(1);
    expect(highCut).toBe(0.8);
    expect(classifyForumHeat(1, median, highCut)).toBe('高互动');
  });

  it('lists pinned forum topics first in latest rows', () => {
    const rows = buildForumLatestRows(initialBoards, initialTopics, 3);
    expect(rows.map((item) => item.title)).toEqual([
      '九成新人体工学椅转让，可自提',
      '建议食堂增加低糖早餐选项',
      '建议增加晚班通勤班车',
    ]);
    expect(rows[0]?.pinned).toBe(true);
  });

  it('keeps board, topic and mute inside overlapping day range', () => {
    const board = initialBoards.find((item) => item.name === '建议论坛')!;
    const topic = initialTopics.find((item) => item.title === '建议食堂增加低糖早餐选项')!;
    const mute = initialMutes[0]!;
    expect(forumBoardInDateRange(board, dayjs('2026-08-01'), dayjs('2026-08-31'))).toBe(true);
    expect(forumBoardInDateRange(board, dayjs('2026-09-01'), dayjs('2026-09-30'))).toBe(false);
    expect(forumTopicInDateRange(topic, dayjs('2026-08-12'), dayjs('2026-08-12'))).toBe(true);
    expect(forumTopicInDateRange(topic, dayjs('2026-08-13'), dayjs('2026-08-31'))).toBe(false);
    expect(forumMuteInDateRange(mute, dayjs('2026-08-18'), dayjs('2026-08-18'))).toBe(true);
    expect(forumMuteInDateRange(mute, dayjs('2026-08-01'), dayjs('2026-08-17'))).toBe(false);
  });

  it('defaults overview range from seed month through today', () => {
    const [from, to] = defaultForumOverviewDateRange(dayjs('2026-09-17'));
    expect(from.format('YYYY-MM-DD')).toBe('2026-08-01');
    expect(to.format('YYYY-MM-DD')).toBe('2026-09-17');
    expect(forumTopicInDateRange(initialTopics[0]!, from, to)).toBe(true);
  });
});

describe('mailbox overview stats', () => {
  it('counts mailboxes, advice, reply status and pending rows', () => {
    const stats = computeMailboxOverviewStats(initialBoards, initialTopics);
    expect(stats.boardCount).toBe(4);
    expect(stats.adviceCount).toBe(8);
    expect(stats.repliedCount).toBe(2);
    expect(stats.pendingCount).toBe(6);
    expect(stats.replyCounts).toEqual([
      { label: '已回复', value: 2 },
      { label: '待回复', value: 6 },
    ]);
    const pending = buildMailboxPendingRows(initialBoards, initialTopics);
    expect(pending).toHaveLength(6);
    expect(pending.map((item) => item.title)).not.toContain('关于跨部门项目职责边界不清的情况反馈');
    expect(pending[0]?.title).toBe('关于跨部门重点项目协同机制的建议');
  });
});
