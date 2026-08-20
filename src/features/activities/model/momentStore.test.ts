import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { restoreRelatedSignups } from './related';
import {
  addMomentReply,
  deleteMomentComment,
  getMoment,
  hasApprovedSignup,
  restoreMoments,
} from './momentStore';
import { loadDemoSignups, resetClientSignups, submitSignup } from '../../c-end/activities/model/signupStore';

describe('hasApprovedSignup', () => {
  beforeEach(() => {
    resetClientSignups();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
  });

  it('is true only for approved rows', () => {
    loadDemoSignups();
    expect(hasApprovedSignup(2)).toBe(true);
    expect(hasApprovedSignup(9)).toBe(true);
    expect(hasApprovedSignup(6)).toBe(false);
    expect(hasApprovedSignup(1)).toBe(true);
  });

  it('is false for a pending new signup', () => {
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(hasApprovedSignup(2)).toBe(false);
  });
});

describe('moment like and comment store', () => {
  afterEach(() => {
    restoreMoments();
  });

  it('keeps replyTo on a nested reply', () => {
    expect(addMomentReply(1, 11, '收到', '陈产品', '张悦')).toEqual({ ok: true });
    const last = getMoment(1)?.comments.find((item) => item.id === 11)?.replies.at(-1);
    expect(last?.author).toBe('陈产品');
    expect(last?.replyTo).toBe('张悦');
    expect(last?.content).toBe('收到');
  });

  it('deletes a comment thread', () => {
    expect(deleteMomentComment(1, 12)).toBe(true);
    expect(getMoment(1)?.comments.some((item) => item.id === 12)).toBe(false);
  });
});
