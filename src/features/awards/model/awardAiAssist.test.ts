import { describe, expect, it } from 'vitest';
import { generateAwardCriteria, generateAwardIntro, generateAwardName } from './awardAiAssist';

describe('awardAiAssist', () => {
  it('suggests name by award type', () => {
    expect(generateAwardName('个人')).toContain('优秀员工');
    expect(generateAwardName('团队')).toContain('团队');
    expect(generateAwardName('项目')).toContain('项目');
  });

  it('suggests intro within 500 chars', () => {
    const intro = generateAwardIntro('个人', '年度优秀员工');
    expect(intro.length).toBeGreaterThan(20);
    expect(intro.length).toBeLessThanOrEqual(500);
    expect(intro).toContain('年度优秀员工');
  });

  it('suggests up to 3 criteria', () => {
    const criteria = generateAwardCriteria('团队');
    expect(criteria.length).toBeGreaterThanOrEqual(1);
    expect(criteria.length).toBeLessThanOrEqual(3);
    expect(criteria.every((item) => item.trim())).toBe(true);
  });
});
