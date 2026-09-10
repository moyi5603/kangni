import { beforeEach, describe, expect, it } from 'vitest';
import { __resetCheckinStoreForTests, distinctCheckinUsers, removeTheme, submitUserCheckin } from './checkinStore';

describe('checkinStore', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('rejects a second checkin on the same day', () => {
    const first = submitUserCheckin({ themeId: 2, userId: 'u9', user: '王五', department: '生产', account: 'wangwu', at: '2026-09-10 10:00' });
    expect(first.ok).toBe(true);
    const second = submitUserCheckin({ themeId: 2, userId: 'u9', user: '王五', department: '生产', account: 'wangwu', at: '2026-09-10 11:00' });
    expect(second.ok).toBe(false);
  });

  it('counts distinct users per theme', () => {
    expect(distinctCheckinUsers(1)).toBe(1);
  });

  it('blocks removeTheme when logs exist', () => {
    expect(removeTheme(1).ok).toBe(false);
  });
});
