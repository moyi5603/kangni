import { describe, expect, it } from 'vitest';
import {
  applicationMenus,
  applications,
  getApplication,
  getDirectApplications,
  parseCEndHash,
  parseLocationHash,
  toCEndPortalHash,
  toH5CourseListHash,
  toH5CourseDetailHash,
  toPcCourseListHash,
  toPcCourseDetailHash,
  toH5FavoritesHash,
  toH5MySignupsHash,
  toPcFavoritesHash,
  toPcMySignupsHash,
} from './navigation';

describe('applications', () => {
  it('shows 课程 instead of 培训课程', () => {
    const training = applications.find((item) => item.key === 'training');
    expect(training?.label).toBe('课程');
    expect(applications.some((item) => item.label === '培训课程')).toBe(false);
  });
});

describe('training application menus', () => {
  it('uses first-level menu items only', () => {
    expect(applicationMenus.training).toEqual([
      { key: 'training-courses', icon: 'book', label: '课程管理' },
      { key: 'training-courseware', icon: 'fileText', label: '课件管理' },
      { key: 'training-records', icon: 'checkCircle', label: '学习记录' },
      { key: 'training-rules', icon: 'fileText', label: '规则设置' },
    ]);
  });

  it('parses hash for 课件管理 page', () => {
    expect(parseLocationHash('#/training/training-courseware')).toEqual({
      application: 'training',
      page: 'training-courseware',
    });
  });

  it('falls back when 课件分类 / 课程分类 menu removed', () => {
    expect(parseLocationHash('#/training/training-courseware-categories')).toEqual({
      application: 'training',
      page: 'training-courses',
    });
    expect(parseLocationHash('#/training/training-categories')).toEqual({
      application: 'training',
      page: 'training-courses',
    });
  });
});

describe('C-end navigation', () => {
  it('treats #/c as the C-end portal', () => {
    expect(parseCEndHash('#/c')).toEqual({ kind: 'preview' });
    expect(parseCEndHash('#/c/')).toEqual({ kind: 'preview' });
    expect(toCEndPortalHash()).toBe('#/c');
  });

  it('parses the H5 my signups page', () => {
    expect(parseCEndHash('#/c/h5/my')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'my',
    });
  });

  it('parses the PC my signups page', () => {
    expect(parseCEndHash('#/c/pc/my')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'my',
    });
  });

  it('keeps parsing numeric activity details', () => {
    expect(parseCEndHash('#/c/h5/21')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 21,
    });
    expect(parseCEndHash('#/c/pc/21')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      activityId: 21,
    });
  });

  it('builds the my signups hashes', () => {
    expect(toH5MySignupsHash()).toBe('#/c/h5/my');
    expect(toPcMySignupsHash()).toBe('#/c/pc/my');
  });

  it('parses the H5 course list page', () => {
    expect(parseCEndHash('#/c/h5/courses')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'courses',
    });
  });

  it('builds the H5 course list hash', () => {
    expect(toH5CourseListHash()).toBe('#/c/h5/courses');
  });

  it('treats the old mall hash as the course list', () => {
    expect(parseCEndHash('#/c/h5/courses-mall')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'courses',
    });
  });

  it('parses the H5 course detail page', () => {
    expect(parseCEndHash('#/c/h5/course-1')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'course-detail',
      courseId: 1,
    });
    expect(parseCEndHash('#/c/h5/courses/1')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'course-detail',
      courseId: 1,
    });
  });

  it('builds the H5 course detail hash', () => {
    expect(toH5CourseDetailHash(1)).toBe('#/c/h5/course-1');
  });

  it('parses the PC course list and detail pages', () => {
    expect(parseCEndHash('#/c/course')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'courses',
    });
    expect(parseCEndHash('#/c/course/1')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'course-detail',
      courseId: 1,
    });
    expect(parseCEndHash('#/c/pc/courses')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'courses',
    });
    expect(parseCEndHash('#/c/pc/course-1')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'course-detail',
      courseId: 1,
    });
  });

  it('builds the PC course hashes', () => {
    expect(toPcCourseListHash()).toBe('#/c/course');
    expect(toPcCourseDetailHash(1)).toBe('#/c/course/1');
  });

  it('parses favorites pages before numeric ids', () => {
    expect(parseCEndHash('#/c/h5/favorites')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'favorites',
    });
    expect(parseCEndHash('#/c/pc/favorites')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'favorites',
    });
  });

  it('builds the favorites hashes', () => {
    expect(toH5FavoritesHash()).toBe('#/c/h5/favorites');
    expect(toPcFavoritesHash()).toBe('#/c/pc/favorites');
  });

  it('treats activity comments hash as activity detail', () => {
    expect(parseCEndHash('#/c/h5/1/comments')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 1,
    });
    expect(parseCEndHash('#/c/pc/1/comments')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      activityId: 1,
    });
  });

  it('ignores unknown extra segments and keeps the activity detail', () => {
    expect(parseCEndHash('#/c/h5/21/nope')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 21,
    });
  });

});

