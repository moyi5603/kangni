import { describe, expect, it } from 'vitest';
import {
  emptyKindRule,
  prepareKindForSave,
  prepareRewardRulesForSave,
  validateKindRule,
  validateRewardRules,
  type RewardKindRule,
} from './rewardRules';

const fixedEnabled: RewardKindRule = {
  enabled: true,
  mode: 'fixed',
  fixedPoints: 10,
  dailyCapEnabled: true,
  dailyCap: 50,
};

describe('prepareKindForSave', () => {
  it('clears all fields when disabled', () => {
    expect(prepareKindForSave({ ...fixedEnabled, enabled: false })).toEqual(emptyKindRule());
  });

  it('keeps the whole-lesson score and daily cap', () => {
    expect(prepareKindForSave(fixedEnabled)).toEqual({
      enabled: true,
      mode: 'fixed',
      fixedPoints: 10,
      dailyCapEnabled: true,
      dailyCap: 50,
    });
  });

  it('clears the daily cap when its switch is off', () => {
    expect(prepareKindForSave({ ...fixedEnabled, dailyCapEnabled: false })).toEqual({
      enabled: true,
      mode: 'fixed',
      fixedPoints: 10,
      dailyCapEnabled: false,
      dailyCap: null,
    });
  });
});

describe('validateKindRule', () => {
  it('skips validation when disabled', () => {
    expect(validateKindRule(emptyKindRule(), '积分')).toBeNull();
  });

  it('requires the whole-lesson score when enabled', () => {
    expect(validateKindRule({ ...emptyKindRule(), enabled: true }, '积分')).toBe('请输入积分整节课得分');
  });

  it('accepts a score given only after the whole lesson', () => {
    expect(validateKindRule(fixedEnabled, '积分')).toBeNull();
  });

  it('skips the daily cap when its switch is off', () => {
    expect(validateKindRule({ ...fixedEnabled, dailyCapEnabled: false, dailyCap: null }, '学分')).toBeNull();
  });

  it('requires a daily cap when its switch is on', () => {
    expect(validateKindRule({ ...fixedEnabled, dailyCap: null }, '积分')).toBe('请输入积分每日上限');
  });
});

describe('validateRewardRules / prepareRewardRulesForSave', () => {
  it('validates points then credits', () => {
    const bad = prepareRewardRulesForSave({
      points: { ...fixedEnabled, fixedPoints: null },
      credits: emptyKindRule(),
    });
    expect(validateRewardRules(bad)).toBe('请输入积分整节课得分');
  });

  it('prepares both kinds', () => {
    const prepared = prepareRewardRulesForSave({
      points: fixedEnabled,
      credits: { ...fixedEnabled, enabled: false },
    });
    expect(prepared.points.mode).toBe('fixed');
    expect(prepared.credits).toEqual(emptyKindRule());
  });
});
