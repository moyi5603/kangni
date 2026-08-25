export const ACTIVITY_POINT_RULES_MOCK_VERSION = 3;

export type ActivityPointRules = {
  signupPointsMin: number;
  signupPointsMax: number;
  firstCommentPointsMax: number;
  ratingPointsMax: number;
  firstMomentPointsMax: number;
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
  firstCommentPointsMax: 10,
  ratingPointsMax: 10,
  firstMomentPointsMax: 10,
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
    ratingPointsMax: asNonNegativeInt(rules?.ratingPointsMax, defaultActivityPointRules.ratingPointsMax),
    firstMomentPointsMax: asNonNegativeInt(rules?.firstMomentPointsMax, defaultActivityPointRules.firstMomentPointsMax),
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
    requireNonNegativeInt(rules.firstCommentPointsMax, '活动首评积分上限须为不小于 0 的整数') ??
    requireNonNegativeInt(rules.ratingPointsMax, '活动打分积分上限须为不小于 0 的整数') ??
    requireNonNegativeInt(rules.firstMomentPointsMax, '精彩瞬间积分上限须为不小于 0 的整数')
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
