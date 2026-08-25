import { useSyncExternalStore } from 'react';
import { getActivity } from './activityStore';
import { getRelatedList } from './related';

export type ActivityRating = {
  activityId: number;
  phone: string;
  stars: number;
};

type RatingKey = `${number}:${string}`;

function keyOf(activityId: number, phone: string): RatingKey {
  return `${activityId}:${phone}`;
}

const initialRatings: ActivityRating[] = [
  { activityId: 1, phone: '13800001001', stars: 5 },
  { activityId: 1, phone: '13800001002', stars: 4 },
  { activityId: 1, phone: '13800001003', stars: 4 },
];

function cloneRatings(list: ActivityRating[]): Map<RatingKey, ActivityRating> {
  return new Map(list.map((item) => [keyOf(item.activityId, item.phone), { ...item }]));
}

let ratings = cloneRatings(initialRatings);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeActivityRatings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetActivityRatings() {
  ratings = cloneRatings(initialRatings);
  emit();
}

export function canShowActivityRating(status: string): boolean {
  return status === '已结束';
}

export function canSubmitActivityRating(activityId: number, phone: string): boolean {
  const activity = getActivity(activityId);
  if (!activity || activity.activityStatus !== '已结束') return false;
  return getRelatedList('signups').some(
    (item) =>
      item.activityId === activityId &&
      item.status === '已通过' &&
      (item.accountPhone ?? item.phone) === phone,
  );
}

export function listActivityRatings(activityId: number): ActivityRating[] {
  return [...ratings.values()].filter((item) => item.activityId === activityId);
}

export function getActivityRating(activityId: number, phone: string): number | undefined {
  return ratings.get(keyOf(activityId, phone))?.stars;
}

export function activityRatingCount(activityId: number): number {
  return listActivityRatings(activityId).length;
}

export function activityRatingAverage(activityId: number): number | null {
  const list = listActivityRatings(activityId);
  if (list.length === 0) return null;
  const sum = list.reduce((total, item) => total + item.stars, 0);
  return Math.round((sum / list.length) * 10) / 10;
}

export function setActivityRating(
  activityId: number,
  phone: string,
  stars: number,
): 'ok' | 'forbidden' | 'invalid' {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return 'invalid';
  if (!canSubmitActivityRating(activityId, phone)) return 'forbidden';
  ratings = new Map(ratings);
  ratings.set(keyOf(activityId, phone), { activityId, phone, stars });
  emit();
  return 'ok';
}

function snapshot() {
  return ratings;
}

export function useActivityRatings() {
  return useSyncExternalStore(subscribeActivityRatings, snapshot, snapshot);
}
