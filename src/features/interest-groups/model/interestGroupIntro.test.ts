import { describe, expect, it } from 'vitest';
import { generateInterestGroupIntro } from './interestGroupIntro';

describe('generateInterestGroupIntro', () => {
  it('returns category-specific copy for known keys', () => {
    expect(generateInterestGroupIntro('sport')).toContain('健身');
    expect(generateInterestGroupIntro('learning')).toContain('书');
    expect(generateInterestGroupIntro('career')).toContain('职场');
    expect(generateInterestGroupIntro('game')).toContain('开局');
    expect(generateInterestGroupIntro('movie')).toContain('电影');
    expect(generateInterestGroupIntro('volunteer')).toContain('公益');
  });

  it('falls back when category is empty or unknown', () => {
    expect(generateInterestGroupIntro('')).toContain('兴趣');
    expect(generateInterestGroupIntro('unknown-key')).toContain('兴趣');
  });

  it('stays within intro max length', () => {
    expect(generateInterestGroupIntro('sport').length).toBeLessThanOrEqual(500);
  });
});
