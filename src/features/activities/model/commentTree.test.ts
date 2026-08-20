import { describe, expect, it } from 'vitest';
import type { CommentRecord } from './related';
import {
  buildCommentThreads,
  collectCommentSubtreeIds,
  commentDepth,
  commentReplyLabel,
  removeCommentsAndDescendants,
} from './commentTree';

const list: CommentRecord[] = [
  { id: 1, activityId: 1, content: 'root', author: '张悦', createdAt: '2026-04-12 18:20:00', likedBy: [] },
  { id: 2, activityId: 1, content: 'newer root', author: '李明', createdAt: '2026-04-12 19:05:00', likedBy: [] },
  { id: 3, activityId: 1, content: 'reply to 1', author: '王芳', createdAt: '2026-04-12 18:40:00', parentId: 1, likedBy: [] },
  { id: 4, activityId: 1, content: 'reply to 3', author: '陈产品', createdAt: '2026-04-12 18:50:00', parentId: 3, likedBy: [] },
  { id: 5, activityId: 1, content: 'old root', author: '苏然', createdAt: '2026-04-12 17:00:00', likedBy: [] },
];

describe('comment tree', () => {
  it('orders roots newest first and flattens descendants oldest first with A 回复 B', () => {
    const threads = buildCommentThreads(list);
    expect(threads.map((item) => item.root.id)).toEqual([2, 1, 5]);
    expect(threads[1]?.replies.map((item) => item.id)).toEqual([3, 4]);
    expect(threads[1]?.replies[0]?.replyLabel).toBe('王芳 回复 张悦');
    expect(threads[1]?.replies[1]?.replyLabel).toBe('陈产品 回复 王芳');
  });

  it('counts depth from the root and treats missing parent as depth 1', () => {
    expect(commentDepth(1, list)).toBe(1);
    expect(commentDepth(3, list)).toBe(2);
    expect(commentDepth(4, list)).toBe(3);
    expect(commentDepth(99, list)).toBe(1);
    expect(commentDepth(4, [{ ...list[3]!, parentId: 99 }])).toBe(1);
  });

  it('collects a node and all descendants', () => {
    expect([...collectCommentSubtreeIds(1, list)].sort((a, b) => a - b)).toEqual([1, 3, 4]);
    expect([...collectCommentSubtreeIds(2, list)]).toEqual([2]);
  });

  it('labels a reply using the parent author', () => {
    expect(commentReplyLabel(list[2]!, list)).toBe('王芳 回复 张悦');
    expect(commentReplyLabel(list[0]!, list)).toBe('张悦');
  });

  it('removes selected roots and their descendants', () => {
    const next = removeCommentsAndDescendants(list, [1]);
    expect(next.map((item) => item.id).sort((a, b) => a - b)).toEqual([2, 5]);
  });

  it('caps depth at 3 for a 4-layer chain', () => {
    const fourLayer: CommentRecord[] = [
      ...list,
      {
        id: 6,
        activityId: 1,
        content: 'reply to 4',
        author: '李明',
        createdAt: '2026-04-12 18:55:00',
        parentId: 4,
        likedBy: [],
      },
    ];
    expect(commentDepth(6, fourLayer)).toBe(3);
  });
});
