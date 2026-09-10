import { describe, expect, it } from 'vitest';
import {
  applicationMenus,
  applications,
  getApplication,
  getDirectApplications,
  visibleApplications,
  parseCEndHash,
  parseLocationHash,
  siderSelectedKey,
  toLocationHash,
  toCEndPortalHash,
  toH5CourseListHash,
  toH5ExamListHash,
  toH5VoteListHash,
  toH5VoteV2ListHash,
  toH5VoteV2RecordsHash,
  toH5VoteV2HomeHash,
  toH5VoteV2OptionHash,
  toPcVoteV2ListHash,
  toPcVoteV2RecordsHash,
  toPcVoteV2HomeHash,
  toPcVoteV2OptionHash,
  toH5VoteRecordsHash,
  toH5VoteRecordHash,
  toH5VoteDetailHash,
  toH5VoteTakingHash,
  toH5VoteResultsHash,
  toPcVoteListHash,
  toPcVoteRecordsHash,
  toPcVoteDetailHash,
  toPcVoteTakingHash,
  toPcVoteResultsHash,
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
  toH5ActivityListHash,
  toH5ActivitySearchHash,
  toH5PastMomentsHash,
  toPcActivityListHash,
  toPcActivitySearchHash,
  toPcPastMomentsHash,
  toH5HonorHash,
  toH5HonorAdminHash,
  toH5InterestGroupsHash,
  toPcInterestGroupsHash,
  toH5IgPastMomentsHash,
  toPcIgPastMomentsHash,
  toPcFavoritesHash,
  toPcMySignupsHash,
  toCEndSignupHash,
} from './navigation';

describe('workbench application menus', () => {
  it('exposes H5装修 and PC装修 as first-level items', () => {
    expect(applicationMenus.workbench).toEqual([
      {
        key: 'workbench-overview',
        icon: 'dashboard',
        label: '概览',
        children: [
          { key: 'dashboard', icon: 'dashboard', label: '数据看板' },
          { key: 'my-tasks', icon: 'checkSquare', label: '我的待办' },
        ],
      },
      { key: 'h5-decoration', icon: 'layout', label: 'H5装修' },
      { key: 'pc-decoration', icon: 'appstore', label: 'PC装修' },
    ]);
    expect(parseLocationHash('#/workbench/h5-decoration')).toEqual({
      application: 'workbench',
      page: 'h5-decoration',
    });
    expect(parseLocationHash('#/workbench/pc-decoration')).toEqual({
      application: 'workbench',
      page: 'pc-decoration',
    });
  });
});

