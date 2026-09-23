import { afterEach, describe, expect, it } from 'vitest';
import {
  canShowInterestGroupActivityRating,
  canSubmitInterestGroupActivityRating,
  getInterestGroupActivityRating,
  interestGroupActivityRatingAverage,
  interestGroupActivityRatingCount,
  resetInterestGroupActivityRatings,
  setInterestGroupActivityRating,
} from './interestGroupActivityRating';

describe('interest group activity ratings', () => {
  afterEach(() => {
    resetInterestGroupActivityRatings();
  });

  it('shows the rating block while the activity is ongoing or ended', () => {
    expect(canShowInterestGroupActivityRating('ended')).toBe(true);
    expect(canShowInterestGroupActivityRating('ongoing')).toBe(true);
    expect(canShowInterestGroupActivityRating('upcoming')).toBe(false);
  });

  it('lets an approved signup rate an ended activity only once', () => {
    expect(canSubmitInterestGroupActivityRating(102, '林浅')).toBe(true);
    expect(setInterestGroupActivityRating(102, '林浅', 3)).toBe('ok');
    expect(getInterestGroupActivityRating(102, '林浅')).toBe(3);
    expect(setInterestGroupActivityRating(102, '林浅', 5)).toBe('already');
    expect(getInterestGroupActivityRating(102, '林浅')).toBe(3);
  });

  it('lets an approved member rate an ongoing activity', () => {
    expect(canSubmitInterestGroupActivityRating(201, '林浅')).toBe(true);
    expect(setInterestGroupActivityRating(201, '林浅', 4)).toBe('ok');
    expect(getInterestGroupActivityRating(201, '林浅')).toBe(4);
  });

  it('rejects ratings for people who did not pass signup', () => {
    expect(canSubmitInterestGroupActivityRating(101, '林浅')).toBe(false);
    expect(setInterestGroupActivityRating(101, '林浅', 5)).toBe('forbidden');
    expect(canSubmitInterestGroupActivityRating(102, '顾乔')).toBe(false);
    expect(setInterestGroupActivityRating(102, '林浅', 0)).toBe('invalid');
    expect(setInterestGroupActivityRating(102, '林浅', 6)).toBe('invalid');
  });

  it('seeds stretch-class ratings and averages to one decimal', () => {
    expect(interestGroupActivityRatingCount(102)).toBe(3);
    expect(interestGroupActivityRatingAverage(102)).toBe(4.3);
    expect(interestGroupActivityRatingAverage(999)).toBeNull();
    expect(interestGroupActivityRatingCount(999)).toBe(0);
  });
});
