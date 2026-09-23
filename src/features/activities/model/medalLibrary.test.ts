import { beforeEach, describe, expect, it } from 'vitest';
import { __resetMedalLibraryForTests, addMedal, getMedal, initialMedals } from './medalLibrary';

describe('medalLibrary', () => {
  beforeEach(() => {
    __resetMedalLibraryForTests();
  });
  it('tags seeded medals with scope', () => {
    expect(getMedal('attend')?.scope).toBe('文化打卡');
    expect(getMedal('join')?.scope).toBe('通用');
    expect(initialMedals.length).toBeGreaterThan(8);
  });

  it('stores description when adding a medal', () => {
    const created = addMedal('测试勋章', 'data:image/svg+xml,x', { scope: '文化打卡', description: '连续打卡奖励' });
    expect(created.scope).toBe('文化打卡');
    expect(created.description).toBe('连续打卡奖励');
    expect(getMedal(created.id)?.name).toBe('测试勋章');
  });
});
