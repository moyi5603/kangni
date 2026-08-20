import { useMemo, useSyncExternalStore } from 'react';
import { getActivity } from '../../../activities/model/activityStore';
import { DEMO_SIGNUP_USER } from './signupStore';

const LIKE_POOL = [
  '张悦',
  '李明',
  '孙新',
  '王芳',
  '黄码',
  '苏然',
  '郑测',
  '周工',
  '马装',
  '吴检',
  '林销',
  '刘销',
  '赵人事',
  '钱会',
];

function fill(count: number): string[] {
  return Array.from({ length: count }, (_, index) => LIKE_POOL[index] ?? `员工${index - LIKE_POOL.length + 1}`);
}

const initialLikedBy: Record<number, string[]> = {
  1: fill(3),
  2: fill(1),
  6: fill(8),
  9: fill(12),
  10: fill(6),
  13: fill(5),
  17: fill(4),
  21: fill(18),
  22: fill(15),
};

const initialFavoritedBy: Record<number, string[]> = {
  2: [DEMO_SIGNUP_USER.name],
  6: fill(2),
  9: [DEMO_SIGNUP_USER.name, '张悦', '李明', '王芳'],
  10: fill(1),
  13: fill(2),
  21: fill(7),
  22: fill(6),
};

function cloneMap(source: Record<number, string[]>): Record<number, string[]> {
  return Object.fromEntries(Object.entries(source).map(([id, names]) => [Number(id), [...names]]));
}

let likedBy = cloneMap(initialLikedBy);
let favoritedBy = cloneMap(initialFavoritedBy);
let snapshot = { likedBy, favoritedBy };
const listeners = new Set<() => void>();

function emit() {
  snapshot = { likedBy, favoritedBy };
  listeners.forEach((listener) => listener());
}

function toggleName(names: string[], name: string): string[] {
  return names.includes(name) ? names.filter((item) => item !== name) : [...names, name];
}

export function subscribeEngagement(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLikedBy(activityId: number): string[] {
  return [...(likedBy[activityId] ?? [])];
}

export function getFavoritedBy(activityId: number): string[] {
  return [...(favoritedBy[activityId] ?? [])];
}

export function getFavoriteActivityIds(name = DEMO_SIGNUP_USER.name): number[] {
  return Object.entries(favoritedBy)
    .filter(([, names]) => names.includes(name))
    .map(([id]) => Number(id));
}

export function toggleLike(activityId: number, name = DEMO_SIGNUP_USER.name) {
  if (!getActivity(activityId)) return;
  likedBy = { ...likedBy, [activityId]: toggleName(likedBy[activityId] ?? [], name) };
  emit();
}

export function toggleFavorite(activityId: number, name = DEMO_SIGNUP_USER.name) {
  if (!getActivity(activityId)) return;
  favoritedBy = { ...favoritedBy, [activityId]: toggleName(favoritedBy[activityId] ?? [], name) };
  emit();
}

export function resetEngagement() {
  likedBy = cloneMap(initialLikedBy);
  favoritedBy = cloneMap(initialFavoritedBy);
  emit();
}

function engagementSnapshot() {
  return snapshot;
}

export const getEngagementSnapshot = engagementSnapshot;

export function useEngagement() {
  return useSyncExternalStore(subscribeEngagement, engagementSnapshot, engagementSnapshot);
}

export function useFavoriteActivityIds(name = DEMO_SIGNUP_USER.name): number[] {
  const snapshot = useEngagement();
  return useMemo(() => getFavoriteActivityIds(name), [snapshot, name]);
}

export function useActivityEngagement(activityId: number, name = DEMO_SIGNUP_USER.name) {
  const snapshot = useEngagement();
  return useMemo(
    () => ({
      liked: (snapshot.likedBy[activityId] ?? []).includes(name),
      favorited: (snapshot.favoritedBy[activityId] ?? []).includes(name),
      likes: (snapshot.likedBy[activityId] ?? []).length,
      stars: (snapshot.favoritedBy[activityId] ?? []).length,
    }),
    [snapshot, activityId, name],
  );
}
