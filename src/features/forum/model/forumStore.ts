import { useEffect, useState } from 'react';
import {
  boardFromDraft,
  cloneForumTopics,
  compareForumTags,
  duplicateBoardName,
  duplicateMailboxManager,
  moveBoardAmongKind,
  onlyForumPeople,
  initialBoards,
  initialForumTags,
  initialMutes,
  initialTopics,
  isForumCommentReplyAccount,
  nextForumTagOrder,
  forumClientSelf,
  nowText,
  removeTopicTag,
  validateMuteDraft,
  renameTopicTags,
  withTopicComment,
  withTopicCommentPin,
  withTopicReply,
  withoutTopicComment,
  withoutTopicReply,
  withTopicCommentLike,
  withTopicReplyLike,
  withChairmanReply,
  type ForumBoard,
  type ForumBoardDraft,
  type ForumTagFormValues,
  type ForumTagRecord,
  type ForumTopic,
  type MuteDraft,
  type MuteRecord,
  type PinScope,
  type ShelfStatus,
} from './forum';

let boards: ForumBoard[] = initialBoards.map((item) => ({
  ...item,
  chairs: item.chairs?.map((chair) => ({ ...chair, receiveTypes: [...chair.receiveTypes] })),
  tags: item.tags ? [...item.tags] : undefined,
}));
let topics: ForumTopic[] = cloneForumTopics(initialTopics);
let mutes: MuteRecord[] = initialMutes.map((item) => ({ ...item }));
let tags: ForumTagRecord[] = initialForumTags.map((item) => ({ ...item }));
let likedIds = new Set<number>();
let favoritedIds = new Set<number>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useStoreTick() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
}

export function __resetForumStoreForTests() {
  boards = initialBoards.map((item) => ({
    ...item,
    chairs: item.chairs?.map((chair) => ({ ...chair, receiveTypes: [...chair.receiveTypes] })),
    tags: item.tags ? [...item.tags] : undefined,
  }));
  topics = cloneForumTopics(initialTopics);
  mutes = initialMutes.map((item) => ({ ...item }));
  tags = initialForumTags.map((item) => ({ ...item }));
  likedIds = new Set();
  favoritedIds = new Set();
  emit();
}

export function useForumBoards() {
  useStoreTick();
  return boards;
}

export function useForumTopics() {
  useStoreTick();
  return topics;
}

export function useForumMutes() {
  useStoreTick();
  return mutes;
}

export function useForumTags() {
  useStoreTick();
  return [...tags].sort(compareForumTags);
}

export function getForumBoard(id: number) {
  return boards.find((item) => item.id === id);
}

export function getForumBoards() {
  return boards;
}

export function getForumTopic(id: number) {
  return topics.find((item) => item.id === id);
}

export function getForumTopics() {
  return topics;
}

export function publishClientTopic(input: {
  boardName: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  author?: string;
  authorAnonymous?: boolean;
  chairName?: string;
}): { ok: true; id: number } | { ok: false; error: string } {
  const title = input.title.trim();
  if (!title) return { ok: false, error: '请填写标题' };
  const id = Math.max(0, ...topics.map((item) => item.id)) + 1;
  topics = [
    {
      id,
      title,
      content: input.content.trim(),
      boardName: input.boardName,
      author: input.author ?? forumClientSelf,
      authorAnonymous: input.authorAnonymous,
      chairName: input.chairName,
      auditStatus: '直接发布',
      commentCount: 0,
      likeCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      images: input.images.slice(0, 9),
      comments: [],
      pinScope: '',
      publishedAt: nowText(),
      shelfStatus: 'on',
      tags: input.tags.map((item) => item.trim()).filter(Boolean).slice(0, 1),
    },
    ...topics,
  ];
  emit();
  return { ok: true, id };
}

export function updateClientTopic(
  id: number,
  patch: { title: string; content: string; images: string[]; tags?: string[] },
): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  if (current.author !== forumClientSelf) {
    return { ok: false, error: '只能编辑自己的帖子' };
  }
  const title = patch.title.trim();
  if (!title) return { ok: false, error: '请填写标题' };
  topics = topics.map((item) =>
    item.id === id
      ? {
          ...item,
          title,
          content: patch.content.trim(),
          images: patch.images.slice(0, 9),
          tags: patch.tags ? patch.tags.map((name) => name.trim()).filter(Boolean).slice(0, 1) : item.tags,
        }
      : item,
  );
  emit();
  return { ok: true };
}

export function deleteClientTopic(id: number): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  if (current.author !== forumClientSelf) {
    return { ok: false, error: '只能删除自己的帖子' };
  }
  topics = topics.filter((item) => item.id !== id);
  emit();
  return { ok: true };
}

export function nextBoardId() {
  return Math.max(0, ...boards.map((item) => item.id)) + 1;
}

