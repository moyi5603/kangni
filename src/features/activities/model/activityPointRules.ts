export const ACTIVITY_POINT_RULES_MOCK_VERSION = 5;

export type ActivityPointRules = {
  signupPointsMin: number;
  signupPointsMax: number;
  firstCommentPointsMax: number;
  firstCommentPointsDailyMax: number;
  ratingPointsMax: number;
  ratingPointsDailyMax: number;
  firstMomentPointsMax: number;
  firstMomentPointsDailyMax: number;
};

export type ActivityPointValues = {
  signupPointsEnabled: boolean;
  firstCommentPointsEnabled: boolean;
  ratingPointsEnabled: boolean;
  firstMomentPointsEnabled: boolean;
  signupPoints: number;
  firstCommentPoints: number;
  ratingPoints: number;
  firstMomentPoints: number;
};

export const defaultActivityPointRules: ActivityPointRules = {
  signupPointsMin: 1,
  signupPointsMax: 20,
  firstCommentPointsMax: 1,
  firstCommentPointsDailyMax: 10,
  ratingPointsMax: 1,
  ratingPointsDailyMax: 10,
  firstMomentPointsMax: 1,
  firstMomentPointsDailyMax: 10,
};

export const initialActivityPointRules: ActivityPointRules = { ...defaultActivityPointRules };

function asNonNegativeInt(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

export function normalizeActivityPointRules(rules: Partial<ActivityPointRules> | undefined): ActivityPointRules {
  return {
    signupPointsMin: asNonNegativeInt(rules?.signupPointsMin, defaultActivityPointRules.signupPointsMin),
    signupPointsMax: asNonNegativeInt(rules?.signupPointsMax, defaultActivityPointRules.signupPointsMax),
    firstCommentPointsMax: asNonNegativeInt(rules?.firstCommentPointsMax, defaultActivityPointRules.firstCommentPointsMax),
    firstCommentPointsDailyMax: asNonNegativeInt(
      rules?.firstCommentPointsDailyMax,
      defaultActivityPointRules.firstCommentPointsDailyMax,
    ),
    ratingPointsMax: asNonNegativeInt(rules?.ratingPointsMax, defaultActivityPointRules.ratingPointsMax),
    ratingPointsDailyMax: asNonNegativeInt(rules?.ratingPointsDailyMax, defaultActivityPointRules.ratingPointsDailyMax),
    firstMomentPointsMax: asNonNegativeInt(rules?.firstMomentPointsMax, defaultActivityPointRules.firstMomentPointsMax),
    firstMomentPointsDailyMax: asNonNegativeInt(
      rules?.firstMomentPointsDailyMax,
      defaultActivityPointRules.firstMomentPointsDailyMax,
    ),
  };
}

export function cloneActivityPointRules(rules: Partial<ActivityPointRules> | undefined): ActivityPointRules {
  return normalizeActivityPointRules(rules);
}

function requireNonNegativeInt(value: unknown, message: string): string | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return message;
  return undefined;
}

export function validateActivityPointRules(rules: ActivityPointRules): string | undefined {
  return (
    requireNonNegativeInt(rules.signupPointsMin, '报名积分下限须为不小于 0 的整数') ??
    requireNonNegativeInt(rules.signupPointsMax, '报名积分上限须为不小于 0 的整数') ??
    (rules.signupPointsMax < rules.signupPointsMin ? '报名积分上限不能小于下限' : undefined) ??
    requireNonNegativeInt(rules.firstCommentPointsMax, '活动评论积分须为不小于 0 的整数') ??
    requireNonNegativeInt(rules.firstCommentPointsDailyMax, '活动评论每日上限须为不小于 0 的整数') ??
    (rules.firstCommentPointsDailyMax < rules.firstCommentPointsMax ? '活动评论每日上限不能小于单次积分' : undefined) ??
    requireNonNegativeInt(rules.ratingPointsMax, '活动打分积分须为不小于 0 的整数') ??
    requireNonNegativeInt(rules.ratingPointsDailyMax, '活动打分每日上限须为不小于 0 的整数') ??
    (rules.ratingPointsDailyMax < rules.ratingPointsMax ? '活动打分每日上限不能小于单次积分' : undefined) ??
    requireNonNegativeInt(rules.firstMomentPointsMax, '精彩瞬间积分须为不小于 0 的整数') ??
    requireNonNegativeInt(rules.firstMomentPointsDailyMax, '精彩瞬间每日上限须为不小于 0 的整数') ??
    (rules.firstMomentPointsDailyMax < rules.firstMomentPointsMax ? '精彩瞬间每日上限不能小于单次积分' : undefined)
  );
}

export function defaultActivityPointValues(rules: ActivityPointRules): ActivityPointValues {
  return {
    signupPointsEnabled: true,
    firstCommentPointsEnabled: true,
    ratingPointsEnabled: true,
    firstMomentPointsEnabled: true,
    signupPoints: rules.signupPointsMin,
    firstCommentPoints: rules.firstCommentPointsMax,
    ratingPoints: rules.ratingPointsMax,
    firstMomentPoints: rules.firstMomentPointsMax,
  };
}

export function validateActivityPointValues(values: ActivityPointValues, rules: ActivityPointRules): string | undefined {
  if (values.signupPointsEnabled) {
    if (
      !Number.isInteger(values.signupPoints) ||
      values.signupPoints < rules.signupPointsMin ||
      values.signupPoints > rules.signupPointsMax
    ) {
      return `报名积分须在 ${rules.signupPointsMin}～${rules.signupPointsMax} 之间`;
    }
  }
  if (values.firstCommentPointsEnabled) {
    if (
      !Number.isInteger(values.firstCommentPoints) ||
      values.firstCommentPoints < 0 ||
      values.firstCommentPoints > rules.firstCommentPointsMax
    ) {
      return `活动首评积分不能超过 ${rules.firstCommentPointsMax}`;
    }
  }
  if (values.ratingPointsEnabled) {
    if (!Number.isInteger(values.ratingPoints) || values.ratingPoints < 0 || values.ratingPoints > rules.ratingPointsMax) {
      return `活动打分积分不能超过 ${rules.ratingPointsMax}`;
    }
  }
  if (values.firstMomentPointsEnabled) {
    if (
      !Number.isInteger(values.firstMomentPoints) ||
      values.firstMomentPoints < 0 ||
      values.firstMomentPoints > rules.firstMomentPointsMax
    ) {
      return `精彩瞬间积分不能超过 ${rules.firstMomentPointsMax}`;
    }
  }
  return undefined;
}

export function formatActivityPointGrant(enabled: boolean | undefined, value: number | undefined): string {
  if (!enabled) return '未开启';
  return `${value ?? 0} 分`;
}
