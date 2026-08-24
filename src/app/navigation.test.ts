import { describe, expect, it } from 'vitest';
import {
  applicationMenus,
  applications,
  getApplication,
  getDirectApplications,
  parseCEndHash,
  parseLocationHash,
  siderSelectedKey,
  toLocationHash,
  toCEndPortalHash,
  toH5CourseListHash,
  toH5ExamListHash,
  toH5ExamPrepHash,
  toH5ExamTakingHash,
  toH5ExamResultHash,
  toH5ExamReviewHash,
  toH5ExamRecordsHash,
  toH5ExamRankHash,
  toH5CourseDetailHash,
  toPcCourseListHash,
  toPcCourseDetailHash,
  toPcExamListHash,
  toPcExamPrepHash,
  toPcExamTakingHash,
  toPcExamResultHash,
  toPcExamReviewHash,
  toPcExamRecordsHash,
  toPcExamRankHash,
  toH5FavoritesHash,
  toH5MySignupsHash,
  toPcFavoritesHash,
  toPcMySignupsHash,
  toCEndSignupHash,
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
      { key: 'training-overview', icon: 'dashboard', label: '概览' },
      { key: 'training-courses', icon: 'book', label: '课程管理' },
      { key: 'training-courseware', icon: 'fileText', label: '课件管理' },
      { key: 'training-rules', icon: 'fileText', label: '规则设置' },
    ]);
    expect(getApplication('training')?.defaultPage).toBe('training-overview');
    expect(parseLocationHash('#/training/training-overview')).toEqual({
      application: 'training',
      page: 'training-overview',
    });
  });

  it('parses hash for 课件管理 page', () => {
    expect(parseLocationHash('#/training/training-courseware')).toEqual({
      application: 'training',
      page: 'training-courseware',
    });
  });

  it('parses course detail hash and keeps 课程管理 selected', () => {
    expect(parseLocationHash('#/training/course-detail/1')).toEqual({
      application: 'training',
      page: 'course-detail',
      recordId: '1',
    });
    expect(siderSelectedKey('course-detail')).toBe('training-courses');
    expect(parseLocationHash('#/training/course-detail/3/records')).toEqual({
      application: 'training',
      page: 'course-detail',
      recordId: '3',
      tab: 'records',
    });
    expect(parseLocationHash('#/training/course-comments/1')).toEqual({
      application: 'training',
      page: 'course-detail',
      recordId: '1',
      tab: 'comments',
    });
  });

  it('falls back when 课件分类 / 课程分类 menu removed', () => {
    expect(parseLocationHash('#/training/training-courseware-categories')).toEqual({
      application: 'training',
      page: 'training-overview',
    });
    expect(parseLocationHash('#/training/training-categories')).toEqual({
      application: 'training',
      page: 'training-overview',
    });
    expect(parseLocationHash('#/training/training-records')).toEqual({
      application: 'training',
      page: 'training-overview',
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

  it('parses the H5 exam list page', () => {
    expect(parseCEndHash('#/c/h5/exams')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exams',
    });
  });

  it('builds the H5 exam list hash', () => {
    expect(toH5ExamListHash()).toBe('#/c/h5/exams');
  });

  it('parses the H5 exam prep page from list card hashes', () => {
    expect(parseCEndHash('#/c/h5/exam-7')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-prep',
      examId: 7,
    });
    expect(parseCEndHash('#/c/h5/exams/7')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-prep',
      examId: 7,
    });
  });

  it('parses the H5 exam taking page only after start', () => {
    expect(parseCEndHash('#/c/h5/exam-7/take')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-taking',
      examId: 7,
    });
  });

  it('parses the H5 exam result page after submit', () => {
    expect(parseCEndHash('#/c/h5/exam-7/result')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-result',
      examId: 7,
    });
  });

  it('parses the H5 exam review page from 回顾答题', () => {
    expect(parseCEndHash('#/c/h5/exam-7/review')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-review',
      examId: 7,
    });
  });

  it('parses the H5 exam records page', () => {
    expect(parseCEndHash('#/c/h5/exam-6/records')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-records',
      examId: 6,
    });
  });

  it('parses the H5 exam rank page', () => {
    expect(parseCEndHash('#/c/h5/exam-6/rank')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'exam-rank',
      examId: 6,
    });
  });

  it('builds the H5 exam prep and taking hashes', () => {
    expect(toH5ExamPrepHash(7)).toBe('#/c/h5/exam-7');
    expect(toH5ExamTakingHash(7)).toBe('#/c/h5/exam-7/take');
    expect(toH5ExamResultHash(7)).toBe('#/c/h5/exam-7/result');
    expect(toH5ExamReviewHash(7)).toBe('#/c/h5/exam-7/review');
    expect(toH5ExamRecordsHash(6)).toBe('#/c/h5/exam-6/records');
    expect(toH5ExamRankHash(6)).toBe('#/c/h5/exam-6/rank');
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

  it('parses the PC exam list and flow pages', () => {
    expect(parseCEndHash('#/c/exam')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exams',
    });
    expect(parseCEndHash('#/c/exam/7')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exam-prep',
      examId: 7,
    });
    expect(parseCEndHash('#/c/exam/7/take')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exam-taking',
      examId: 7,
    });
    expect(parseCEndHash('#/c/exam/7/result')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exam-result',
      examId: 7,
    });
    expect(parseCEndHash('#/c/exam/7/review')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exam-review',
      examId: 7,
    });
    expect(parseCEndHash('#/c/exam/6/records')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exam-records',
      examId: 6,
    });
    expect(parseCEndHash('#/c/exam/6/rank')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'exam-rank',
      examId: 6,
    });
  });

  it('builds the PC exam hashes', () => {
    expect(toPcExamListHash()).toBe('#/c/exam');
    expect(toPcExamPrepHash(7)).toBe('#/c/exam/7');
    expect(toPcExamTakingHash(7)).toBe('#/c/exam/7/take');
    expect(toPcExamResultHash(7)).toBe('#/c/exam/7/result');
    expect(toPcExamReviewHash(7)).toBe('#/c/exam/7/review');
    expect(toPcExamRecordsHash(6)).toBe('#/c/exam/6/records');
    expect(toPcExamRankHash(6)).toBe('#/c/exam/6/rank');
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

  it('parses activity signup secondary page', () => {
    expect(parseCEndHash('#/c/h5/2/signup')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 2,
      h5Page: 'signup',
    });
    expect(parseCEndHash('#/c/pc/2/signup')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      activityId: 2,
      h5Page: 'signup',
    });
    expect(toCEndSignupHash('h5', 2)).toBe('#/c/h5/2/signup');
    expect(toCEndSignupHash('pc', 9)).toBe('#/c/pc/9/signup');
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

describe('activity detail tab hash', () => {
  it('parses the tab segment of activity-detail hash', () => {
    expect(parseLocationHash('#/activities/activity-detail/3/signups')).toEqual({
      application: 'activities',
      page: 'activity-detail',
      recordId: '3',
      tab: 'signups',
    });
  });

  it('keeps three-segment activity-detail hash without tab', () => {
    expect(parseLocationHash('#/activities/activity-detail/3')).toEqual({
      application: 'activities',
      page: 'activity-detail',
      recordId: '3',
    });
  });

  it('writes tab as fourth segment in toLocationHash', () => {
    expect(toLocationHash('activities', 'activity-detail', '3', 'comments')).toBe('#/activities/activity-detail/3/comments');
    expect(toLocationHash('activities', 'activity-detail', '3')).toBe('#/activities/activity-detail/3');
    expect(toLocationHash('activities', 'activity-list')).toBe('#/activities/activity-list');
  });

  it('redirects legacy related-page hashes to activity-detail tabs', () => {
    expect(parseLocationHash('#/activities/activity-signups/3')).toEqual({
      application: 'activities',
      page: 'activity-detail',
      recordId: '3',
      tab: 'signups',
    });
    expect(parseLocationHash('#/activities/activity-moments/7')).toEqual({
      application: 'activities',
      page: 'activity-detail',
      recordId: '7',
      tab: 'moments',
    });
  });

  it('falls back to activities defaultPage for legacy related hash without recordId', () => {
    expect(parseLocationHash('#/activities/activity-signups')).toEqual({
      application: 'activities',
      page: 'activity-overview',
    });
  });
});

describe('exam application', () => {
  it('registers the app under 员工与组织 with exam-list as default', () => {
    expect(getApplication('exam')).toEqual({
      key: 'exam',
      label: '考试练习',
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

  it('groups 考试管理/试题库 under 考试 and 习题库 under 练习', () => {
    expect(applicationMenus['exam']).toEqual([
      { key: 'exam-overview', icon: 'dashboard', label: '概览' },
      {
        key: 'exam-group',
        icon: 'fileText',
        label: '考试',
        children: [
          { key: 'exam-list', icon: 'unorderedList', label: '考试管理' },
          { key: 'exam-questions', icon: 'fileText', label: '试题库' },
          { key: 'exam-papers', icon: 'fileText', label: '试卷管理' },
          { key: 'exam-certificates', icon: 'trophy', label: '证书管理' },
        ],
      },
      {
        key: 'practice-group',
        icon: 'checkSquare',
        label: '练习',
        children: [{ key: 'practice-questions', icon: 'unorderedList', label: '习题库' }],
      },
    ]);
  });

  it('parses question-create and question-edit hashes', () => {
    expect(parseLocationHash('#/exam/question-create')).toEqual({
      application: 'exam',
      page: 'question-create',
    });
    expect(parseLocationHash('#/exam/question-edit/3')).toEqual({
      application: 'exam',
      page: 'question-edit',
      recordId: '3',
    });
    expect(parseLocationHash('#/exam/question-detail/3')).toEqual({
      application: 'exam',
      page: 'question-detail',
      recordId: '3',
    });
    expect(siderSelectedKey('question-create')).toBe('exam-questions');
    expect(siderSelectedKey('question-edit')).toBe('exam-questions');
    expect(siderSelectedKey('question-detail')).toBe('exam-questions');
  });

  it('parses practice-question-create and practice-question-edit hashes', () => {
    expect(parseLocationHash('#/exam/practice-question-create')).toEqual({
      application: 'exam',
      page: 'practice-question-create',
    });
    expect(parseLocationHash('#/exam/practice-question-edit/101')).toEqual({
      application: 'exam',
      page: 'practice-question-edit',
      recordId: '101',
    });
    expect(parseLocationHash('#/exam/practice-question-detail/105')).toEqual({
      application: 'exam',
      page: 'practice-question-detail',
      recordId: '105',
    });
    expect(siderSelectedKey('practice-question-create')).toBe('practice-questions');
    expect(siderSelectedKey('practice-question-edit')).toBe('practice-questions');
    expect(siderSelectedKey('practice-question-detail')).toBe('practice-questions');
  });

  it('parses paper-create, paper-edit and paper-detail hashes', () => {
    expect(parseLocationHash('#/exam/paper-create')).toEqual({
      application: 'exam',
      page: 'paper-create',
    });
    expect(parseLocationHash('#/exam/paper-edit/2')).toEqual({
      application: 'exam',
      page: 'paper-edit',
      recordId: '2',
    });
    expect(parseLocationHash('#/exam/paper-detail/2')).toEqual({
      application: 'exam',
      page: 'paper-detail',
      recordId: '2',
    });
    expect(parseLocationHash('#/exam/paper-detail/2/exams')).toEqual({
      application: 'exam',
      page: 'paper-detail',
      recordId: '2',
      tab: 'exams',
    });
    expect(siderSelectedKey('paper-create')).toBe('exam-papers');
    expect(siderSelectedKey('paper-edit')).toBe('exam-papers');
    expect(siderSelectedKey('paper-detail')).toBe('exam-papers');
  });

  it('parses 试题库/试卷管理/证书管理 and 习题库 leaf hashes', () => {
    expect(parseLocationHash('#/exam/exam-questions')).toEqual({
      application: 'exam',
      page: 'exam-questions',
    });
    expect(parseLocationHash('#/exam/exam-papers')).toEqual({
      application: 'exam',
      page: 'exam-papers',
    });
    expect(parseLocationHash('#/exam/exam-certificates')).toEqual({
      application: 'exam',
      page: 'exam-certificates',
    });
    expect(parseLocationHash('#/exam/practice-questions')).toEqual({
      application: 'exam',
      page: 'practice-questions',
    });
  });

  it('parses a leaf hash', () => {
    expect(parseLocationHash('#/exam/exam-list')).toEqual({
      application: 'exam',
      page: 'exam-list',
    });
  });

  it('parses exam-create, exam-edit and exam-detail hashes', () => {
    expect(parseLocationHash('#/exam/exam-create')).toEqual({
      application: 'exam',
      page: 'exam-create',
    });
    expect(parseLocationHash('#/exam/exam-edit/3')).toEqual({
      application: 'exam',
      page: 'exam-edit',
      recordId: '3',
    });
    expect(parseLocationHash('#/exam/exam-detail/3')).toEqual({
      application: 'exam',
      page: 'exam-detail',
      recordId: '3',
    });
    expect(parseLocationHash('#/exam/exam-detail/5/records')).toEqual({
      application: 'exam',
      page: 'exam-detail',
      recordId: '5',
      tab: 'records',
    });
    expect(siderSelectedKey('exam-detail')).toBe('exam-list');
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
    expect(parseLocationHash('#/exam/exam-rules')).toEqual({
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

describe('interest-groups application', () => {
  it('registers the app under 员工与组织 after 员工体验', () => {
    expect(getApplication('interest-groups')).toEqual({
      key: 'interest-groups',
      label: '兴趣小组',
      category: '员工与组织',
      icon: 'team',
      defaultPage: 'interest-group-overview',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('interest-groups')).toBe(keys.indexOf('experience') + 1);
    expect(keys.indexOf('interest-groups')).toBe(keys.indexOf('awards') - 1);
  });

  it('uses four first-level menus in order', () => {
    expect(applicationMenus['interest-groups']).toEqual([
      { key: 'interest-group-overview', icon: 'dashboard', label: '概览' },
      { key: 'interest-group-list', icon: 'team', label: '小组管理' },
      { key: 'interest-group-activities', icon: 'calendar', label: '活动管理' },
      { key: 'interest-group-categories', icon: 'appstore', label: '分类管理' },
    ]);
  });

  it('parses leaf hashes and falls back to 概览', () => {
    expect(parseLocationHash('#/interest-groups/interest-group-list')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-list',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-activities')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-activities',
    });
    expect(parseLocationHash('#/interest-groups')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-overview',
    });
    expect(parseLocationHash('#/interest-groups/not-a-page')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-overview',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-detail/1/members')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-detail',
      recordId: '1',
      tab: 'members',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-activity-create/1')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-activity-create',
      recordId: '1',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-activity-edit/101')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-activity-edit',
      recordId: '101',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-activity-detail/101/signups')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-activity-detail',
      recordId: '101',
      tab: 'signups',
    });
    expect(siderSelectedKey('interest-group-activity-create')).toBe('interest-group-activities');
    expect(siderSelectedKey('interest-group-activity-edit')).toBe('interest-group-activities');
    expect(siderSelectedKey('interest-group-activity-detail')).toBe('interest-group-activities');
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('interest-groups');
  });
});

describe('awards application', () => {
  it('registers the app under 员工与组织 after 兴趣小组', () => {
    expect(getApplication('awards')).toEqual({
      key: 'awards',
      label: '评优',
      category: '员工与组织',
      icon: 'trophy',
      defaultPage: 'award-overview',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('interest-groups') + 1);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('training') - 1);
  });

  it('uses three first-level menus: 概览 / 评优管理 / 规则设置', () => {
    expect(applicationMenus.awards).toEqual([
      { key: 'award-overview', icon: 'dashboard', label: '概览' },
      { key: 'award-list', icon: 'trophy', label: '评优管理' },
      { key: 'award-rules', icon: 'fileText', label: '规则设置' },
    ]);
  });

  it('parses leaf hashes and falls back to 概览', () => {
    expect(parseLocationHash('#/awards/award-overview')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
    expect(parseLocationHash('#/awards/award-list')).toEqual({
      application: 'awards',
      page: 'award-list',
    });
    expect(parseLocationHash('#/awards/award-rules')).toEqual({
      application: 'awards',
      page: 'award-rules',
    });
    expect(parseLocationHash('#/awards')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
    expect(parseLocationHash('#/awards/not-a-page')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).not.toContain('awards');
  });
});

describe('experience application after interest-groups split', () => {
  it('drops 社群运营 / 兴趣小组 from experience menus', () => {
    const keys = applicationMenus.experience.flatMap((node) => [
      node.key,
      ...(node.children ?? []).map((child) => child.key),
    ]);
    expect(keys).not.toContain('experience-groups');
    expect(keys).not.toContain('experience-interest-groups');
  });

  it('falls back legacy interest-group hash to 文章管理', () => {
    expect(parseLocationHash('#/experience/experience-interest-groups')).toEqual({
      application: 'experience',
      page: 'experience-articles',
    });
  });
});