describe('skills-contest application', () => {
  it('registers the app under 员工与组织 with contest-list as default', () => {
    expect(getApplication('skills-contest')).toEqual({
      key: 'skills-contest',
      label: '技能大赛',
      category: '员工与组织',
      icon: 'trophy',
      defaultPage: 'contest-list',
    });
  });

  it('uses three first-level menus with no children', () => {
    expect(applicationMenus['skills-contest']).toEqual([
      { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
      { key: 'signup-list', icon: 'unorderedList', label: '报名' },
      { key: 'score-list', icon: 'checkCircle', label: '成绩' },
    ]);
  });

  it('parses a leaf hash', () => {
    expect(parseLocationHash('#/skills-contest/signup-list')).toEqual({
      application: 'skills-contest',
      page: 'signup-list',
    });
  });

  it('falls back to contest-list when page is missing or unknown', () => {
    expect(parseLocationHash('#/skills-contest')).toEqual({
      application: 'skills-contest',
      page: 'contest-list',
    });
    expect(parseLocationHash('#/skills-contest/not-a-page')).toEqual({
      application: 'skills-contest',
      page: 'contest-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('skills-contest');
  });
});

describe('exam application', () => {
  it('registers the app under 员工与组织 with exam-list as default', () => {
    expect(getApplication('exam')).toEqual({
      key: 'exam',
      label: '考试',
      category: '员工与组织',
      icon: 'fileText',
      defaultPage: 'exam-list',
    });
  });

  it('sits immediately before 人文关怀', () => {
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('exam')).toBe(keys.indexOf('care') - 1);
    expect(keys.indexOf('exam')).toBe(keys.indexOf('skills-contest') + 1);
    expect(keys.indexOf('exam')).toBeGreaterThan(keys.indexOf('training'));
  });

  it('uses four first-level menus without exam-categories', () => {
    expect(applicationMenus['exam']).toEqual([
      { key: 'exam-overview', icon: 'dashboard', label: '概览' },
      { key: 'exam-list', icon: 'unorderedList', label: '考试管理' },
      { key: 'exam-tags', icon: 'tags', label: '考试标签' },
      { key: 'exam-rules', icon: 'fileText', label: '规则设置' },
    ]);
  });

  it('parses a leaf hash', () => {
    expect(parseLocationHash('#/exam/exam-list')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
  });

  it('parses exam-create and exam-edit hashes', () => {
    expect(parseLocationHash('#/exam/exam-create')).toEqual({
      application: 'exam',
      page: 'exam-create',
    });
    expect(parseLocationHash('#/exam/exam-edit/3')).toEqual({
      application: 'exam',
      page: 'exam-edit',
      recordId: '3',
    });
  });

  it('falls back to exam-list when page is missing, unknown, or legacy categories', () => {
    expect(parseLocationHash('#/exam')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
    expect(parseLocationHash('#/exam/not-a-page')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
    expect(parseLocationHash('#/exam/exam-categories')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('exam');
  });
});
