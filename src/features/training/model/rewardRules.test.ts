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
  intervalMinutes: 5,
  pointsPerInterval: 2,
  lessonCap: 20,
  dailyCap: 50,
};

const durationEnabled: RewardKindRule = {
  enabled: true,
  mode: 'duration',
  fixedPoints: 10,
  intervalMinutes: 5,
  pointsPerInterval: 2,
  lessonCap: 20,
  dailyCap: 50,
};

describe('prepareKindForSave', () => {
  it('clears all fields when disabled', () => {
    expect(prepareKindForSave({ ...fixedEnabled, enabled: false })).toEqual(emptyKindRule());
  });

  it('keeps fixed fields and clears duration fields', () => {
    expect(prepareKindForSave(fixedEnabled)).toEqual({
      enabled: true,
      mode: 'fixed',
      fixedPoints: 10,
      intervalMinutes: null,
      pointsPerInterval: null,
      lessonCap: 20,
      dailyCap: 50,
    });
  });

  it('keeps duration fields and clears fixed points', () => {
    expect(prepareKindForSave(durationEnabled)).toEqual({
      enabled: true,
      mode: 'duration',
      fixedPoints: null,
      intervalMinutes: 5,
      pointsPerInterval: 2,
      lessonCap: 20,
      dailyCap: 50,
    });
  });
});

describe('validateKindRule', () => {
  it('skips validation when disabled', () => {
    expect(validateKindRule(emptyKindRule(), '积分')).toBeNull();
  });

  it('requires mode when enabled', () => {
    expect(validateKindRule({ ...emptyKindRule(), enabled: true }, '积分')).toBe('请选择积分发放方式');
  });

  it('accepts valid fixed rule', () => {
    expect(validateKindRule(fixedEnabled, '积分')).toBeNull();
  });

  it('accepts valid duration rule', () => {
    expect(validateKindRule(durationEnabled, '学分')).toBeNull();
  });

  it('rejects dailyCap below lessonCap', () => {
    expect(validateKindRule({ ...fixedEnabled, dailyCap: 10, lessonCap: 20 }, '积分')).toBe(
      '积分每日上限不能小于每节课上限',
    );
  });
});

describe('validateRewardRules / prepareRewardRulesForSave', () => {
  it('validates points then credits', () => {
    const bad = prepareRewardRulesForSave({
      points: { ...fixedEnabled, dailyCap: 1, lessonCap: 10 },
      credits: emptyKindRule(),
    });
    expect(validateRewardRules(bad)).toBe('积分每日上限不能小于每节课上限');
  });

  it('prepares both kinds', () => {
    const prepared = prepareRewardRulesForSave({
      points: fixedEnabled,
      credits: { ...durationEnabled, enabled: false },
    });
    expect(prepared.points.mode).toBe('fixed');
    expect(prepared.credits).toEqual(emptyKindRule());
  });
});
