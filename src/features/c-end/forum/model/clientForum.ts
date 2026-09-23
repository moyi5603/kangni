import { forumPersonDepartment, forumClientSelf, isTopicPinned, parseTopicAssignees, topicChairmanReplies } from '../../../forum/model/forum';
import type { ForumTopic, ForumTopicComment, TopicAuditStatus } from '../../../forum/model/forum';

const HIDDEN_AUDIT: TopicAuditStatus[] = ['待审核', '已驳回'];
export const FORUM_COMPOSE_IMAGE_MAX = 9;

export function isClientForumTopicVisible(topic: Pick<ForumTopic, 'shelfStatus' | 'auditStatus'>): boolean {
  return topic.shelfStatus !== 'off' && !HIDDEN_AUDIT.includes(topic.auditStatus);
}

export function visibleClientForumTopics(topics: ForumTopic[], boardName: string): ForumTopic[] {
  return topics.filter((item) => item.boardName === boardName && isClientForumTopicVisible(item));
}

export function formatForumListTime(publishedAt: string): string {
  const datePart = publishedAt.slice(0, 10);
  const [, month, day] = datePart.split('-');
  if (!month || !day) return publishedAt;
  return `${Number(month)}-${Number(day)}`;
}

export function formatForumPostDate(publishedAt: string): string {
  const datePart = publishedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : publishedAt;
}

export const FORUM_ANON_LABEL = '【匿名用户】';
const ANON_SERIAL_MIN = 1000;
const ANON_SERIAL_MAX = 9999;

/** 同一帖内按作者稳定映射，刷新后序号不变；不同作者尽量不撞号。 */
export function forumAnonSerial(topicId: number, author: string): number {
  let hash = 2166136261;
  const text = `${topicId}\u0000${author}`;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const span = ANON_SERIAL_MAX - ANON_SERIAL_MIN + 1;
  return ANON_SERIAL_MIN + ((hash >>> 0) % span);
}

export function forumAnonSerials(topic: Pick<ForumTopic, 'id' | 'author' | 'authorAnonymous' | 'comments'>): Map<string, number> {
  const authors: string[] = [];
  const push = (author: string, anonymous?: boolean) => {
    if (!anonymous || author === forumClientSelf || authors.includes(author)) return;
    authors.push(author);
  };
  push(topic.author, topic.authorAnonymous);
  for (const comment of topic.comments) {
    push(comment.author, comment.authorAnonymous);
    for (const reply of comment.replies) push(reply.author, reply.authorAnonymous);
  }
  authors.sort();
  const used = new Set<number>();
  const map = new Map<string, number>();
  for (const author of authors) {
    let serial = forumAnonSerial(topic.id, author);
    while (used.has(serial)) serial = serial === ANON_SERIAL_MAX ? ANON_SERIAL_MIN : serial + 1;
    used.add(serial);
    map.set(author, serial);
  }
  return map;
}

export function forumActorName(author: string, anonymous?: boolean, serial?: number) {
  if (!anonymous) return author;
  if (author === forumClientSelf) return '我';
  return `${FORUM_ANON_LABEL}${serial ?? forumAnonSerial(0, author)}`;
}

export function topicActorName(
  topic: Pick<ForumTopic, 'id' | 'author' | 'authorAnonymous' | 'comments'>,
  author: string,
  anonymous?: boolean,
) {
  return forumActorName(author, anonymous, anonymous ? forumAnonSerials(topic).get(author) : undefined);
}

export function topicAuthorName(topic: ForumTopic) {
  return topicActorName(topic, topic.author, topic.authorAnonymous);
}

export function topicAuthorDepartment(topic: ForumTopic) {
  if (topic.authorAnonymous) return '';
  return forumPersonDepartment(topic.author);
}

export function isOwnClientTopic(topic: Pick<ForumTopic, 'author' | 'authorAnonymous'>) {
  return topic.author === forumClientSelf;
}

