import { addMomentComment, addMomentReply, getMoment } from './momentStore';
import { getRelatedList, patchRelated, type CommentRecord } from './related';
import {
  addInterestGroupComment,
  addInterestGroupMomentComment,
  addInterestGroupMomentReply,
  getInterestGroupComments,
  getInterestGroupMoments,
} from '../../interest-groups/model/interestGroupStore';

export const activityAdminSelf = '陈产品';
export const activityCommentVestAccounts = ['活动小助手', '官方客服'] as const;

export function activityCommentReplyAccountOptions() {
  return [
    { value: activityAdminSelf, label: `${activityAdminSelf}（个人账号）` },
    ...activityCommentVestAccounts.map((name) => ({ value: name, label: name })),
  ];
}

export function isActivityCommentReplyAccount(name: string): boolean {
  return name === activityAdminSelf || (activityCommentVestAccounts as readonly string[]).includes(name);
}

function formatCommentTime(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function nextCommentId(list: CommentRecord[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

export function adminReplyActivityComment(
  activityId: number,
  parentId: number,
  content: string,
  author: string,
): 'ok' | 'empty' | 'missing' | 'bad-account' {
  const text = content.trim();
  if (!text) return 'empty';
  if (!isActivityCommentReplyAccount(author)) return 'bad-account';
  const parent = getRelatedList('comments').find((item) => item.id === parentId);
  if (!parent || parent.activityId !== activityId) return 'missing';
  patchRelated('comments', (list) => [
    {
      id: nextCommentId(list),
      activityId,
      content: text,
      author,
      createdAt: formatCommentTime(),
      likedBy: [],
      parentId,
    },
    ...list,
  ]);
  return 'ok';
}

export function adminCommentOnMoment(
  momentId: number,
  content: string,
  author: string,
): 'ok' | 'empty' | 'missing' | 'bad-account' {
  const text = content.trim();
  if (!text) return 'empty';
  if (!isActivityCommentReplyAccount(author)) return 'bad-account';
  if (!getMoment(momentId)) return 'missing';
  const result = addMomentComment(momentId, text, author);
  if (result.ok) return 'ok';
  if (result.message === '请输入评论') return 'empty';
  return 'missing';
}

export function adminReplyMomentComment(
  momentId: number,
  commentId: number,
  content: string,
  author: string,
  replyTo?: string,
): 'ok' | 'empty' | 'missing' | 'bad-account' {
  const text = content.trim();
  if (!text) return 'empty';
  if (!isActivityCommentReplyAccount(author)) return 'bad-account';
  if (!getMoment(momentId)) return 'missing';
  const result = addMomentReply(momentId, commentId, text, author, replyTo);
  if (result.ok) return 'ok';
  if (result.message === '请输入回复') return 'empty';
  return 'missing';
}

export function adminReplyInterestGroupComment(
  parentId: number,
  content: string,
  author: string,
): 'ok' | 'empty' | 'missing' | 'bad-account' {
  const text = content.trim();
  if (!text) return 'empty';
  if (!isActivityCommentReplyAccount(author)) return 'bad-account';
  const parent = getInterestGroupComments().find((item) => item.id === parentId);
  if (!parent) return 'missing';
  const created = addInterestGroupComment(parent.activityId, author, text, parentId);
  return created ? 'ok' : 'missing';
}

export function adminCommentOnInterestGroupMoment(
  momentId: number,
  content: string,
  author: string,
): 'ok' | 'empty' | 'missing' | 'bad-account' {
  const text = content.trim();
  if (!text) return 'empty';
  if (!isActivityCommentReplyAccount(author)) return 'bad-account';
  if (!getInterestGroupMoments().some((item) => item.id === momentId)) return 'missing';
  const result = addInterestGroupMomentComment(momentId, text, author);
  if (result.ok) return 'ok';
  if (result.message === '请输入评论') return 'empty';
  return 'missing';
}

export function adminReplyInterestGroupMomentComment(
  momentId: number,
  commentId: number,
  content: string,
  author: string,
  replyTo?: string,
): 'ok' | 'empty' | 'missing' | 'bad-account' {
  const text = content.trim();
  if (!text) return 'empty';
  if (!isActivityCommentReplyAccount(author)) return 'bad-account';
  if (!getInterestGroupMoments().some((item) => item.id === momentId)) return 'missing';
  const result = addInterestGroupMomentReply(momentId, commentId, text, author, replyTo);
  if (result.ok) return 'ok';
  if (result.message === '请输入回复') return 'empty';
  return 'missing';
}
