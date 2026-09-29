export const REWARD_RULES_MOCK_VERSION = 3;

export type RewardKindRule = {
  enabled: boolean;
  mode: 'fixed' | null;
  fixedPoints: number | null;
  dailyCapEnabled: boolean;
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
    dailyCapEnabled: false,
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
  return {
    enabled: true,
    mode: 'fixed',
    fixedPoints: rule.fixedPoints,
    dailyCapEnabled: rule.dailyCapEnabled,
    dailyCap: rule.dailyCapEnabled ? rule.dailyCap : null,
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
  if (rule.fixedPoints == null || rule.fixedPoints < 1) return `请输入${label}整节课得分`;
  if (rule.dailyCapEnabled && (rule.dailyCap == null || rule.dailyCap < 1)) return `请输入${label}每日上限`;
  return null;
}

export function validateRewardRules(rules: TrainingRewardRules): string | null {
  return validateKindRule(rules.points, '积分') ?? validateKindRule(rules.credits, '学分');
}