export function clientNeedsReply(topic: Pick<ForumTopic, 'replyAssignees' | 'comments'>): boolean {
  if (!parseTopicAssignees(topic.replyAssignees).includes(forumClientSelf)) return false;
  return !topic.comments.some(
    (comment) => comment.author === forumClientSelf || comment.replies.some((reply) => reply.author === forumClientSelf),
  );
}

export function topicTitleText(topic: Pick<ForumTopic, 'title' | 'tags'>) {
  return topic.title;
}

export function topicReplyCount(topic: ForumTopic): number {
  const nested = topic.comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);
  return Math.max(topic.commentCount, nested);
}

export type ForumCommentSort = 'hot' | 'asc' | 'desc';

function pinFirst(left: ForumTopicComment, right: ForumTopicComment) {
  return Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
}

export function sortClientTopicComments(comments: ForumTopicComment[], sort: ForumCommentSort): ForumTopicComment[] {
  const rows = [...comments];
  if (sort === 'asc') {
    return rows.sort((left, right) => pinFirst(left, right) || left.createdAt.localeCompare(right.createdAt) || left.id - right.id);
  }
  if (sort === 'desc') {
    return rows.sort((left, right) => pinFirst(left, right) || right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
  }
  return rows.sort((left, right) => {
    const pin = pinFirst(left, right);
    if (pin) return pin;
    const likes = (right.likedBy?.length ?? 0) - (left.likedBy?.length ?? 0);
    if (likes) return likes;
    return right.createdAt.localeCompare(left.createdAt) || right.id - left.id;
  });
}

export function sortClientForumTopics(topics: ForumTopic[], sort: 'reply' | 'publish'): ForumTopic[] {
  return [...topics].sort((left, right) => {
    const pin = Number(isTopicPinned(right)) - Number(isTopicPinned(left));
    if (pin) return pin;
    if (sort === 'reply') {
      const replies = topicReplyCount(right) - topicReplyCount(left);
      if (replies) return replies;
    }
    return right.publishedAt.localeCompare(left.publishedAt);
  });
}

export function boardCommentCount(topics: ForumTopic[]): number {
  return topics.reduce((sum, topic) => sum + topicReplyCount(topic), 0);
}

export function capForumComposeImages(current: string[], incoming: string[], max = FORUM_COMPOSE_IMAGE_MAX) {
  return [...current, ...incoming].slice(0, max);
}

export function topicListThumbs(images: string[], max = 3): { src: string; extra: number }[] {
  if (!images.length) return [];
  const shown = images.slice(0, max);
  const extra = Math.max(0, images.length - max);
  return shown.map((src, index) => ({
    src,
    extra: extra && index === shown.length - 1 ? extra : 0,
  }));
}

export const CLIENT_MAILBOX_BOARDS = ['员工体验', '经营发展', '人才发展', '建言献策'] as const;

export function isClientMailboxTopic(topic: Pick<ForumTopic, 'boardName'>): boolean {
  return (CLIENT_MAILBOX_BOARDS as readonly string[]).includes(topic.boardName);
}

export function mailboxProposalCount(topics: ForumTopic[]): number {
  return topics.filter((item) => isClientMailboxTopic(item) && isClientForumTopicVisible(item)).length;
}

export function myClientMailboxTopics(topics: ForumTopic[]): ForumTopic[] {
  return topics
    .filter((item) => isClientMailboxTopic(item) && isClientForumTopicVisible(item) && item.author === forumClientSelf)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || right.id - left.id);
}

export function myClientForumTopics(topics: ForumTopic[]): ForumTopic[] {
  return topics
    .filter((item) => !isClientMailboxTopic(item) && isClientForumTopicVisible(item) && isOwnClientTopic(item))
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || right.id - left.id);
}

export function mailboxProposalStatus(topic: ForumTopic): '已驳回' | '已回复' | '处理中' {
  if (topic.auditStatus === '已驳回') return '已驳回';
  if (topicChairmanReplies(topic).length) return '已回复';
  return '处理中';
}