describe('applications', () => {
  it('shows 课程 instead of 培训课程', () => {
    const training = applications.find((item) => item.key === 'training');
    expect(training?.label).toBe('课程');
    expect(applications.some((item) => item.label === '培训课程')).toBe(false);
  });

  it('hides 评优, 人文关怀, 员工体验 and 员工体检 from 全部应用, and shows 投票 as v2', () => {
    const labels = visibleApplications().map((item) => item.label);
    expect(labels).not.toContain('评优');
    expect(labels).not.toContain('投票-废弃');
    expect(labels).not.toContain('投票版本2');
    expect(labels).not.toContain('人文关怀');
    expect(labels).not.toContain('员工体验');
    expect(labels).not.toContain('员工体检');
    expect(labels).toContain('投票');
    expect(labels).toContain('活动');
    expect(labels).toContain('课程');
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

  it('parses the activity search secondary page before numeric ids', () => {
    expect(parseCEndHash('#/c/h5/search')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'activity-search',
    });
    expect(parseCEndHash('#/c/pc/search')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'activity-search',
    });
    expect(toH5ActivitySearchHash()).toBe('#/c/h5/search');
    expect(toPcActivitySearchHash()).toBe('#/c/pc/search');
  });

  it('parses the activity list secondary page before numeric ids', () => {
    expect(parseCEndHash('#/c/h5/list')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'activity-list',
    });
    expect(parseCEndHash('#/c/pc/list')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'activity-list',
    });
    expect(toH5ActivityListHash()).toBe('#/c/h5/list');
    expect(toPcActivityListHash()).toBe('#/c/pc/list');
  });

  it('parses the past-moments secondary page before numeric ids', () => {
    expect(parseCEndHash('#/c/h5/moments')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'past-moments',
    });
    expect(parseCEndHash('#/c/pc/moments')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'past-moments',
    });
    expect(toH5PastMomentsHash()).toBe('#/c/h5/moments');
    expect(toPcPastMomentsHash()).toBe('#/c/pc/moments');
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

  it('parses and builds the H5 vote list hash', () => {
    expect(parseCEndHash('#/c/h5/votes')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'votes',
    });
    expect(toH5VoteListHash()).toBe('#/c/h5/votes');
    expect(parseCEndHash('#/c/h5/votes-v2')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'votes-v2',
    });
    expect(toH5VoteV2ListHash()).toBe('#/c/h5/votes-v2');
    expect(parseCEndHash('#/c/h5/votes-v2/mine')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-v2-records',
    });
    expect(toH5VoteV2RecordsHash()).toBe('#/c/h5/votes-v2/mine');
    expect(parseCEndHash('#/c/h5/vote-v2-2')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-v2-home',
      voteV2Id: 2,
    });
    expect(toH5VoteV2HomeHash(2)).toBe('#/c/h5/vote-v2-2');
    expect(parseCEndHash('#/c/h5/vote-v2-2/option-1')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-v2-option',
      voteV2Id: 2,
      voteV2OptionId: 1,
    });
    expect(toH5VoteV2OptionHash(2, 1)).toBe('#/c/h5/vote-v2-2/option-1');
    expect(parseCEndHash('#/c/pc/votes-v2')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'votes-v2',
    });
    expect(toPcVoteV2ListHash()).toBe('#/c/pc/votes-v2');
    expect(parseCEndHash('#/c/pc/votes-v2/mine')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-v2-records',
    });
    expect(toPcVoteV2RecordsHash()).toBe('#/c/pc/votes-v2/mine');
    expect(parseCEndHash('#/c/pc/vote-v2-2')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-v2-home',
      voteV2Id: 2,
    });
    expect(toPcVoteV2HomeHash(2)).toBe('#/c/pc/vote-v2-2');
    expect(parseCEndHash('#/c/pc/vote-v2-2/option-1')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-v2-option',
      voteV2Id: 2,
      voteV2OptionId: 1,
    });
    expect(toPcVoteV2OptionHash(2, 1)).toBe('#/c/pc/vote-v2-2/option-1');
    expect(parseCEndHash('#/c/h5/votes/mine')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-records',
    });
    expect(toH5VoteRecordsHash()).toBe('#/c/h5/votes/mine');
    expect(parseCEndHash('#/c/h5/votes/mine/1')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-record',
      voteResponseId: 1,
    });
    expect(toH5VoteRecordHash(1)).toBe('#/c/h5/votes/mine/1');
    expect(parseCEndHash('#/c/h5/votes/mine/nope')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-record',
    });
    expect(parseCEndHash('#/c/h5/vote-2')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-detail',
      voteId: 2,
    });
    expect(toH5VoteDetailHash(2)).toBe('#/c/h5/vote-2');
    expect(parseCEndHash('#/c/h5/vote-2/take')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-taking',
      voteId: 2,
    });
    expect(toH5VoteTakingHash(2)).toBe('#/c/h5/vote-2/take');
    expect(parseCEndHash('#/c/h5/vote-2/results')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'vote-results',
      voteId: 2,
    });
    expect(toH5VoteResultsHash(2)).toBe('#/c/h5/vote-2/results');
  });

  it('parses and builds the PC vote hashes', () => {
    expect(parseCEndHash('#/c/pc/votes')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'votes',
    });
    expect(toPcVoteListHash()).toBe('#/c/pc/votes');
    expect(parseCEndHash('#/c/pc/votes/mine')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-records',
    });
    expect(toPcVoteRecordsHash()).toBe('#/c/pc/votes/mine');
    expect(parseCEndHash('#/c/pc/vote-2')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-detail',
      voteId: 2,
    });
    expect(toPcVoteDetailHash(2)).toBe('#/c/pc/vote-2');
    expect(parseCEndHash('#/c/pc/vote-2/take')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-taking',
      voteId: 2,
    });
    expect(toPcVoteTakingHash(2)).toBe('#/c/pc/vote-2/take');
    expect(parseCEndHash('#/c/pc/vote-2/results')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'vote-results',
      voteId: 2,
    });
    expect(toPcVoteResultsHash(2)).toBe('#/c/pc/vote-2/results');
  });

  it('parses the H5 interest groups home', () => {
    expect(parseCEndHash('#/c/h5/interest-groups')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'interest-groups',
    });
  });

  it('parses the PC interest groups home', () => {
    expect(parseCEndHash('#/c/pc/interest-groups')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'interest-groups',
    });
  });

  it('builds the H5 interest groups hash', () => {
    expect(toH5InterestGroupsHash()).toBe('#/c/h5/interest-groups');
  });

  it('builds the PC interest groups hash', () => {
    expect(toPcInterestGroupsHash()).toBe('#/c/pc/interest-groups');
  });

  it('parses interest-groups past-moments without colliding with 员工活动 moments', () => {
    expect(parseCEndHash('#/c/pc/interest-groups/moments')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'ig-past-moments',
    });
    expect(parseCEndHash('#/c/h5/interest-groups/moments')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'ig-past-moments',
    });
    expect(parseCEndHash('#/c/pc/moments')).toEqual({
      kind: 'c-end',
      surface: 'pc',
      h5Page: 'past-moments',
    });
    expect(toPcIgPastMomentsHash()).toBe('#/c/pc/interest-groups/moments');
    expect(toH5IgPastMomentsHash()).toBe('#/c/h5/interest-groups/moments');
  });

  it('parses the H5 honor page', () => {
    expect(parseCEndHash('#/c/h5/honor')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'honor',
    });
  });

  it('builds the H5 honor hash', () => {
    expect(toH5HonorHash()).toBe('#/c/h5/honor');
  });

  it('parses the H5 honor admin page', () => {
    expect(parseCEndHash('#/c/h5/honor-admin')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      h5Page: 'honor-admin',
    });
    expect(toH5HonorAdminHash()).toBe('#/c/h5/honor-admin');
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

  it('parses activity check-in page and strips query', () => {
    expect(parseCEndHash('#/c/h5/26/checkin?s=s-a&t=tok')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 26,
      h5Page: 'checkin',
    });
  });

  it('parses interest-group activity check-in page', () => {
    expect(parseCEndHash('#/c/h5/ig-act-101/checkin?s=101-s1&t=tok')).toEqual({
      kind: 'c-end',
      surface: 'h5',
      activityId: 101,
      h5Page: 'ig-checkin',
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

  it('uses four first-level menus with no children, including 打卡', () => {
    expect(applicationMenus['skills-contest']).toEqual([
      { key: 'contest-list', icon: 'trophy', label: '赛事管理' },
      { key: 'signup-list', icon: 'unorderedList', label: '报名' },
      { key: 'score-list', icon: 'checkCircle', label: '成绩' },
      { key: 'contest-checkin', icon: 'clock', label: '打卡' },
    ]);
  });

  it('parses a leaf hash', () => {
    expect(parseLocationHash('#/skills-contest/signup-list')).toEqual({
      application: 'skills-contest',
      page: 'signup-list',
    });
    expect(parseLocationHash('#/skills-contest/contest-checkin')).toEqual({
      application: 'skills-contest',
      page: 'contest-checkin',
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

describe('activities application menus', () => {
  it('includes 规则设置（仅演示）', () => {
    expect(applicationMenus.activities).toEqual([
      { key: 'activity-overview', icon: 'dashboard', label: '概览' },
      { key: 'activity-list', icon: 'unorderedList', label: '活动管理' },
      { key: 'activity-categories', icon: 'appstore', label: '分类管理' },
      { key: 'activity-rules', icon: 'fileText', label: '规则设置（仅演示）' },
      { key: 'activity-layout', icon: 'layout', label: '活动装修（仅演示）' },
    ]);
    expect(parseLocationHash('#/activities/activity-rules')).toEqual({
      application: 'activities',
      page: 'activity-rules',
    });
    expect(parseLocationHash('#/activities/activity-layout')).toEqual({
      application: 'activities',
      page: 'activity-layout',
    });
    expect(parseLocationHash('#/activities/activity-layout-mobile')).toEqual({
      application: 'activities',
      page: 'activity-layout-mobile',
    });
    expect(parseLocationHash('#/activities/activity-layout-pc')).toEqual({
      application: 'activities',
      page: 'activity-layout-pc',
    });
    expect(siderSelectedKey('activity-layout-pc')).toBe('activity-layout');
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

  it('sits immediately before 直播', () => {
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('exam')).toBe(keys.indexOf('live') - 1);
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
      label: '兴趣圈',
      category: '员工与组织',
      icon: 'team',
      defaultPage: 'interest-group-overview',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('interest-groups')).toBe(keys.indexOf('experience') + 1);
    expect(keys.indexOf('interest-groups')).toBe(keys.indexOf('awards') - 1);
  });

  it('uses first-level menus plus 装修', () => {
    expect(applicationMenus['interest-groups']).toEqual([
      { key: 'interest-group-overview', icon: 'dashboard', label: '概览' },
      { key: 'interest-group-list', icon: 'team', label: '兴趣圈管理' },
      { key: 'interest-group-activities', icon: 'calendar', label: '活动管理' },
      { key: 'interest-group-categories', icon: 'appstore', label: '分类管理' },
      { key: 'interest-group-rules', icon: 'fileText', label: '规则设置' },
      { key: 'interest-group-layout', icon: 'layout', label: '兴趣圈装修（仅演示）' },
    ]);
    expect(parseLocationHash('#/interest-groups/interest-group-rules')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-rules',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-layout')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-layout',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-layout-mobile')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-layout-mobile',
    });
    expect(parseLocationHash('#/interest-groups/interest-group-layout-pc')).toEqual({
      application: 'interest-groups',
      page: 'interest-group-layout-pc',
    });
    expect(siderSelectedKey('interest-group-layout-mobile')).toBe('interest-group-layout');
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
  it('registers the app under 员工与组织 after 兴趣圈', () => {
    expect(getApplication('awards')).toEqual({
      key: 'awards',
      label: '评优',
      category: '员工与组织',
      icon: 'trophy',
      defaultPage: 'award-overview',
      hiddenFromSwitcher: true,
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('interest-groups') + 1);
    expect(keys.indexOf('awards')).toBe(keys.indexOf('voting') - 1);
  });

  it('uses three first-level menus including 评优证书', () => {
    expect(applicationMenus.awards).toEqual([
      { key: 'award-overview', icon: 'dashboard', label: '概览' },
      { key: 'award-list', icon: 'trophy', label: '评优管理' },
      { key: 'award-certificates', icon: 'gift', label: '评优证书' },
    ]);
    expect(applicationMenus.awards.some((item) => item.key === 'award-rules')).toBe(false);
  });

  it('parses leaf hashes, hidden form pages, and falls back to 概览', () => {
    expect(parseLocationHash('#/awards/award-overview')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
    expect(parseLocationHash('#/awards/award-list')).toEqual({
      application: 'awards',
      page: 'award-list',
    });
    expect(parseLocationHash('#/awards/award-certificates')).toEqual({
      application: 'awards',
      page: 'award-certificates',
    });
    expect(parseLocationHash('#/awards/award-rules')).toEqual({
      application: 'awards',
      page: 'award-overview',
    });
    expect(parseLocationHash('#/awards/award-create')).toEqual({
      application: 'awards',
      page: 'award-create',
    });
    expect(parseLocationHash('#/awards/award-edit/2')).toEqual({
      application: 'awards',
      page: 'award-edit',
      recordId: '2',
    });
    expect(parseLocationHash('#/awards/award-detail/2')).toEqual({
      application: 'awards',
      page: 'award-detail',
      recordId: '2',
    });
    expect(siderSelectedKey('award-create')).toBe('award-list');
    expect(siderSelectedKey('award-edit')).toBe('award-list');
    expect(siderSelectedKey('award-detail')).toBe('award-list');
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

describe('voting application', () => {
  it('registers the app under 员工与组织 after 评优', () => {
    expect(getApplication('voting')).toEqual({
      key: 'voting',
      label: '投票-废弃',
      category: '员工与组织',
      icon: 'checkSquare',
      defaultPage: 'vote-list',
      hiddenFromSwitcher: true,
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('voting')).toBe(keys.indexOf('awards') + 1);
    expect(keys.indexOf('voting')).toBe(keys.indexOf('voting-v2') - 1);
  });

  it('uses a single first-level menu for 投票管理', () => {
    expect(applicationMenus.voting).toEqual([
      { key: 'vote-list', icon: 'checkSquare', label: '投票管理' },
    ]);
  });

  it('parses leaf hashes, hidden form pages, and falls back to 投票管理', () => {
    expect(parseLocationHash('#/voting/vote-overview')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
    expect(parseLocationHash('#/voting/vote-list')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
    expect(parseLocationHash('#/voting/vote-rules')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
    expect(parseLocationHash('#/voting/vote-create')).toEqual({
      application: 'voting',
      page: 'vote-create',
    });
    expect(parseLocationHash('#/voting/vote-edit/2')).toEqual({
      application: 'voting',
      page: 'vote-edit',
      recordId: '2',
    });
    expect(parseLocationHash('#/voting/vote-detail/2')).toEqual({
      application: 'voting',
      page: 'vote-detail',
      recordId: '2',
    });
    expect(parseLocationHash('#/voting/vote-detail/2/results')).toEqual({
      application: 'voting',
      page: 'vote-detail',
      recordId: '2',
      tab: 'results',
    });
    expect(parseLocationHash('#/voting/vote-detail/2/records')).toEqual({
      application: 'voting',
      page: 'vote-detail',
      recordId: '2',
      tab: 'records',
    });
    expect(parseLocationHash('#/voting/vote-detail/2/comments')).toEqual({
      application: 'voting',
      page: 'vote-detail',
      recordId: '2',
      tab: 'comments',
    });
    expect(siderSelectedKey('vote-create')).toBe('vote-list');
    expect(siderSelectedKey('vote-edit')).toBe('vote-list');
    expect(siderSelectedKey('vote-detail')).toBe('vote-list');
    expect(parseLocationHash('#/voting')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
    expect(parseLocationHash('#/voting/not-a-page')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).toEqual(['workbench', 'organization', 'products', 'orders']);
    expect(keys).not.toContain('voting');
  });
});

describe('voting-v2 application', () => {
  it('registers the app under 员工与组织 after 投票', () => {
    expect(getApplication('voting-v2')).toEqual({
      key: 'voting-v2',
      label: '投票',
      category: '员工与组织',
      icon: 'checkSquare',
      defaultPage: 'vote-v2-overview',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('voting-v2')).toBe(keys.indexOf('voting') + 1);
    expect(keys.indexOf('voting-v2')).toBe(keys.indexOf('training') - 1);
  });

  it('uses 概览, 投票管理 plus 投票装修', () => {
    expect(applicationMenus['voting-v2']).toEqual([
      { key: 'vote-v2-overview', icon: 'dashboard', label: '概览' },
      { key: 'vote-v2-list', icon: 'checkSquare', label: '投票管理' },
      { key: 'vote-v2-layout', icon: 'layout', label: '投票装修（仅演示）' },
    ]);
    expect(parseLocationHash('#/voting-v2/vote-v2-layout')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-layout',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-layout-mobile')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-layout-mobile',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-layout-pc')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-layout-pc',
    });
    expect(siderSelectedKey('vote-v2-layout-pc')).toBe('vote-v2-layout');
  });

  it('parses the list hash and falls back without colliding with 投票', () => {
    expect(parseLocationHash('#/voting-v2/vote-v2-list')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-list',
    });
    expect(parseLocationHash('#/voting-v2')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-overview',
    });
    expect(parseLocationHash('#/voting-v2/not-a-page')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-overview',
    });
    expect(parseLocationHash('#/voting-v2/vote-list')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-overview',
    });
    expect(parseLocationHash('#/voting/vote-list')).toEqual({
      application: 'voting',
      page: 'vote-list',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-create')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-create',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-edit/2')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-edit',
      recordId: '2',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-detail/2')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-detail',
      recordId: '2',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-detail/2/results')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-detail',
      recordId: '2',
      tab: 'results',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-detail/2/records')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-detail',
      recordId: '2',
      tab: 'records',
    });
    expect(parseLocationHash('#/voting-v2/vote-v2-players/2')).toEqual({
      application: 'voting-v2',
      page: 'vote-v2-players',
      recordId: '2',
    });
    expect(siderSelectedKey('vote-v2-create')).toBe('vote-v2-list');
    expect(siderSelectedKey('vote-v2-edit')).toBe('vote-v2-list');
    expect(siderSelectedKey('vote-v2-detail')).toBe('vote-v2-list');
    expect(siderSelectedKey('vote-v2-players')).toBe('vote-v2-list');
  });

  it('stays out of the top-bar direct applications', () => {
    const keys = getDirectApplications(4).map((item) => item.key);
    expect(keys).not.toContain('voting-v2');
  });
});

describe('live application', () => {
  it('registers 直播 under 员工与组织 with live-list as default', () => {
    expect(getApplication('live')).toEqual({
      key: 'live',
      label: '直播',
      category: '员工与组织',
      icon: 'video',
      defaultPage: 'live-list',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('live')).toBe(keys.indexOf('exam') + 1);
    expect(keys.indexOf('live')).toBe(keys.indexOf('lottery') - 1);
  });

  it('uses a single first-level menu for 直播管理', () => {
    expect(applicationMenus.live).toEqual([{ key: 'live-list', icon: 'video', label: '直播管理' }]);
  });

  it('parses leaf hash and falls back to 直播管理', () => {
    expect(parseLocationHash('#/live/live-list')).toEqual({ application: 'live', page: 'live-list' });
    expect(parseLocationHash('#/live')).toEqual({ application: 'live', page: 'live-list' });
    expect(parseLocationHash('#/live/not-a-page')).toEqual({ application: 'live', page: 'live-list' });
  });

  it('parses create, edit and detail hashes and keeps 直播管理 selected', () => {
    expect(parseLocationHash('#/live/live-create')).toEqual({ application: 'live', page: 'live-create' });
    expect(parseLocationHash('#/live/live-edit/2')).toEqual({ application: 'live', page: 'live-edit', recordId: '2' });
    expect(parseLocationHash('#/live/live-detail/2')).toEqual({ application: 'live', page: 'live-detail', recordId: '2' });
    expect(siderSelectedKey('live-create')).toBe('live-list');
    expect(siderSelectedKey('live-edit')).toBe('live-list');
    expect(siderSelectedKey('live-detail')).toBe('live-list');
  });

  it('shows 直播 in 全部应用 switcher but not in top-bar direct apps', () => {
    expect(visibleApplications().map((item) => item.label)).toContain('直播');
    expect(getDirectApplications(4).map((item) => item.key)).not.toContain('live');
  });
});

describe('lottery application', () => {
  it('registers 抽奖 under 员工与组织 with lottery-list as default', () => {
    expect(getApplication('lottery')).toEqual({
      key: 'lottery',
      label: '抽奖',
      category: '员工与组织',
      icon: 'gift',
      defaultPage: 'lottery-list',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('lottery')).toBe(keys.indexOf('live') + 1);
    expect(keys.indexOf('lottery')).toBe(keys.indexOf('checkin') - 1);
  });

  it('uses a single first-level menu for 抽奖管理', () => {
    expect(applicationMenus.lottery).toEqual([{ key: 'lottery-list', icon: 'gift', label: '抽奖管理' }]);
  });

  it('parses leaf hash and falls back to 抽奖管理', () => {
    expect(parseLocationHash('#/lottery/lottery-list')).toEqual({ application: 'lottery', page: 'lottery-list' });
    expect(parseLocationHash('#/lottery')).toEqual({ application: 'lottery', page: 'lottery-list' });
    expect(parseLocationHash('#/lottery/not-a-page')).toEqual({ application: 'lottery', page: 'lottery-list' });
  });

  it('parses create, edit and detail hashes and keeps 抽奖管理 selected', () => {
    expect(parseLocationHash('#/lottery/lottery-create')).toEqual({ application: 'lottery', page: 'lottery-create' });
    expect(parseLocationHash('#/lottery/lottery-edit/2')).toEqual({ application: 'lottery', page: 'lottery-edit', recordId: '2' });
    expect(parseLocationHash('#/lottery/lottery-detail/2')).toEqual({ application: 'lottery', page: 'lottery-detail', recordId: '2' });
    expect(siderSelectedKey('lottery-create')).toBe('lottery-list');
    expect(siderSelectedKey('lottery-edit')).toBe('lottery-list');
    expect(siderSelectedKey('lottery-detail')).toBe('lottery-list');
  });

  it('shows 抽奖 in 全部应用 switcher but not in top-bar direct apps', () => {
    expect(visibleApplications().map((item) => item.label)).toContain('抽奖');
    expect(getDirectApplications(4).map((item) => item.key)).not.toContain('lottery');
  });
});

describe('checkin application', () => {
  it('registers 打卡 under 员工与组织 with checkin-list as default', () => {
    expect(getApplication('checkin')).toEqual({
      key: 'checkin',
      label: '打卡',
      category: '员工与组织',
      icon: 'clock',
      defaultPage: 'checkin-list',
    });
    const keys = applications.map((item) => item.key);
    expect(keys.indexOf('checkin')).toBe(keys.indexOf('lottery') + 1);
    expect(keys.indexOf('checkin')).toBe(keys.indexOf('learning-plan') - 1);
  });

  it('uses a single first-level menu for 打卡管理', () => {
    expect(applicationMenus.checkin).toEqual([{ key: 'checkin-list', icon: 'clock', label: '打卡管理' }]);
  });

  it('parses leaf hash and falls back to 打卡管理', () => {
    expect(parseLocationHash('#/checkin/checkin-list')).toEqual({ application: 'checkin', page: 'checkin-list' });
    expect(parseLocationHash('#/checkin')).toEqual({ application: 'checkin', page: 'checkin-list' });
    expect(parseLocationHash('#/checkin/not-a-page')).toEqual({ application: 'checkin', page: 'checkin-list' });
  });

  it('parses create, edit and detail hashes and keeps 打卡管理 selected', () => {
    expect(parseLocationHash('#/checkin/checkin-create')).toEqual({ application: 'checkin', page: 'checkin-create' });
    expect(parseLocationHash('#/checkin/checkin-edit/2')).toEqual({ application: 'checkin', page: 'checkin-edit', recordId: '2' });
    expect(parseLocationHash('#/checkin/checkin-detail/2')).toEqual({ application: 'checkin', page: 'checkin-detail', recordId: '2' });
    expect(siderSelectedKey('checkin-create')).toBe('checkin-list');
    expect(siderSelectedKey('checkin-edit')).toBe('checkin-list');
    expect(siderSelectedKey('checkin-detail')).toBe('checkin-list');
  });

  it('reads owner app query from checkin list hash', () => {
    expect(parseLocationHash('#/checkin/checkin-list?app=skills-contest')).toEqual({
      application: 'checkin',
      page: 'checkin-list',
      ownerApp: 'skills-contest',
    });
    expect(parseLocationHash('#/checkin/checkin-list?app=culture')).toEqual({
      application: 'checkin',
      page: 'checkin-list',
      ownerApp: 'culture',
    });
  });

  it('writes owner app query on checkin-list hash', () => {
    expect(toLocationHash('checkin', 'checkin-list', undefined, undefined, 'skills-contest')).toBe(
      '#/checkin/checkin-list?app=skills-contest',
    );
    expect(toLocationHash('checkin', 'checkin-list', undefined, undefined, 'culture')).toBe(
      '#/checkin/checkin-list?app=culture',
    );
    expect(toLocationHash('checkin', 'checkin-list')).toBe('#/checkin/checkin-list');
    expect(toLocationHash('checkin', 'checkin-detail', '2', undefined, 'skills-contest')).toBe(
      '#/checkin/checkin-detail/2',
    );
  });

  it('shows 打卡 in 全部应用 switcher but not in top-bar direct apps', () => {
    expect(visibleApplications().map((item) => item.label)).toContain('打卡');
    expect(getDirectApplications(4).map((item) => item.key)).not.toContain('checkin');
  });
});

describe('learning-plan application', () => {
  it('registers 学习计划 under 员工与组织 with learning-plan-list as default', () => {
    expect(applications.find((item) => item.key === 'learning-plan')).toEqual({
      key: 'learning-plan',
      label: '学习计划',
      category: '员工与组织',
      icon: 'read',
      defaultPage: 'learning-plan-list',
    });
    expect(applicationMenus['learning-plan']).toEqual([
      { key: 'learning-plan-list', icon: 'unorderedList', label: '计划管理' },
    ]);
    expect(parseLocationHash('#/learning-plan/learning-plan-list')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-list',
    });
    expect(parseLocationHash('#/learning-plan')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-list',
    });
    expect(parseLocationHash('#/learning-plan/learning-plan-create')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-create',
    });
    expect(parseLocationHash('#/learning-plan/learning-plan-edit/1')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-edit',
      recordId: '1',
    });
    expect(parseLocationHash('#/learning-plan/learning-plan-preview/1')).toEqual({
      application: 'learning-plan',
      page: 'learning-plan-preview',
      recordId: '1',
    });
    expect(siderSelectedKey('learning-plan-create')).toBe('learning-plan-list');
    expect(siderSelectedKey('learning-plan-edit')).toBe('learning-plan-list');
    expect(siderSelectedKey('learning-plan-preview')).toBe('learning-plan-list');
  });
});

describe('experience application after interest-groups split', () => {
  it('drops 社群运营 / 兴趣圈 from experience menus', () => {
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
