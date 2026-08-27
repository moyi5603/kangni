import { describe, expect, it, beforeEach } from 'vitest';
import { __resetAwardStoreForTests, getAward, grantAwardRewards, removeAward, setAwardResultPublic, setAwardResults, upsertAward, useAwards } from './awardStore';
import { initialAwards, type AwardRecord } from './award';

function sample(overrides: Partial<AwardRecord> = {}): AwardRecord {
  return {
    ...initialAwards[0],
    id: 99,
    name: '临时评优',
    ...overrides,
  };
}

describe('awardStore', () => {
  beforeEach(() => {
    __resetAwardStoreForTests();
  });

  it('inserts and updates awards', () => {
    upsertAward(sample());
    expect(getAward(99)?.name).toBe('临时评优');
    upsertAward(sample({ name: '临时评优-改' }));
    expect(getAward(99)?.name).toBe('临时评优-改');
  });

  it('removes awards', () => {
    expect(removeAward(1)).toBe(true);
    expect(getAward(1)).toBeUndefined();
    expect(removeAward(1)).toBe(false);
  });

  it('locks manual publicity', () => {
    setAwardResultPublic(4, false);
    expect(getAward(4)?.resultPublic).toBe(false);
    expect(getAward(4)?.publicityLocked).toBe(true);
  });

  it('grants rewards to winners and blocks later result edits', () => {
    const results = [{ rank: 1, rankTitle: '一等奖', nominationId: 1, nominationTitle: '甲', nominees: ['张悦'], voteCount: 3, nominator: '王芳' }];
    const grants = [{ name: '张悦', rank: 1, rankTitle: '一等奖', nominationTitle: '甲', points: 500, medalId: 'star', certificateId: 1 }];
    expect(grantAwardRewards(5, results, grants)).toBe(true);
    expect(getAward(5)?.rewardsGranted).toBe(true);
    expect(getAward(5)?.results).toEqual(results);
    expect(getAward(5)?.rewardGrants).toHaveLength(1);
    expect(setAwardResults(5, [])).toBe(false);
    expect(grantAwardRewards(5, results, grants)).toBe(false);
  });
});

describe('useAwards hook export', () => {
  it('is a function for list pages', () => {
    expect(typeof useAwards).toBe('function');
  });
});
