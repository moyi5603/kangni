import { describe, expect, it } from 'vitest';
import { forumClientSelf, initialTopics, isTopicPinned } from '../../../forum/model/forum';
import { boardCommentCount, capForumComposeImages, clientNeedsReply, formatForumListTime, formatForumPostDate, forumActorName, forumAnonSerials, isClientForumTopicVisible, isOwnClientTopic, myClientForumTopics, sortClientForumTopics, sortClientTopicComments, topicAuthorDepartment, topicAuthorName, topicListThumbs, topicReplyCount, topicTitleText, visibleClientForumTopics } from './clientForum';

describe('client forum helpers', () => {
  it('keeps only published topics on the board', () => {
    const rows = visibleClientForumTopics(initialTopics, '二手论坛');
    expect(rows.every((item) => item.boardName === '二手论坛')).toBe(true);
    expect(rows.some((item) => item.title.includes('人体工学椅'))).toBe(true);
    expect(rows.some((item) => item.boardName === '建议论坛')).toBe(false);
  });

  it('hides off-shelf and rejected topics from C-end', () => {
    const chair = initialTopics.find((item) => item.title.includes('人体工学椅'))!;
    expect(isClientForumTopicVisible(chair)).toBe(true);
    expect(isClientForumTopicVisible({ ...chair, shelfStatus: 'off' })).toBe(false);
    expect(isClientForumTopicVisible({ ...chair, auditStatus: '待审核' })).toBe(false);
    const rejected = initialTopics.find((item) => item.title.includes('午间健身'))!;
    expect(rejected.auditStatus).toBe('已驳回');
    expect(isClientForumTopicVisible(rejected)).toBe(false);
    expect(visibleClientForumTopics(initialTopics, '建议论坛').some((item) => item.id === rejected.id)).toBe(false);
  });

  it('formats list time as M-D', () => {
    expect(formatForumListTime('2026-08-12 14:26')).toBe('8-12');
  });

  it('shows author department except for anonymous posts', () => {
    const chair = initialTopics.find((item) => item.title.includes('人体工学椅'))!;
    expect(topicAuthorName(chair)).toBe('周敏');
    expect(topicAuthorDepartment(chair)).toBe('市场品牌部');
    expect(formatForumPostDate(chair.publishedAt)).toBe('2026-08-12');
    expect(topicAuthorDepartment({ ...chair, authorAnonymous: true })).toBe('');
    const display = initialTopics.find((item) => item.title.includes('显示器转让'))!;
    expect(topicAuthorName(display)).toMatch(/^【匿名用户】\d{4}$/);
    expect(topicAuthorDepartment(display)).toBe('');
    const serials = forumAnonSerials(display);
    expect(serials.get('唐宇')).not.toBe(serials.get('方圆'));
    expect(topicAuthorName(display)).toBe(`【匿名用户】${serials.get('唐宇')}`);
    expect(forumActorName('方圆', true, serials.get('方圆'))).toBe(`【匿名用户】${serials.get('方圆')}`);
    expect(forumActorName('方圆', false)).toBe('方圆');
    expect(forumActorName(forumClientSelf, true)).toBe('我');
    expect(topicAuthorName({ ...display, author: forumClientSelf, authorAnonymous: true })).toBe('我');
  });

  it('prefixes associated tags before the topic title', () => {
    expect(topicTitleText({ title: '九成新人体工学椅转让，可自提', tags: ['闲置转让'] })).toBe(
      '九成新人体工学椅转让，可自提',
    );
    expect(topicTitleText({ title: '无标签帖', tags: [] })).toBe('无标签帖');
  });

  it('keeps pinned topics first', () => {
    const rows = sortClientForumTopics(visibleClientForumTopics(initialTopics, '二手论坛'), 'publish');
    expect(isTopicPinned(rows[0]!)).toBe(true);
    expect(rows[0]?.title).toContain('人体工学椅');
  });

  it('caps list thumbs at 3 by default and can show 5 with extras on the last cell', () => {
    expect(topicListThumbs([])).toEqual([]);
    expect(topicListThumbs(['a', 'b'])).toEqual([
      { src: 'a', extra: 0 },
      { src: 'b', extra: 0 },
    ]);
    expect(topicListThumbs(['a', 'b', 'c', 'd', 'e'])).toEqual([
      { src: 'a', extra: 0 },
      { src: 'b', extra: 0 },
      { src: 'c', extra: 2 },
    ]);
    expect(topicListThumbs(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 5)).toEqual([
      { src: 'a', extra: 0 },
      { src: 'b', extra: 0 },
      { src: 'c', extra: 0 },
      { src: 'd', extra: 0 },
      { src: 'e', extra: 2 },
    ]);
  });

  it('caps compose images at 9', () => {
    expect(capForumComposeImages(['a'], ['b', 'c'], 9)).toEqual(['a', 'b', 'c']);
    expect(capForumComposeImages(Array.from({ length: 8 }, (_, i) => String(i)), ['x', 'y'])).toHaveLength(9);
  });

  it('marks only the current user posts as own', () => {
    const mine = initialTopics.find((item) => item.author === '周敏' && !item.authorAnonymous)!;
    const other = initialTopics.find((item) => item.title.includes('显示器转让'))!;
    expect(isOwnClientTopic(mine)).toBe(true);
    expect(isOwnClientTopic(other)).toBe(false);
    expect(isOwnClientTopic({ ...mine, authorAnonymous: true })).toBe(true);
  });

  it('lists only the current user forum posts across boards', () => {
    const mine = myClientForumTopics(initialTopics);
    expect(mine.every((item) => item.author === '周敏')).toBe(true);
    expect(mine.some((item) => item.title.includes('人体工学椅'))).toBe(true);
    expect(mine.some((item) => item.title.includes('低糖早餐'))).toBe(true);
    expect(mine.some((item) => item.title.includes('晚班通勤'))).toBe(true);
    expect(mine.some((item) => item.title.includes('显示器'))).toBe(false);
    expect(mine.some((item) => item.boardName === '人才发展' || item.boardName === '经营发展')).toBe(false);
    expect(mine.map((item) => item.title)).toEqual([
      '九成新人体工学椅转让，可自提',
      '建议食堂增加低糖早餐选项',
      '建议增加晚班通勤班车',
    ]);
  });

  it('sums reply counts for a board', () => {
    const rows = visibleClientForumTopics(initialTopics, '二手论坛');
    expect(boardCommentCount(rows)).toBe(rows.reduce((sum, topic) => sum + topicReplyCount(topic), 0));
  });

  it('sorts topic comments by hot, chronological and reverse', () => {
    const comments = initialTopics[0]!.comments.map((item) =>
      item.id === 4 ? { ...item, likedBy: ['王涛'] } : { ...item, likedBy: [] },
    );
    expect(sortClientTopicComments(comments, 'hot')[0]?.id).toBe(4);
    expect(sortClientTopicComments(comments, 'hot')[1]?.id).toBe(14);
    expect(sortClientTopicComments(comments, 'asc')[0]?.id).toBe(1);
    expect(sortClientTopicComments(comments, 'desc')[0]?.id).toBe(14);
    const pinned = comments.map((item) => (item.id === 1 ? { ...item, pinned: true, likedBy: [] } : item));
    expect(sortClientTopicComments(pinned, 'hot')[0]?.id).toBe(1);
    expect(sortClientTopicComments(pinned, 'desc')[0]?.id).toBe(1);
  });

  it('flags assigned unread topics for the current user', () => {
    expect(clientNeedsReply(initialTopics[3]!)).toBe(true);
    expect(clientNeedsReply(initialTopics[0]!)).toBe(false);
    expect(clientNeedsReply(initialTopics[4]!)).toBe(false);
  });
});
