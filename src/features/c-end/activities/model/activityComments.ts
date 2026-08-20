import {
  buildCommentThreads,
  COMMENT_PAGE_SIZE,
  removeCommentsAndDescendants,
  type CommentThread,
} from '../../../activities/model/commentTree';
import { getRelatedList, patchRelated, type CommentRecord } from '../../../activities/model/related';
import { DEMO_SIGNUP_USER } from './signupStore';

function formatCommentTime(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function nextCommentId(list: CommentRecord[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

function commentsFor(activityId: number): CommentRecord[] {
  return getRelatedList('comments').filter((item) => item.activityId === activityId);
}

export function formatCommentDisplayTime(createdAt: string, now = new Date()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))/.exec(createdAt);
  if (!match) return createdAt.replace(/:\d{2}$/, '');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = `${match[4]}:${match[5]}`;
  if (year === now.getFullYear()) return `${month}月${day}日 ${time}`;
  return `${year}年${month}月${day}日 ${time}`;
}

export function listActivityComments(activityId: number): CommentRecord[] {
  return commentsFor(activityId)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
}

export function listActivityCommentThreads(activityId: number): CommentThread[] {
  return buildCommentThreads(commentsFor(activityId));
}

export function sliceCommentThreads(threads: CommentThread[], limit: number): CommentThread[] {
  return threads.slice(0, Math.max(0, limit));
}

export function nextVisibleCommentCount(visible: number, total: number, pageSize = COMMENT_PAGE_SIZE): number {
  if (visible >= total) return total;
  return Math.min(total, visible + pageSize);
}

export function commentCount(activityId: number): number {
  return listActivityCommentThreads(activityId).length;
}

export function submitActivityComment(
  activityId: number,
  content: string,
  parentId?: number,
): 'ok' | 'empty' | 'missing' {
  const text = content.trim();
  if (!text) return 'empty';
  if (parentId != null) {
    const parent = getRelatedList('comments').find((item) => item.id === parentId);
    if (!parent || parent.activityId !== activityId) return 'missing';
  }
  patchRelated('comments', (list) => [
    {
      id: nextCommentId(list),
      activityId,
      content: text,
      author: DEMO_SIGNUP_USER.name,
      createdAt: formatCommentTime(),
      likedBy: [],
      ...(parentId != null ? { parentId } : {}),
    },
    ...list,
  ]);
  return 'ok';
}

export function deleteActivityComment(id: number): 'ok' | 'forbidden' | 'missing' {
  const target = getRelatedList('comments').find((item) => item.id === id);
  if (!target) return 'missing';
  if (target.author !== DEMO_SIGNUP_USER.name) return 'forbidden';
  patchRelated('comments', (list) => removeCommentsAndDescendants(list, [id]));
  return 'ok';
}

export function toggleCommentLike(id: number): 'ok' | 'missing' {
  const target = getRelatedList('comments').find((item) => item.id === id);
  if (!target) return 'missing';
  const name = DEMO_SIGNUP_USER.name;
  patchRelated('comments', (list) =>
    list.map((item) => {
      if (item.id !== id) return item;
      const liked = item.likedBy.includes(name);
      return {
        ...item,
        likedBy: liked ? item.likedBy.filter((who) => who !== name) : [...item.likedBy, name],
      };
    }),
  );
  return 'ok';
}
