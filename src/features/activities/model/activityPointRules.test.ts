import { describe, expect, it } from 'vitest';
import {
  defaultActivityPointRules,
  defaultActivityPointValues,
  formatActivityPointGrant,
  normalizeActivityPointRules,
  validateActivityPointRules,
  validateActivityPointValues,
  type ActivityPointRules,
  type ActivityPointValues,
} from './activityPointRules';

function points(partial: Partial<ActivityPointValues> = {}): ActivityPointValues {
  return { ...defaultActivityPointValues(defaultActivityPointRules), ...partial };
}

describe('activityPointRules', () => {
  it('requires signup min/max integers and max >= min', () => {
    expect(validateActivityPointRules({ ...defaultActivityPointRules, signupPointsMin: -1 })).toBe(
      '报名积分下限须为不小于 0 的整数',
    );
    expect(validateActivityPointRules({ ...defaultActivityPointRules, signupPointsMax: 0.5 })).toBe(
      '报名积分上限须为不小于 0 的整数',
    );
    expect(validateActivityPointRules({ ...defaultActivityPointRules, signupPointsMin: 10, signupPointsMax: 5 })).toBe(
      '报名积分上限不能小于下限',
    );
    expect(validateActivityPointRules(defaultActivityPointRules)).toBeUndefined();
  });

  it('fills missing caps from defaults so extra text is not undefined', () => {
    expect(
      normalizeActivityPointRules({
        signupPointsMin: 2,
        signupPointsMax: 8,
        firstCommentPointsMax: 4,
        ratingPointsMax: 6,
      }).firstMomentPointsMax,
    ).toBe(defaultActivityPointRules.firstMomentPointsMax);
    expect(
      normalizeActivityPointRules({
        ...defaultActivityPointRules,
        firstMomentPointsMax: undefined,
        firstCommentPointsMax: undefined,
        ratingPointsMax: undefined,
      } as Partial<ActivityPointRules>).firstCommentPointsMax,
    ).toBe(10);
    expect(
      normalizeActivityPointRules({
        ...defaultActivityPointRules,
        firstMomentPointsMax: undefined,
      } as Partial<ActivityPointRules>).firstMomentPointsMax,
    ).toBe(10);
  });

  it('requires first-comment, rating and first-moment max to be non-negative integers', () => {
    expect(validateActivityPointRules({ ...defaultActivityPointRules, firstCommentPointsMax: -1 })).toBe(
      '活动首评积分上限须为不小于 0 的整数',
    );
    expect(validateActivityPointRules({ ...defaultActivityPointRules, ratingPointsMax: 1.2 })).toBe(
      '活动打分积分上限须为不小于 0 的整数',
    );
    expect(validateActivityPointRules({ ...defaultActivityPointRules, firstMomentPointsMax: -1 })).toBe(
      '精彩瞬间积分上限须为不小于 0 的整数',
    );
  });

  it('defaults activity values to signup min, cap maxima, and all enabled', () => {
    expect(defaultActivityPointValues(defaultActivityPointRules)).toEqual({
      signupPointsEnabled: true,
      firstCommentPointsEnabled: true,
      ratingPointsEnabled: true,
      firstMomentPointsEnabled: true,
      signupPoints: defaultActivityPointRules.signupPointsMin,
      firstCommentPoints: defaultActivityPointRules.firstCommentPointsMax,
      ratingPoints: defaultActivityPointRules.ratingPointsMax,
      firstMomentPoints: defaultActivityPointRules.firstMomentPointsMax,
    });
  });

  it('rejects activity values outside the global range', () => {
    const rules = defaultActivityPointRules;
    expect(validateActivityPointValues(points({ signupPoints: rules.signupPointsMin - 1 }), rules)).toBe(
      `报名积分须在 ${rules.signupPointsMin}～${rules.signupPointsMax} 之间`,
    );
    expect(validateActivityPointValues(points({ firstCommentPoints: rules.firstCommentPointsMax + 1 }), rules)).toBe(
      `活动首评积分不能超过 ${rules.firstCommentPointsMax}`,
    );
    expect(validateActivityPointValues(points({ ratingPoints: rules.ratingPointsMax + 1 }), rules)).toBe(
      `活动打分积分不能超过 ${rules.ratingPointsMax}`,
    );
    expect(validateActivityPointValues(points({ firstMomentPoints: rules.firstMomentPointsMax + 1 }), rules)).toBe(
      `精彩瞬间积分不能超过 ${rules.firstMomentPointsMax}`,
    );
    expect(validateActivityPointValues(points(), rules)).toBeUndefined();
  });

  it('formats disabled point grants as 未开启', () => {
    expect(formatActivityPointGrant(false, 8)).toBe('未开启');
    expect(formatActivityPointGrant(true, 8)).toBe('8 分');
  });

  it('skips range checks when a point item is disabled', () => {
    const rules = defaultActivityPointRules;
    expect(
      validateActivityPointValues(
        points({
          signupPointsEnabled: false,
          signupPoints: rules.signupPointsMin - 1,
          firstCommentPointsEnabled: false,
          firstCommentPoints: rules.firstCommentPointsMax + 1,
          ratingPointsEnabled: false,
          ratingPoints: rules.ratingPointsMax + 1,
          firstMomentPointsEnabled: false,
          firstMomentPoints: rules.firstMomentPointsMax + 1,
        }),
        rules,
      ),
    ).toBeUndefined();
  });
});

