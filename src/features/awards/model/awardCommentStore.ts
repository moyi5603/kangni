import { useEffect, useState } from 'react';

export const AWARD_COMMENT_MOCK_VERSION = 1;

export type AwardCommentStatus = '已通过' | '待审核' | '已驳回';

export type AwardCommentRecord = {
  id: number;
  awardId: number;
  author: string;
  text: string;
  createdAt: string;
  status: AwardCommentStatus;
  rejectReason?: string;
};

const initialComments: AwardCommentRecord[] = [
  {
    id: 1,
    awardId: 2,
    author: '张悦',
    text: '协同队这次交付很稳，值得投。',
    createdAt: '2026-08-12 18:20:00',
    status: '已通过',
  },
  {
    id: 2,
    awardId: 2,
    author: '李明',
    text: '质量护航小组的缺陷闭环确实快。',
    createdAt: '2026-08-13 09:15:00',
    status: '待审核',
  },
  {
    id: 3,
    awardId: 2,
    author: '陈产品',
    text: '这条和评优无关，应驳回。',
    createdAt: '2026-08-13 11:40:00',
    status: '已驳回',
    rejectReason: '与评优无关',
  },
  {
    id: 4,
    awardId: 4,
    author: '王芳',
    text: '张悦这年贡献很扎实。',
    createdAt: '2026-02-11 10:00:00',
    status: '已通过',
  },
];

let comments = [...initialComments];
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

export function __resetAwardCommentStoreForTests() {
  comments = [...initialComments];
  emit();
}

export function listAwardComments(awardId: number) {
  return comments.filter((item) => item.awardId === awardId);
}

export function useAwardComments(awardId: number) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return listAwardComments(awardId);
}

export function approveAwardComment(id: number): boolean {
  const current = comments.find((item) => item.id === id);
  if (!current || (current.status !== '待审核' && current.status !== '已驳回')) return false;
  comments = comments.map((item) => (item.id === id ? { ...item, status: '已通过', rejectReason: undefined } : item));
  emit();
  return true;
}

export function approveAwardComments(ids: number[]): number {
  return ids.filter((id) => approveAwardComment(id)).length;
}

export function rejectAwardComment(id: number, reason: string): boolean {
  const current = comments.find((item) => item.id === id);
  if (!current || current.status !== '待审核') return false;
  const rejectReason = reason.trim();
  if (!rejectReason) return false;
  comments = comments.map((item) => (item.id === id ? { ...item, status: '已驳回', rejectReason } : item));
  emit();
  return true;
}

export function rejectAwardComments(ids: number[], reason: string): number {
  return ids.filter((id) => rejectAwardComment(id, reason)).length;
}

export function deleteAwardComment(id: number): boolean {
  const exists = comments.some((item) => item.id === id);
  if (!exists) return false;
  comments = comments.filter((item) => item.id !== id);
  emit();
  return true;
}

export function deleteAwardComments(ids: number[]): number {
  const idSet = new Set(ids);
  const before = comments.length;
  comments = comments.filter((item) => !idSet.has(item.id));
  const removed = before - comments.length;
  if (removed) emit();
  return removed;
}

void AWARD_COMMENT_MOCK_VERSION;
