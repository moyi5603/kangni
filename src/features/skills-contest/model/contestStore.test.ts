import { beforeEach, describe, expect, it } from 'vitest';
import { __resetContestStoreForTests, getChallengeDayLogs, getContest, getContestSignups, removeContest, saveContest, setSignupStages } from './contestStore';
import { __resetRegionStoreForTests, enabledRegionOptions, removeRegion, saveRegion } from './regionStore';
import { defaultChallengeFields, defaultEligibleStageIds } from './contest';
import { defaultContestSignupFields } from './contestSignupFields';

describe('contestStore', () => {
  beforeEach(() => {
    __resetContestStoreForTests();
    __resetRegionStoreForTests();
  });

  it('cascades signup delete and prunes eligibility when a stage is removed', () => {
    const contest = getContest(1);
    expect(contest).toBeTruthy();
    if (!contest) return;
    const signups = getContestSignups(contest.id);
    expect(signups.length).toBeGreaterThanOrEqual(3);
    expect(signups[0].eligibleStageIds).toEqual(defaultEligibleStageIds(contest.stages));
    expect(contest.stages[0].dailyGateCount).toBe(3);
    expect(contest.stages[1].dailyGateCount).toBe(2);
    expect(contest.stages[0].mapId).toBe('island');
    expect(contest.stages[1].mapId).toBe('city');
    expect(contest.stages[0].learningPlanIds).toEqual([1]);
    expect(contest.stages[1].learningPlanIds ?? []).toEqual([]);
    expect(getChallengeDayLogs(1)).toHaveLength(3);

    const kept = contest.stages[0];
    saveContest({
      ...contest,
      stages: [kept],
    });
    const after = getContestSignups(1);
    expect(after.every((row) => row.eligibleStageIds.every((id) => id === kept.id))).toBe(true);

    removeContest(1);
    expect(getContest(1)).toBeUndefined();
    expect(getContestSignups(1)).toEqual([]);
    expect(getChallengeDayLogs(1)).toEqual([]);
  });

  it('batch sets stages by overwrite', () => {
    const rows = setSignupStages(1, [1, 2], ['st-final']);
    const touched = rows.filter((row) => row.id === 1 || row.id === 2);
    expect(touched.every((row) => row.eligibleStageIds.length === 1 && row.eligibleStageIds[0] === 'st-final')).toBe(true);
  });
});

describe('regionStore', () => {
  beforeEach(() => {
    __resetContestStoreForTests();
    __resetRegionStoreForTests();
  });

  it('refuses delete when signups reference the region', () => {
    const result = removeRegion(1);
    expect(result.ok).toBe(false);
    expect(enabledRegionOptions().every((item) => item.enabled)).toBe(true);
  });

  it('saves unique names', () => {
    const created = saveRegion({ id: 0, name: '西南', parentId: null, sort: 9, enabled: true });
    expect(created.ok).toBe(true);
    const dup = saveRegion({ id: 0, name: '西南', parentId: null, sort: 10, enabled: true });
    expect(dup.ok).toBe(false);
    const cityDup = saveRegion({ id: 0, name: '南京市', parentId: 2, sort: 2, enabled: true });
    expect(cityDup.ok).toBe(true);
  });
});

describe('seed signup fields', () => {
  it('includes 所属区域', () => {
    expect(defaultContestSignupFields().some((field) => field.key === '所属区域')).toBe(true);
    expect(defaultChallengeFields().questionsPerGate).toBe(5);
  });
});
