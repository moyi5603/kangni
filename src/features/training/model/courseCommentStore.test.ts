import { afterEach, describe, expect, it } from 'vitest';
import { defaultCourseCommentConfig } from './training';
import { updateCourseCommentConfig } from './trainingStore';
import {
  approveCourseComment,
  approveCourseComments,
  deleteCourseComment,
  deleteCourseComments,
  listApprovedComments,
  listComments,
  listVisibleComments,
  rejectCourseComment,
  rejectCourseComments,
  resetCourseComments,
  submitCourseComment,
} from './courseCommentStore';

describe('course comment store', () => {
  afterEach(() => {
    resetCourseComments();
    updateCourseCommentConfig(1, defaultCourseCommentConfig());
  });

  it('seeds approved, pending and rejected comments on course 1', () => {
    expect(listComments(1)).toHaveLength(3);
    expect(listApprovedComments(1)).toHaveLength(1);
    expect(listVisibleComments(1, '陈产品').map((item) => item.status)).toEqual(['已驳回', '已通过']);
    expect(listVisibleComments(1, '路人甲').map((item) => item.author)).toEqual(['钟。']);
  });

  it('submits approved comments when audit is off', () => {
    expect(submitCourseComment(1, '  新评论  ')).toBe('ok');
    expect(listComments(1)[0]).toMatchObject({ author: '陈产品', text: '新评论', status: '已通过' });
  });

  it('submits pending comments when audit is on and keeps them self-only', () => {
    updateCourseCommentConfig(1, { ...defaultCourseCommentConfig(), commentAuditEnabled: true });
    expect(submitCourseComment(1, '待审核评论')).toBe('ok');
    expect(listComments(1)[0].status).toBe('待审核');
    expect(listApprovedComments(1)).toHaveLength(1);
    expect(listVisibleComments(1, '陈产品')[0]).toMatchObject({ text: '待审核评论', status: '待审核' });
    expect(listVisibleComments(1, '路人甲').some((item) => item.text === '待审核评论')).toBe(false);
  });

  it('ignores submit when comments are disabled', () => {
    updateCourseCommentConfig(1, { ...defaultCourseCommentConfig(), commentEnabled: false });
    expect(submitCourseComment(1, '不会写入')).toBe('disabled');
    expect(listComments(1)).toHaveLength(3);
  });

  it('deletes a comment by id', () => {
    const id = listComments(1)[0].id;
    expect(deleteCourseComment(id)).toBe(true);
    expect(listComments(1)).toHaveLength(2);
  });

  it('batch deletes comments', () => {
    const ids = listComments(1).map((item) => item.id);
    expect(deleteCourseComments(ids)).toBe(3);
    expect(listComments(1)).toHaveLength(0);
  });

  it('approves pending and rejected comments', () => {
    const pending = listComments(1).find((item) => item.status === '待审核')!;
    const rejected = listComments(1).find((item) => item.status === '已驳回')!;
    expect(approveCourseComment(pending.id)).toBe(true);
    expect(approveCourseComment(rejected.id)).toBe(true);
    expect(listApprovedComments(1)).toHaveLength(3);
  });

  it('rejects pending comments', () => {
    const pending = listComments(1).find((item) => item.status === '待审核')!;
    expect(rejectCourseComment(pending.id)).toBe(true);
    expect(listComments(1).find((item) => item.id === pending.id)?.status).toBe('已驳回');
    expect(listVisibleComments(1, '李明').some((item) => item.id === pending.id)).toBe(true);
    expect(listVisibleComments(1, '陈产品').some((item) => item.id === pending.id)).toBe(false);
  });

  it('batch approves and rejects', () => {
    const ids = listComments(1).map((item) => item.id);
    expect(rejectCourseComments(ids)).toBe(1);
    expect(approveCourseComments(ids)).toBe(2);
    expect(listApprovedComments(1)).toHaveLength(3);
  });
});