export function saveForumBoard(draft: ForumBoardDraft, id?: number): { ok: true; board: ForumBoard } | { ok: false; error: string } {
  if (duplicateBoardName(boards, draft.name.trim(), id)) {
    return { ok: false, error: `${draft.kind === 'mailbox' ? '信箱' : '论坛'}名称已存在` };
  }
  if (draft.kind === 'mailbox') {
    const manager = draft.managers.map((item) => item.trim()).find(Boolean) ?? '';
    if (duplicateMailboxManager(boards, manager, id)) {
      return { ok: false, error: '该负责人已配置到其他信箱' };
    }
  }
  if (id) {
    const current = boards.find((item) => item.id === id);
    if (!current) return { ok: false, error: '记录不存在' };
    const next = boardFromDraft(draft, current.id, current.createdAt, current.status);
    if (current.name !== next.name) {
      topics = topics.map((item) => (item.boardName === current.name ? { ...item, boardName: next.name } : item));
    }
    boards = boards.map((item) => (item.id === id ? next : item));
    emit();
    return { ok: true, board: next };
  }
  const created = boardFromDraft(draft, nextBoardId(), nowText());
  boards = [created, ...boards];
  emit();
  return { ok: true, board: created };
}

export function setForumBoardStatus(id: number, status: ForumBoard['status']) {
  setForumBoardStatuses([id], status);
}

