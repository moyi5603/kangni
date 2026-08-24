import { beforeEach, describe, expect, it } from 'vitest';
import { formatExamRankClock, getClientExamRankBoard } from './clientExamRank';
import { __resetExamResultsForTests } from './clientExamResult';

describe('client exam rank', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('pins the current user first then the remaining ranks', () => {
    const board = getClientExamRankBoard(6);
    expect(board?.rows.map((item) => item.name)).toEqual(['张悦', '李明', '王芳', '陈伟']);
    expect(board?.rows.map((item) => item.rank)).toEqual([2, 1, 3, 4]);
    expect(board?.rows[0]).toMatchObject({ isMe: true, score: 100, durationSeconds: 5 });
    expect(board?.rows.slice(1).every((item) => !item.isMe)).toBe(true);
  });

  it('formats rank duration as MM:SS', () => {
    expect(formatExamRankClock(5)).toBe('00:05');
    expect(formatExamRankClock(8)).toBe('00:08');
    expect(formatExamRankClock(64)).toBe('01:04');
  });
});
