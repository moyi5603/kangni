import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEMO_SIGNUP_USER } from './signupStore';
import {
  getEngagementSnapshot,
  getFavoriteActivityIds,
  getFavoritedBy,
  getLikedBy,
  resetEngagement,
  toggleFavorite,
  toggleLike,
  useActivityEngagement,
} from './engagementStore';

function Probe() {
  const engagement = useActivityEngagement(2);
  return createElement('span', null, engagement.likes);
}

describe('engagement store', () => {
  afterEach(() => {
    resetEngagement();
  });

  it('seeds likes without 陈产品 and two favorites for 陈产品', () => {
    expect(getLikedBy(1)).toHaveLength(3);
    expect(getLikedBy(1).includes(DEMO_SIGNUP_USER.name)).toBe(false);
    expect(getLikedBy(2)).toHaveLength(1);
    expect(getLikedBy(9)).toHaveLength(12);
    expect(getLikedBy(21)).toHaveLength(18);
    expect(getFavoritedBy(2)).toEqual([DEMO_SIGNUP_USER.name]);
    expect(getFavoritedBy(9)).toHaveLength(4);
    expect(getFavoritedBy(9).includes(DEMO_SIGNUP_USER.name)).toBe(true);
    expect(getFavoriteActivityIds()).toEqual([2, 9]);
  });

  it('toggles like on and off for the demo user', () => {
    const before = getLikedBy(2).length;
    toggleLike(2);
    expect(getLikedBy(2)).toHaveLength(before + 1);
    expect(getLikedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(true);
    toggleLike(2);
    expect(getLikedBy(2)).toHaveLength(before);
    expect(getLikedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(false);
  });

  it('toggles favorite on and off', () => {
    toggleFavorite(2);
    expect(getFavoriteActivityIds().includes(2)).toBe(false);
    toggleFavorite(2);
    expect(getFavoriteActivityIds().includes(2)).toBe(true);
  });

  it('ignores ids missing from activityStore', () => {
    toggleLike(9001);
    toggleFavorite(9001);
    expect(getLikedBy(9001)).toEqual([]);
    expect(getFavoritedBy(9001)).toEqual([]);
    expect(getFavoriteActivityIds().includes(9001)).toBe(false);
  });

  it('creates a list when a real activity has no seed', () => {
    toggleLike(3);
    expect(getLikedBy(3)).toEqual([DEMO_SIGNUP_USER.name]);
  });

  it('reset restores seed after toggles', () => {
    toggleLike(2);
    toggleFavorite(10);
    resetEngagement();
    expect(getLikedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(false);
    expect(getFavoriteActivityIds()).toEqual([2, 9]);
  });

  it('keeps a stable engagement snapshot until a mutation', () => {
    const first = getEngagementSnapshot();
    const second = getEngagementSnapshot();
    expect(first).toBe(second);
    toggleLike(2);
    const after = getEngagementSnapshot();
    expect(after).not.toBe(first);
    expect(after.likedBy[2]?.includes(DEMO_SIGNUP_USER.name)).toBe(true);
  });

  it('renders useActivityEngagement without throwing', () => {
    expect(renderToStaticMarkup(createElement(Probe))).toContain('1');
  });
});
