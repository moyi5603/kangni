import { useSyncExternalStore } from 'react';
import { getInterestGroupActivity } from './interestGroupStore';
import { getInterestGroupSignups } from './interestGroupStore';

export type InterestGroupActivityRating = {
  activityId: number;
  memberName: string;
  stars: number;
};

type RatingKey = `${number}:${string}`;

function keyOf(activityId: number, memberName: string): RatingKey {
  return `${activityId}:${memberName}`;
}

const initialRatings: InterestGroupActivityRating[] = [
  { activityId: 102, memberName: '孙新', stars: 5 },
  { activityId: 102, memberName: '李明', stars: 4 },
  { activityId: 102, memberName: '赵人事', stars: 4 },
];

function cloneRatings(list: InterestGroupActivityRating[]): Map<RatingKey, InterestGroupActivityRating> {
  return new Map(list.map((item) => [keyOf(item.activityId, item.memberName), { ...item }]));
}

let ratings = cloneRatings(initialRatings);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeInterestGroupActivityRatings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetInterestGroupActivityRatings() {
  ratings = cloneRatings(initialRatings);
  emit();
}

export function canShowInterestGroupActivityRating(status: string): boolean {
  return status === 'ended' || status === 'ongoing';
}

export function canSubmitInterestGroupActivityRating(activityId: number, memberName: string): boolean {
  const activity = getInterestGroupActivity(activityId);
  if (!activity || !canShowInterestGroupActivityRating(activity.status)) return false;
  return getInterestGroupSignups().some(
    (item) => item.activityId === activityId && item.status === '已通过' && item.name === memberName,
  );
}

export function listInterestGroupActivityRatings(activityId: number): InterestGroupActivityRating[] {
  return [...ratings.values()].filter((item) => item.activityId === activityId);
}

export function getInterestGroupActivityRating(activityId: number, memberName: string): number | undefined {
  return ratings.get(keyOf(activityId, memberName))?.stars;
}

export function interestGroupActivityRatingCount(activityId: number): number {
  return listInterestGroupActivityRatings(activityId).length;
}

export function interestGroupActivityRatingAverage(activityId: number): number | null {
  const list = listInterestGroupActivityRatings(activityId);
  if (list.length === 0) return null;
  const sum = list.reduce((total, item) => total + item.stars, 0);
  return Math.round((sum / list.length) * 10) / 10;
}

export function setInterestGroupActivityRating(
  activityId: number,
  memberName: string,
  stars: number,
): 'ok' | 'forbidden' | 'invalid' | 'already' {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return 'invalid';
  if (ratings.has(keyOf(activityId, memberName))) return 'already';
  if (!canSubmitInterestGroupActivityRating(activityId, memberName)) return 'forbidden';
  ratings = new Map(ratings);
  ratings.set(keyOf(activityId, memberName), { activityId, memberName, stars });
  emit();
  return 'ok';
}

function snapshot() {
  return ratings;
}

export function useInterestGroupActivityRatings() {
  return useSyncExternalStore(subscribeInterestGroupActivityRatings, snapshot, snapshot);
}
