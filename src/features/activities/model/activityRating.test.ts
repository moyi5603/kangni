import { afterEach, describe, expect, it } from 'vitest';
import {
  activityRatingAverage,
  activityRatingCount,
  canShowActivityRating,
  canSubmitActivityRating,
  getActivityRating,
  resetActivityRatings,
  setActivityRating,
} from './activityRating';

const DEMO_PHONE = '13800001111';

describe('activity ratings', () => {
  afterEach(() => {
    resetActivityRatings();
  });

  it('shows the rating block only after the activity ended', () => {
    expect(canShowActivityRating('已结束')).toBe(true);
    expect(canShowActivityRating('进行中')).toBe(false);
    expect(canShowActivityRating('未开始')).toBe(false);
  });

  it('lets an approved signup rate an ended activity and change the score', () => {
    expect(canSubmitActivityRating(1, DEMO_PHONE)).toBe(true);
    expect(setActivityRating(1, DEMO_PHONE, 4)).toBe('ok');
    expect(getActivityRating(1, DEMO_PHONE)).toBe(4);
    expect(setActivityRating(1, DEMO_PHONE, 5)).toBe('ok');
    expect(getActivityRating(1, DEMO_PHONE)).toBe(5);
  });

  it('rejects ratings on ongoing activities and for people who did not pass signup', () => {
    expect(canSubmitActivityRating(2, DEMO_PHONE)).toBe(false);
    expect(setActivityRating(2, DEMO_PHONE, 5)).toBe('forbidden');
    expect(canSubmitActivityRating(1, '13900009999')).toBe(false);
    expect(setActivityRating(1, DEMO_PHONE, 0)).toBe('invalid');
  });

  it('seeds open-day ratings and averages to one decimal', () => {
    expect(activityRatingCount(1)).toBe(3);
    expect(activityRatingAverage(1)).toBe(4.3);
    expect(activityRatingAverage(21)).toBeNull();
    expect(activityRatingCount(21)).toBe(0);
  });
});
