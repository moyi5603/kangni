import type { CommentRecord } from './related';

export const COMMENT_PAGE_SIZE = 10;

export type CommentThreadReply = CommentRecord & { replyLabel: string };

export type CommentThread = {
  root: CommentRecord;
  replies: CommentThreadReply[];
};

function byId(list: CommentRecord[]): Map<number, CommentRecord> {
  return new Map(list.map((item) => [item.id, item]));
}

export function commentDepth(id: number, list: CommentRecord[]): number {
  const map = byId(list);
  let current = map.get(id);
  if (!current) return 1;
  let depth = 1;
  const seen = new Set<number>([id]);
  while (current.parentId != null) {
    const parent = map.get(current.parentId);
    if (!parent || seen.has(parent.id)) return 1;
    seen.add(parent.id);
    depth += 1;
    current = parent;
  }
  return Math.min(3, depth);
}

export function collectCommentSubtreeIds(rootId: number, list: CommentRecord[]): Set<number> {
  const ids = new Set<number>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const item of list) {
      if (item.parentId != null && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        added = true;
      }
    }
  }
  return ids;
}

export function removeCommentsAndDescendants(list: CommentRecord[], rootIds: number[]): CommentRecord[] {
  const drop = new Set<number>();
  for (const id of rootIds) {
    for (const item of collectCommentSubtreeIds(id, list)) drop.add(item);
  }
  return list.filter((item) => !drop.has(item.id));
}

export function commentReplyLabel(item: CommentRecord, list: CommentRecord[]): string {
  if (item.parentId == null) return item.author;
  const parent = list.find((row) => row.id === item.parentId);
  if (!parent) return item.author;
  return `${item.author} 回复 ${parent.author}`;
}

function isRoot(item: CommentRecord, list: CommentRecord[]): boolean {
  return item.parentId == null || !list.some((row) => row.id === item.parentId);
}

function descendantsOf(rootId: number, list: CommentRecord[]): CommentRecord[] {
  const ids = collectCommentSubtreeIds(rootId, list);
  ids.delete(rootId);
  return list
    .filter((item) => ids.has(item.id))
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id - right.id);
}

export function buildCommentThreads(list: CommentRecord[]): CommentThread[] {
  const roots = list
    .filter((item) => isRoot(item, list))
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
  return roots.map((root) => ({
    root,
    replies: descendantsOf(root.id, list).map((item) => ({
      ...item,
      replyLabel: commentReplyLabel(item, list),
    })),
  }));
}
