import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEMO_SIGNUP_USER } from '../../c-end/activities/model/signupStore';
import {
  getCourseEngagementSnapshot,
  getCourseFavoritedBy,
  getCourseLikedBy,
  getCourseLikeCount,
  resetCourseEngagement,
  toggleCourseFavorite,
  toggleCourseLike,
  useCourseEngagement,
} from './courseEngagementStore';

function Probe() {
  const engagement = useCourseEngagement(1);
  return createElement('span', null, engagement.likes);
}

describe('course engagement store', () => {
  afterEach(() => {
    resetCourseEngagement();
  });

  it('seeds likes on course 1 and 2', () => {
    expect(getCourseLikedBy(1)).toHaveLength(3);
    expect(getCourseLikedBy(2)).toHaveLength(1);
    expect(getCourseLikeCount(1)).toBe(3);
    expect(getCourseFavoritedBy(2)).toEqual([DEMO_SIGNUP_USER.name]);
  });

  it('toggles like on and off for the demo user', () => {
    const before = getCourseLikedBy(1).length;
    toggleCourseLike(1);
    expect(getCourseLikedBy(1)).toHaveLength(before + 1);
    expect(getCourseLikedBy(1).includes(DEMO_SIGNUP_USER.name)).toBe(true);
    toggleCourseLike(1);
    expect(getCourseLikedBy(1)).toHaveLength(before);
  });

  it('toggles favorite on and off', () => {
    toggleCourseFavorite(2);
    expect(getCourseFavoritedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(false);
    toggleCourseFavorite(2);
    expect(getCourseFavoritedBy(2).includes(DEMO_SIGNUP_USER.name)).toBe(true);
  });

  it('ignores ids missing from trainingStore', () => {
    toggleCourseLike(9001);
    toggleCourseFavorite(9001);
    expect(getCourseLikedBy(9001)).toEqual([]);
    expect(getCourseFavoritedBy(9001)).toEqual([]);
  });

  it('reset restores seed after toggles', () => {
    toggleCourseLike(1);
    toggleCourseFavorite(2);
    resetCourseEngagement();
    expect(getCourseLikedBy(1).includes(DEMO_SIGNUP_USER.name)).toBe(false);
    expect(getCourseFavoritedBy(2)).toEqual([DEMO_SIGNUP_USER.name]);
  });

  it('keeps a stable engagement snapshot until a mutation', () => {
    const first = getCourseEngagementSnapshot();
    const second = getCourseEngagementSnapshot();
    expect(first).toBe(second);
    toggleCourseLike(1);
    const after = getCourseEngagementSnapshot();
    expect(after).not.toBe(first);
  });

  it('renders useCourseEngagement without throwing', () => {
    expect(renderToStaticMarkup(createElement(Probe))).toContain('3');
  });
});
