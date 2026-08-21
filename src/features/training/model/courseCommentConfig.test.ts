import { describe, expect, it } from 'vitest';
import { defaultCourseCommentConfig } from './training';
import {
  getCourseCommentConfig,
  rebuildCoursesFromMockKeepingCommentConfigs,
  updateCourseCommentConfig,
} from './trainingStore';

describe('course comment config', () => {
  it('returns defaults for known courses', () => {
    updateCourseCommentConfig(1, defaultCourseCommentConfig());
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

  it('keeps comment config after courses rebuild from mock', () => {
    const next = {
      commentEnabled: false,
      commentAuditEnabled: false,
      likeEnabled: false,
      favoriteEnabled: false,
    };
    updateCourseCommentConfig(1, next);
    rebuildCoursesFromMockKeepingCommentConfigs();
    expect(getCourseCommentConfig(1)).toEqual(next);
    updateCourseCommentConfig(1, defaultCourseCommentConfig());
  });
});
