import { useMemo, useSyncExternalStore } from 'react';
import { DEMO_SIGNUP_USER } from '../../c-end/activities/model/signupStore';
import { getCourse } from './trainingStore';

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
};

const initialFavoritedBy: Record<number, string[]> = {
  2: [DEMO_SIGNUP_USER.name],
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

export function subscribeCourseEngagement(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCourseLikedBy(courseId: number): string[] {
  return [...(likedBy[courseId] ?? [])];
}

export function getCourseFavoritedBy(courseId: number): string[] {
  return [...(favoritedBy[courseId] ?? [])];
}

export function getCourseLikeCount(courseId: number): number {
  return getCourseLikedBy(courseId).length;
}

export function toggleCourseLike(courseId: number, name = DEMO_SIGNUP_USER.name) {
  if (!getCourse(courseId)) return;
  likedBy = { ...likedBy, [courseId]: toggleName(likedBy[courseId] ?? [], name) };
  emit();
}

export function toggleCourseFavorite(courseId: number, name = DEMO_SIGNUP_USER.name) {
  if (!getCourse(courseId)) return;
  favoritedBy = { ...favoritedBy, [courseId]: toggleName(favoritedBy[courseId] ?? [], name) };
  emit();
}

export function resetCourseEngagement() {
  likedBy = cloneMap(initialLikedBy);
  favoritedBy = cloneMap(initialFavoritedBy);
  emit();
}

function engagementSnapshot() {
  return snapshot;
}

export const getCourseEngagementSnapshot = engagementSnapshot;

export function useCourseEngagement(courseId: number, name = DEMO_SIGNUP_USER.name) {
  const current = useSyncExternalStore(subscribeCourseEngagement, engagementSnapshot, engagementSnapshot);
  return useMemo(
    () => ({
      liked: (current.likedBy[courseId] ?? []).includes(name),
      favorited: (current.favoritedBy[courseId] ?? []).includes(name),
      likes: (current.likedBy[courseId] ?? []).length,
      stars: (current.favoritedBy[courseId] ?? []).length,
    }),
    [current, courseId, name],
  );
}
