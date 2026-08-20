import { afterEach, describe, expect, it } from 'vitest';
import { commentDepth } from '../../../activities/model/commentTree';
import { getRelatedList, patchRelated, restoreRelatedComments } from '../../../activities/model/related';
import { DEMO_SIGNUP_USER } from './signupStore';
import {
  commentCount,
  deleteActivityComment,
  listActivityComments,
  listActivityCommentThreads,
  nextVisibleCommentCount,
  sliceCommentThreads,
  submitActivityComment,
  toggleCommentLike,
  formatCommentDisplayTime,
} from './activityComments';

describe('activity comments', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('lists comments newest first', () => {
    const list = listActivityComments(1);
    expect(list.map((item) => item.id)).toEqual([
      43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 11, 2, 10, 5, 1, 12, 7, 9, 6, 8,
    ]);
    expect(list[0]?.author).toBe('赵人事');
  });

  it('writes trimmed content as 陈产品', () => {
    expect(submitActivityComment(2, '  很不错  ')).toBe('ok');
    const first = listActivityComments(2)[0];
    expect(first?.author).toBe(DEMO_SIGNUP_USER.name);
    expect(first?.content).toBe('很不错');
    expect(first?.activityId).toBe(2);
    expect(getRelatedList('comments')[0]).toMatchObject({
      author: DEMO_SIGNUP_USER.name,
      content: '很不错',
      activityId: 2,
    });
  });

  it('rejects blank comments', () => {
    const before = getRelatedList('comments').length;
    expect(submitActivityComment(2, '   ')).toBe('empty');
    expect(getRelatedList('comments')).toHaveLength(before);
  });

  it('builds threads with flattened replies', () => {
    const threads = listActivityCommentThreads(1);
    expect(threads.map((item) => item.root.id)).toEqual([
      43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 2, 1, 7, 9, 6, 8,
    ]);
    expect(threads[21]?.replies.map((item) => item.replyLabel)).toEqual(['王芳 回复 张悦', '陈产品 回复 王芳']);
  });

  it('replies to a depth-3 comment stay on that parent', () => {
    expect(submitActivityComment(1, '一层回', 1)).toBe('ok');
    const firstReply = getRelatedList('comments').find((item) => item.content === '一层回')!;
    expect(submitActivityComment(1, '二层回', firstReply.id)).toBe('ok');
    const second = getRelatedList('comments').find((item) => item.content === '二层回')!;
    expect(commentDepth(second.id, getRelatedList('comments').filter((item) => item.activityId === 1))).toBe(3);
    expect(submitActivityComment(1, '仍三层', second.id)).toBe('ok');
    const third = getRelatedList('comments').find((item) => item.content === '仍三层')!;
    expect(third.parentId).toBe(second.id);
    expect(commentDepth(third.id, getRelatedList('comments').filter((item) => item.activityId === 1))).toBe(3);
  });

  it('deletes own comment with descendants and ignores others', () => {
    expect(submitActivityComment(1, '我的楼')).toBe('ok');
    const mine = getRelatedList('comments').find((item) => item.content === '我的楼')!;
    expect(submitActivityComment(1, '别人回不了删', mine.id)).toBe('ok');
    const before = getRelatedList('comments').length;
    expect(deleteActivityComment(1)).toBe('forbidden');
    expect(getRelatedList('comments')).toHaveLength(before);
    expect(deleteActivityComment(mine.id)).toBe('ok');
    expect(getRelatedList('comments').some((item) => item.id === mine.id)).toBe(false);
    expect(getRelatedList('comments').some((item) => item.content === '别人回不了删')).toBe(false);
  });

  it('toggles likes for 陈产品', () => {
    expect(toggleCommentLike(2)).toBe('ok');
    expect(getRelatedList('comments').find((item) => item.id === 2)?.likedBy).toContain('陈产品');
    expect(toggleCommentLike(2)).toBe('ok');
    expect(getRelatedList('comments').find((item) => item.id === 2)?.likedBy).not.toContain('陈产品');
    expect(toggleCommentLike(999)).toBe('missing');
  });

  it('counts root threads in commentCount', () => {
    expect(commentCount(1)).toBe(26);
    expect(commentCount(2)).toBe(6);
  });

  it('orders camp roots newest first with two-layer replies', () => {
    const threads = listActivityCommentThreads(2);
    expect(threads.map((item) => item.root.id)).toEqual([19, 18, 17, 16, 15, 3]);
    expect(threads[3]?.replies.map((item) => item.replyLabel)).toEqual(['王芳 回复 苏然', '陈产品 回复 王芳']);
  });

  it('slices root threads for paged detail', () => {
    const threads = listActivityCommentThreads(1);
    expect(sliceCommentThreads(threads, 10)).toHaveLength(10);
    expect(sliceCommentThreads(threads, 2).map((item) => item.root.id)).toEqual([43, 42]);
    expect(sliceCommentThreads(threads, 2)[0]?.replies).toEqual([]);
    expect(nextVisibleCommentCount(10, 12)).toBe(12);
    expect(nextVisibleCommentCount(10, 25)).toBe(20);
    expect(nextVisibleCommentCount(6, 6)).toBe(6);
  });

  it('formats this-year comments as month-day time, other years with year', () => {
    const now = new Date('2026-08-20T12:00:00');
    expect(formatCommentDisplayTime('2026-04-13 10:19:00', now)).toBe('4月13日 10:19');
    expect(formatCommentDisplayTime('2025-12-01 08:00:00', now)).toBe('2025年12月1日 08:00');
  });
});
