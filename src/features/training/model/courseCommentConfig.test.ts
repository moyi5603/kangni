import { describe, expect, it } from 'vitest';
import { defaultCourseCommentConfig } from './training';
import { getCourseCommentConfig, updateCourseCommentConfig } from './trainingStore';

describe('course comment config', () => {
  it('returns defaults for known courses', () => {
    expect(getCourseCommentConfig(1)).toEqual(defaultCourseCommentConfig());
  });

  it('returns defaults when course is missing', () => {
    expect(getCourseCommentConfig(999999)).toEqual(defaultCourseCommentConfig());
  });

  it('updates and reads back comment config', () => {
    const next = {
      commentEnabled: false,
      commentAuditEnabled: true,
      likeEnabled: false,
      favoriteEnabled: true,
    };
    expect(updateCourseCommentConfig(1, next)).toBe(true);
    expect(getCourseCommentConfig(1)).toEqual(next);
    updateCourseCommentConfig(1, defaultCourseCommentConfig());
  });
});