export function setForumBoardStatuses(ids: number[], status: ForumBoard['status']) {
  const idSet = new Set(ids);
  boards = boards.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function moveForumBoard(id: number, dir: -1 | 1): boolean {
  const next = moveBoardAmongKind(boards, id, dir);
  if (!next) return false;
  boards = next;
  emit();
  return true;
}

export function isTopicLiked(id: number) {
  return likedIds.has(id);
}

export function isTopicFavorited(id: number) {
  return favoritedIds.has(id);
}

export function toggleTopicLike(id: number) {
  const on = likedIds.has(id);
  const next = new Set(likedIds);
  if (on) next.delete(id);
  else next.add(id);
  likedIds = next;
  topics = topics.map((item) =>
    item.id === id ? { ...item, likeCount: Math.max(0, item.likeCount + (on ? -1 : 1)) } : item,
  );
  emit();
}

export function toggleTopicFavorite(id: number) {
  const on = favoritedIds.has(id);
  const next = new Set(favoritedIds);
  if (on) next.delete(id);
  else next.add(id);
  favoritedIds = next;
  topics = topics.map((item) =>
    item.id === id ? { ...item, favoriteCount: Math.max(0, item.favoriteCount + (on ? -1 : 1)) } : item,
  );
  emit();
}

export function setTopicPin(id: number, pinScope: PinScope, operator = '管宁') {
  topics = topics.map((item) => {
    if (item.id !== id) return item;
    const label = pinScope === 'global' || pinScope === 'board' ? '置顶' : '取消置顶';
    const detail =
      pinScope === 'global' ? '在论坛首页顶部展示。' : pinScope === 'board' ? '仅在所属论坛顶部展示。' : '恢复普通排序。';
    return {
      ...item,
      pinScope,
      operationHistory: [{ action: label, operator, time: nowText(), detail }, ...(item.operationHistory ?? [])],
    };
  });
  emit();
}

export function setTopicShelf(id: number, shelfStatus: ShelfStatus) {
  topics = topics.map((item) => (item.id === id ? { ...item, shelfStatus } : item));
  emit();
}

export function setTopicAssignees(id: number, names: string[]) {
  const replyAssignees = onlyForumPeople(names).join('、');
  topics = topics.map((item) => (item.id === id ? { ...item, replyAssignees: replyAssignees || undefined } : item));
  emit();
}

export function addTopicComment(id: number, content: string, operator: string): { ok: true } | { ok: false; error: string } {
  if (!isForumCommentReplyAccount(operator)) return { ok: false, error: '请选择回复账号' };
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicComment(current, content, operator, nowText());
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function addTopicReply(
  id: number,
  commentId: number,
  content: string,
  replyTo: string,
  operator: string,
): { ok: true } | { ok: false; error: string } {
  if (!isForumCommentReplyAccount(operator)) return { ok: false, error: '请选择回复账号' };
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicReply(current, commentId, content, operator, replyTo, nowText());
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function addClientTopicComment(
  id: number,
  content: string,
  images: string[] = [],
  anonymous = false,
): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicComment(current, content, forumClientSelf, nowText(), images, anonymous);
  if ('error' in next) return { ok: false, error: next.error };
  if (mutes.some((item) => item.user === forumClientSelf && item.active)) {
    return { ok: false, error: '你已被禁言' };
  }
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function addClientTopicReply(
  id: number,
  commentId: number,
  content: string,
  replyTo: string,
  images: string[] = [],
  anonymous = false,
): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicReply(current, commentId, content, forumClientSelf, replyTo, nowText(), images, anonymous);
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function deleteClientTopicComment(id: number, commentId: number): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withoutTopicComment(current, commentId, forumClientSelf);
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function deleteClientTopicReply(
  id: number,
  commentId: number,
  replyId: number,
): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withoutTopicReply(current, commentId, replyId, forumClientSelf);
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function toggleClientTopicCommentLike(id: number, commentId: number): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicCommentLike(current, commentId, forumClientSelf);
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function toggleClientTopicReplyLike(
  id: number,
  commentId: number,
  replyId: number,
): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicReplyLike(current, commentId, replyId, forumClientSelf);
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function setTopicCommentPin(id: number, commentId: number, pinned: boolean): { ok: true } | { ok: false; error: string } {
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '帖子不存在' };
  const next = withTopicCommentPin(current, commentId, pinned);
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function setChairmanReply(id: number, content: string, operator: string): { ok: true } | { ok: false; error: string } {
  if (!isForumCommentReplyAccount(operator)) return { ok: false, error: '请选择回复账号' };
  const current = topics.find((item) => item.id === id);
  if (!current) return { ok: false, error: '建言不存在' };
  const next = withChairmanReply(current, content, operator, nowText());
  if ('error' in next) return { ok: false, error: next.error };
  topics = topics.map((item) => (item.id === id ? next : item));
  emit();
  return { ok: true };
}

export function addMute(draft: MuteDraft, operator = '管宁'): { ok: true } | { ok: false; error: string } {
  const error = validateMuteDraft(draft);
  if (error) return { ok: false, error };
  if (mutes.some((item) => item.user === draft.user && item.active)) {
    return { ok: false, error: '该成员已处于禁言中' };
  }
  mutes = [
    {
      id: Math.max(0, ...mutes.map((item) => item.id)) + 1,
      user: draft.user,
      department: draft.department,
      reason: draft.reason.trim(),
      mutedAt: nowText(),
      operator,
      active: true,
    },
    ...mutes,
  ];
  emit();
  return { ok: true };
}

export function releaseMute(id: number) {
  mutes = mutes.map((item) => (item.id === id ? { ...item, active: false, releasedAt: nowText() } : item));
  emit();
}

export function upsertForumTag(values: ForumTagFormValues, id?: number): ForumTagRecord {
  const name = values.name.trim();
  if (id) {
    const current = tags.find((item) => item.id === id);
    if (!current) throw new Error('标签不存在');
    const next: ForumTagRecord = { ...current, name, order: values.order ?? current.order };
    tags = tags.map((item) => (item.id === id ? next : item));
    if (current.name !== name) {
      topics = renameTopicTags(topics, current.name, name);
      boards = boards.map((item) => ({
        ...item,
        tags: item.tags?.map((tag) => (tag === current.name ? name : tag)),
      }));
    }
    emit();
    return next;
  }
  const created: ForumTagRecord = {
    id: Math.max(0, ...tags.map((item) => item.id)) + 1,
    name,
    order: values.order ?? nextForumTagOrder(tags.filter((item) => item.scope === (values.scope ?? 'forum'))),
    status: '启用',
    createdAt: nowText(),
    scope: values.scope ?? 'forum',
  };
  tags = [created, ...tags];
  emit();
  return created;
}

export function deleteForumTag(id: number): { ok: true; topicCount: number } | { ok: false } {
  const current = tags.find((item) => item.id === id);
  if (!current) return { ok: false };
  const topicCount = topics.filter((item) => (item.tags ?? []).includes(current.name)).length;
  tags = tags.filter((item) => item.id !== id);
  topics = removeTopicTag(topics, current.name);
  boards = boards.map((item) => ({
    ...item,
    tags: item.tags?.filter((tag) => tag !== current.name),
  }));
  emit();
  return { ok: true, topicCount };
}

export function setForumTagStatus(ids: number[], status: ForumTagRecord['status']) {
  const idSet = new Set(ids);
  tags = tags.map((item) => (idSet.has(item.id) ? { ...item, status } : item));
  emit();
}

export function moveForumTag(id: number, dir: -1 | 1): boolean {
  const current = tags.find((item) => item.id === id);
  if (!current) return false;
  const scoped = [...tags].filter((item) => item.scope === current.scope).sort(compareForumTags);
  const index = scoped.findIndex((item) => item.id === id);
  const nextIndex = index + dir;
  if (index < 0 || nextIndex < 0 || nextIndex >= scoped.length) return false;
  const neighbor = scoped[nextIndex]!;
  const left = scoped[index]!;
  let nextLeft = left;
  let nextNeighbor = neighbor;
  if (left.order === neighbor.order) {
    nextLeft = { ...left, createdAt: neighbor.createdAt };
    nextNeighbor = { ...neighbor, createdAt: left.createdAt };
  } else {
    nextLeft = { ...left, order: neighbor.order };
    nextNeighbor = { ...neighbor, order: left.order };
  }
  tags = tags.map((item) => {
    if (item.id === nextLeft.id) return nextLeft;
    if (item.id === nextNeighbor.id) return nextNeighbor;
    return item;
  });
  emit();
  return true;
}
