import { useMemo, useSyncExternalStore } from 'react';
import { DEMO_SIGNUP_USER } from '../../c-end/activities/model/signupStore';
import { getCourseCommentConfig } from './trainingStore';

export type CourseCommentStatus = '已通过' | '待审核' | '已驳回';

export type CourseCommentRecord = {
  id: number;
  courseId: number;
  author: string;
  text: string;
  createdAt: string;
  status: CourseCommentStatus;
  rejectReason?: string;
};

/** C 端作者侧状态文案 */
export function courseCommentStatusLabel(status: CourseCommentStatus): string | null {
  if (status === '待审核') return '审核中';
  if (status === '已驳回') return '已驳回';
  return null;
}

const initialComments: CourseCommentRecord[] = [
  {
    id: 1,
    courseId: 1,
    author: '钟。',
    text: '你好',
    createdAt: '2026-08-10 18:11:00',
    status: '已通过',
  },
  {
    id: 2,
    courseId: 1,
    author: '李明',
    text: '讲得很清楚，已收藏。',
    createdAt: '2026-08-11 09:20:00',
    status: '待审核',
  },
  {
    id: 3,
    courseId: 1,
    author: DEMO_SIGNUP_USER.name,
    text: '这条被驳回了，只有我能看见。',
    createdAt: '2026-08-12 14:05:00',
    status: '已驳回',
  },
];

let comments = [...initialComments];
let snapshot = comments;
const listeners = new Set<() => void>();

const COMMENTS_STORAGE_KEY = 'kangni.training.courseComments.v1';

function loadPersistedComments(): CourseCommentRecord[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CourseCommentRecord[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is CourseCommentRecord =>
        Boolean(item) &&
        typeof item.id === 'number' &&
        typeof item.courseId === 'number' &&
        typeof item.author === 'string' &&
        typeof item.text === 'string' &&
        typeof item.createdAt === 'string' &&
        (item.status === '已通过' || item.status === '待审核' || item.status === '已驳回'),
    );
  } catch {
    return null;
  }
}

function savePersistedComments() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  } catch {
    // ignore quota / private mode
  }
}

const persisted = loadPersistedComments();
if (persisted) {
  comments = persisted;
  snapshot = comments;
}

function emit() {
  snapshot = comments;
  savePersistedComments();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CourseCommentRecord[] {
  return snapshot;
}

function nextCommentId(): number {
  return Math.max(0, ...comments.map((item) => item.id)) + 1;
}

function formatCommentTime(isoLike: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(isoLike);
  if (!match) return isoLike;
  return `${match[2]}-${match[3]} ${match[4]}:${match[5]}`;
}

export function formatCourseCommentDisplayTime(createdAt: string): string {
  return formatCommentTime(createdAt);
}

function formatNow(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function listComments(courseId: number): CourseCommentRecord[] {
  return comments
    .filter((item) => item.courseId === courseId)
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
}

export function listAllCourseComments(): CourseCommentRecord[] {
  return comments.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id - left.id);
}

export function listApprovedComments(courseId: number): CourseCommentRecord[] {
  return listComments(courseId).filter((item) => item.status === '已通过');
}

/**
 * 公开展示：已通过。
 * 待审核 / 已驳回：仅作者本人可见。
 */
export function listVisibleComments(courseId: number, viewerName: string = DEMO_SIGNUP_USER.name): CourseCommentRecord[] {
  return listComments(courseId).filter(
    (item) => item.status === '已通过' || item.author === viewerName,
  );
}

export function submitCourseComment(courseId: number, text: string): 'ok' | 'empty' | 'disabled' {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  const config = getCourseCommentConfig(courseId);
  if (!config.commentEnabled) return 'disabled';
  comments = [
    {
      id: nextCommentId(),
      courseId,
      author: DEMO_SIGNUP_USER.name,
      text: trimmed,
      createdAt: formatNow(),
      status: config.commentAuditEnabled ? '待审核' : '已通过',
    },
    ...comments,
  ];
  emit();
  return 'ok';
}

export function deleteCourseComment(id: number): boolean {
  const before = comments.length;
  comments = comments.filter((item) => item.id !== id);
  if (comments.length === before) return false;
  emit();
  return true;
}

export function deleteCourseComments(ids: number[]): number {
  const idSet = new Set(ids);
  const before = comments.length;
  comments = comments.filter((item) => !idSet.has(item.id));
  const removed = before - comments.length;
  if (removed > 0) emit();
  return removed;
}

export function approveCourseComment(id: number): boolean {
  const target = comments.find((item) => item.id === id);
  if (!target || (target.status !== '待审核' && target.status !== '已驳回')) return false;
  comments = comments.map((item) => (item.id === id ? { ...item, status: '已通过' as const, rejectReason: undefined } : item));
  emit();
  return true;
}

export function approveCourseComments(ids: number[]): number {
  const idSet = new Set(ids);
  let count = 0;
  comments = comments.map((item) => {
    if (!idSet.has(item.id) || (item.status !== '待审核' && item.status !== '已驳回')) return item;
    count += 1;
    return { ...item, status: '已通过' as const, rejectReason: undefined };
  });
  if (count > 0) emit();
  return count;
}

export function rejectCourseComment(id: number, reason?: string): boolean {
  const target = comments.find((item) => item.id === id);
  if (!target || target.status !== '待审核') return false;
  const rejectReason = (reason ?? '').trim() || undefined;
  comments = comments.map((item) =>
    item.id === id ? { ...item, status: '已驳回' as const, rejectReason } : item,
  );
  emit();
  return true;
}

export function rejectCourseComments(ids: number[], reason?: string): number {
  const idSet = new Set(ids);
  let count = 0;
  const rejectReason = (reason ?? '').trim() || undefined;
  comments = comments.map((item) => {
    if (!idSet.has(item.id) || item.status !== '待审核') return item;
    count += 1;
    return { ...item, status: '已驳回' as const, rejectReason };
  });
  if (count > 0) emit();
  return count;
}

export function resetCourseComments() {
  comments = [...initialComments];
  emit();
}

/** 清空持久化并恢复种子（测试/演示重置用）。 */
export function clearCourseCommentsStorage() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(COMMENTS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  comments = [...initialComments];
  emit();
}

export function useCourseComments(courseId: number) {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(() => listComments(courseId), [list, courseId]);
}

export function useAllCourseComments() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(() => listAllCourseComments(), [list]);
}

export function useVisibleCourseComments(courseId: number, viewerName: string = DEMO_SIGNUP_USER.name) {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(() => listVisibleComments(courseId, viewerName), [list, courseId, viewerName]);
}
