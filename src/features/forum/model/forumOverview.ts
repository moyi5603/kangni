import dayjs from 'dayjs';
import { defaultOverviewDateRange, type OverviewDateValue } from '../../activities/components/OverviewDateRange';
import { categorySegments } from '../../activities/components/ActivityOverviewVisuals';
import {
  filterTopics,
  isMailboxBoard,
  topicCommentCount,
  type ForumBoard,
  type ForumTopic,
  type MuteRecord,
} from './forum';

function inDayRange(value: string, from: dayjs.Dayjs, to: dayjs.Dayjs) {
  const day = dayjs(value);
  return !day.isBefore(from, 'day') && !day.isAfter(to, 'day');
}

export function forumBoardInDateRange(
  board: Pick<ForumBoard, 'createdAt'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  return inDayRange(board.createdAt, from, to);
}

export function forumTopicInDateRange(
  topic: Pick<ForumTopic, 'publishedAt'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  return inDayRange(topic.publishedAt, from, to);
}

export function forumMuteInDateRange(
  mute: Pick<MuteRecord, 'mutedAt'>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
): boolean {
  return inDayRange(mute.mutedAt, from, to);
}

export function defaultForumOverviewDateRange(now = dayjs()): OverviewDateValue {
  const [, to] = defaultOverviewDateRange(now);
  const seedFrom = dayjs('2026-08-01').startOf('day');
  const from = seedFrom.isAfter(to, 'day') ? to.startOf('day') : seedFrom;
  return [from, to];
}

export type ForumOverviewCount = { label: string; value: number };

export type ForumOverviewStats = {
  boardCount: number;
  topicCount: number;
  commentCount: number;
  activeMuteCount: number;
  boardCounts: ForumOverviewCount[];
  heatCounts: ForumOverviewCount[];
};

export type MailboxOverviewStats = {
  boardCount: number;
  adviceCount: number;
  repliedCount: number;
  pendingCount: number;
  boardCounts: ForumOverviewCount[];
  replyCounts: ForumOverviewCount[];
};

export type ForumLatestTopicRow = {
  id: number;
  title: string;
  boardName: string;
  author: string;
  publishedAt: string;
  pinned: boolean;
};

export type MailboxPendingAdviceRow = {
  id: number;
  title: string;
  boardName: string;
  chairName: string;
  publishedAt: string;
};

export const FORUM_HEAT_LABELS = ['无评论', '低互动', '中互动', '高互动'] as const;

export type ForumHeatLabel = (typeof FORUM_HEAT_LABELS)[number];

export function topicInteractionCount(topic: Pick<ForumTopic, 'comments'>): number {
  return topicCommentCount(topic.comments);
}

export function medianOf(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function forumHeatThresholds(counts: number[]): { median: number; highCut: number; max: number } {
  const max = counts.length ? Math.max(...counts) : 0;
  return { median: medianOf(counts), highCut: 0.8 * max, max };
}

export function classifyForumHeat(count: number, median: number, highCut: number): ForumHeatLabel {
  if (count <= 0) return '无评论';
  if (count > highCut) return '高互动';
  if (count <= median) return '低互动';
  return '中互动';
}

export function computeForumHeatCounts(topics: Pick<ForumTopic, 'comments'>[]): ForumOverviewCount[] {
  const counts = topics.map(topicInteractionCount);
  const { median, highCut } = forumHeatThresholds(counts);
  const tallies: Record<ForumHeatLabel, number> = {
    无评论: 0,
    低互动: 0,
    中互动: 0,
    高互动: 0,
  };
  for (const count of counts) {
    tallies[classifyForumHeat(count, median, highCut)] += 1;
  }
  return FORUM_HEAT_LABELS.map((label) => ({ label, value: tallies[label] }));
}

export function computeForumOverviewStats(
  boards: ForumBoard[],
  topics: ForumTopic[],
  mutes: MuteRecord[],
): ForumOverviewStats {
  const forumBoards = boards.filter((item) => !isMailboxBoard(item));
  const forumTopics = filterTopics(topics, boards, { kind: 'forum' });
  return {
    boardCount: forumBoards.length,
    topicCount: forumTopics.length,
    commentCount: forumTopics.reduce((sum, item) => sum + topicInteractionCount(item), 0),
    activeMuteCount: mutes.filter((item) => item.active).length,
    boardCounts: forumBoards.map((board) => ({
      label: board.name,
      value: forumTopics.filter((item) => item.boardName === board.name).length,
    })),
    heatCounts: computeForumHeatCounts(forumTopics),
  };
}

export function computeMailboxOverviewStats(boards: ForumBoard[], topics: ForumTopic[]): MailboxOverviewStats {
  const mailboxBoards = boards.filter(isMailboxBoard);
  const advice = filterTopics(topics, boards, { kind: 'mailbox' });
  const repliedCount = advice.filter((item) => Boolean(item.chairmanReply)).length;
  return {
    boardCount: mailboxBoards.length,
    adviceCount: advice.length,
    repliedCount,
    pendingCount: advice.length - repliedCount,
    boardCounts: mailboxBoards.map((board) => ({
      label: board.name,
      value: advice.filter((item) => item.boardName === board.name).length,
    })),
    replyCounts: [
      { label: '已回复', value: repliedCount },
      { label: '待回复', value: advice.length - repliedCount },
    ],
  };
}

export function buildForumLatestRows(boards: ForumBoard[], topics: ForumTopic[], limit = 8): ForumLatestTopicRow[] {
  return filterTopics(topics, boards, { kind: 'forum' })
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.title,
      boardName: item.boardName,
      author: item.author,
      publishedAt: item.publishedAt,
      pinned: Boolean(item.pinScope),
    }));
}

export function buildMailboxPendingRows(boards: ForumBoard[], topics: ForumTopic[], limit = 8): MailboxPendingAdviceRow[] {
  return filterTopics(topics, boards, { kind: 'mailbox' })
    .filter((item) => !item.chairmanReply)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.title,
      boardName: item.boardName,
      chairName: item.chairName ?? '—',
      publishedAt: item.publishedAt,
    }));
}

export function forumBoardSegments(counts: ForumOverviewCount[]) {
  return categorySegments(counts);
}

export function mailboxReplySegments(counts: ForumOverviewCount[]) {
  const colors: Record<string, string> = { 已回复: '#52c41a', 待回复: '#fa8c16' };
  return counts.map((item) => ({ ...item, color: colors[item.label] ?? '#8c8c8c' }));
}

export function forumHeatSegments(counts: ForumOverviewCount[]) {
  const colors: Record<string, string> = {
    无评论: '#8c8c8c',
    低互动: '#1677ff',
    中互动: '#13c2c2',
    高互动: '#fa541c',
  };
  return counts.map((item) => ({ ...item, color: colors[item.label] ?? '#8c8c8c' }));
}
