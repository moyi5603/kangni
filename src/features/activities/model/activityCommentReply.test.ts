import { afterEach, describe, expect, it } from 'vitest';
import {
  activityAdminSelf,
  activityCommentReplyAccountOptions,
  adminCommentOnInterestGroupMoment,
  adminCommentOnMoment,
  adminReplyActivityComment,
  adminReplyInterestGroupComment,
  adminReplyInterestGroupMomentComment,
  adminReplyMomentComment,
} from './activityCommentReply';
import { getMoment, restoreMoments } from './momentStore';
import { getRelatedList, restoreRelatedComments } from './related';
import {
  __resetInterestGroupStoreForTest,
  getInterestGroupComments,
  getInterestGroupMoments,
} from '../../interest-groups/model/interestGroupStore';

describe('admin activity comment reply', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('defaults reply account to self and lists vest accounts', () => {
    const options = activityCommentReplyAccountOptions();
    expect(options[0]).toEqual({ value: activityAdminSelf, label: '陈产品（个人账号）' });
    expect(activityAdminSelf).toBe('陈产品');
    expect(options.slice(1)).toEqual([
      { value: '活动小助手', label: '活动小助手' },
      { value: '官方客服', label: '官方客服' },
    ]);
  });

  it('writes a trimmed reply as self', () => {
    expect(adminReplyActivityComment(1, 1, '  已收到反馈  ', activityAdminSelf)).toBe('ok');
    expect(getRelatedList('comments')[0]).toMatchObject({
      activityId: 1,
      parentId: 1,
      content: '已收到反馈',
      author: '陈产品',
      likedBy: [],
    });
  });

  it('allows vest account replies', () => {
    expect(adminReplyActivityComment(1, 2, '官方说明', '活动小助手')).toBe('ok');
    expect(getRelatedList('comments')[0]).toMatchObject({
      parentId: 2,
      content: '官方说明',
      author: '活动小助手',
    });
  });

  it('rejects blank content, unknown account, and missing parent', () => {
    const before = getRelatedList('comments').length;
    expect(adminReplyActivityComment(1, 1, '   ', activityAdminSelf)).toBe('empty');
    expect(adminReplyActivityComment(1, 1, '内容', '路人甲')).toBe('bad-account');
    expect(adminReplyActivityComment(1, 999, '内容', activityAdminSelf)).toBe('missing');
    expect(adminReplyActivityComment(2, 1, '内容', activityAdminSelf)).toBe('missing');
    expect(getRelatedList('comments')).toHaveLength(before);
  });
});

describe('admin moment comment reply', () => {
  afterEach(() => {
    restoreMoments();
  });

  it('comments on a moment as self or vest', () => {
    expect(adminCommentOnMoment(1, '  官方已阅  ', activityAdminSelf)).toBe('ok');
    expect(getMoment(1)?.comments.at(-1)).toMatchObject({
      author: '陈产品',
      content: '官方已阅',
    });
    expect(adminCommentOnMoment(1, '助手回复', '活动小助手')).toBe('ok');
    expect(getMoment(1)?.comments.at(-1)).toMatchObject({
      author: '活动小助手',
      content: '助手回复',
    });
  });

  it('replies to a moment comment with replyTo', () => {
    expect(adminReplyMomentComment(1, 11, '分流方案已排', '官方客服', '李明')).toBe('ok');
    expect(getMoment(1)?.comments.find((item) => item.id === 11)?.replies.at(-1)).toMatchObject({
      author: '官方客服',
      content: '分流方案已排',
      replyTo: '李明',
    });
  });

  it('rejects blank, unknown account, and missing comment', () => {
    const comments = getMoment(1)?.comments.length ?? 0;
    expect(adminCommentOnMoment(1, '  ', activityAdminSelf)).toBe('empty');
    expect(adminCommentOnMoment(1, '内容', '路人甲')).toBe('bad-account');
    expect(adminReplyMomentComment(1, 11, '   ', activityAdminSelf)).toBe('empty');
    expect(adminReplyMomentComment(1, 999, '内容', activityAdminSelf)).toBe('missing');
    expect(adminReplyMomentComment(99, 11, '内容', activityAdminSelf)).toBe('missing');
    expect(getMoment(1)?.comments).toHaveLength(comments);
  });
});

describe('admin interest-group comment and moment reply', () => {
  afterEach(() => {
    __resetInterestGroupStoreForTest();
  });

  it('replies to an activity comment as vest', () => {
    expect(adminReplyInterestGroupComment(1, '  周四已排  ', '活动小助手')).toBe('ok');
    expect(getInterestGroupComments()[0]).toMatchObject({
      activityId: 101,
      parentId: 1,
      content: '周四已排',
      author: '活动小助手',
    });
  });

  it('comments on a moment and replies to a moment comment', () => {
    expect(adminCommentOnInterestGroupMoment(1, '官方点赞', activityAdminSelf)).toBe('ok');
    expect(getInterestGroupMoments().find((item) => item.id === 1)?.comments.at(-1)).toMatchObject({
      author: '陈产品',
      content: '官方点赞',
    });
    expect(adminReplyInterestGroupMomentComment(1, 11, '光线确实好', '官方客服', '周棠')).toBe('ok');
    expect(
      getInterestGroupMoments()
        .find((item) => item.id === 1)
        ?.comments.find((item) => item.id === 11)
        ?.replies.at(-1),
    ).toMatchObject({
      author: '官方客服',
      content: '光线确实好',
      replyTo: '周棠',
    });
  });

  it('rejects blank, unknown account, and missing parent', () => {
    const before = getInterestGroupComments().length;
    expect(adminReplyInterestGroupComment(1, '  ', activityAdminSelf)).toBe('empty');
    expect(adminReplyInterestGroupComment(1, 'x', '路人甲')).toBe('bad-account');
    expect(adminReplyInterestGroupComment(999, 'x', activityAdminSelf)).toBe('missing');
    expect(getInterestGroupComments()).toHaveLength(before);
  });
});
