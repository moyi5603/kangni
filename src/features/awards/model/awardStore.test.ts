import { describe, expect, it, beforeEach } from 'vitest';
import { __resetAwardStoreForTests, getAward, removeAward, setAwardResultPublic, upsertAward, useAwards } from './awardStore';
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
});

describe('useAwards hook export', () => {
  it('is a function for list pages', () => {
    expect(typeof useAwards).toBe('function');
  });
});
