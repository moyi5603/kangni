export const REWARD_RULES_MOCK_VERSION = 1;

export const rewardModes = ['fixed', 'duration'] as const;
export type RewardMode = (typeof rewardModes)[number];

export type RewardKindRule = {
  enabled: boolean;
  mode: RewardMode | null;
  fixedPoints: number | null;
  intervalMinutes: number | null;
  pointsPerInterval: number | null;
  lessonCap: number | null;
  dailyCap: number | null;
};

export type TrainingRewardRules = {
  points: RewardKindRule;
  credits: RewardKindRule;
};

export function emptyKindRule(): RewardKindRule {
  return {
    enabled: false,
    mode: null,
    fixedPoints: null,
    intervalMinutes: null,
    pointsPerInterval: null,
    lessonCap: null,
    dailyCap: null,
  };
}

export function cloneRewardRules(rules: TrainingRewardRules): TrainingRewardRules {
  return {
    points: { ...rules.points },
    credits: { ...rules.credits },
  };
}

export const initialRewardRules: TrainingRewardRules = {
  points: emptyKindRule(),
  credits: emptyKindRule(),
};

export function prepareKindForSave(rule: RewardKindRule): RewardKindRule {
  if (!rule.enabled) return emptyKindRule();
  if (rule.mode === 'fixed') {
    return {
      enabled: true,
      mode: 'fixed',
      fixedPoints: rule.fixedPoints,
      intervalMinutes: null,
      pointsPerInterval: null,
      lessonCap: rule.lessonCap,
      dailyCap: rule.dailyCap,
    };
  }
  return {
    enabled: true,
    mode: 'duration',
    fixedPoints: null,
    intervalMinutes: rule.intervalMinutes,
    pointsPerInterval: rule.pointsPerInterval,
    lessonCap: rule.lessonCap,
    dailyCap: rule.dailyCap,
  };
}

export function prepareRewardRulesForSave(rules: TrainingRewardRules): TrainingRewardRules {
  return {
    points: prepareKindForSave(rules.points),
    credits: prepareKindForSave(rules.credits),
  };
}

export function validateKindRule(rule: RewardKindRule, label: string): string | null {
  if (!rule.enabled) return null;
  if (rule.mode !== 'fixed' && rule.mode !== 'duration') return `请选择${label}发放方式`;
  if (rule.mode === 'fixed') {
    if (rule.fixedPoints == null || rule.fixedPoints < 1) return `请输入${label}每课程固定分`;
  } else {
    if (rule.intervalMinutes == null || rule.intervalMinutes < 1) return `请输入${label}分钟间隔`;
    if (rule.pointsPerInterval == null || rule.pointsPerInterval < 1) return `请输入${label}每区间分值`;
  }
  if (rule.lessonCap == null || rule.lessonCap < 1) return `请输入${label}每节课上限`;
  if (rule.dailyCap == null || rule.dailyCap < 1) return `请输入${label}每日上限`;
  if (rule.dailyCap < rule.lessonCap) return `${label}每日上限不能小于每节课上限`;
  return null;
}

export function validateRewardRules(rules: TrainingRewardRules): string | null {
  return validateKindRule(rules.points, '积分') ?? validateKindRule(rules.credits, '学分');
}
