import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { patchRelated, restoreRelatedComments } from '../../../activities/model/related';
import { commentCount, listActivityCommentThreads } from '../model/activityComments';
import { ActivityCommentList } from './ActivityCommentList';

describe('ActivityCommentList paging', () => {
  afterEach(() => {
    restoreRelatedComments();
  });

  it('omits heading when hideTitle and has compose, no view-all', () => {
    const html = renderToStaticMarkup(
      <ActivityCommentList
        threads={listActivityCommentThreads(1)}
        totalCount={commentCount(1)}
        onLike={() => undefined}
        onSubmit={() => undefined}
        onDelete={() => undefined}
        surface="h5"
        hideTitle
      />,
    );
    expect(html).not.toContain('activity-comments-title');
    expect(html).not.toContain('查看全部');
    expect(html).not.toContain('写评论');
    expect(html).toContain('说点什么…');
    expect(html).toContain('c-comment-composer-field');
    expect(html.indexOf('说点什么…')).toBeLessThan(html.indexOf('纪念品柜台要排队。'));
    expect(html).toContain('纪念品柜台要排队。');
    expect(html).toContain('志愿者很热情。');
    expect(html).not.toContain('洗手间指示不够。');
    expect(html).toContain('4月13日 10:19');
    expect(html).not.toMatch(/>2026-04-13 10:19:00</);
    expect(html.indexOf('4月13日 10:19')).toBeLessThan(html.indexOf('c-comment-like'));
    expect(html.indexOf('c-comment-like')).toBeLessThan(html.indexOf('c-comment-reply'));
  });

  it('shows first 10 roots only when more than a page exists', () => {
    patchRelated('comments', () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        activityId: 99,
        content: `主评${index + 1}`,
        author: '张悦',
        createdAt: `2026-08-18 ${String(10 + index).padStart(2, '0')}:00:00`,
        likedBy: [] as string[],
      })),
    );
    const threads = listActivityCommentThreads(99);
    expect(threads).toHaveLength(12);
    const html = renderToStaticMarkup(
      <ActivityCommentList
        threads={threads}
        totalCount={12}
        onLike={() => undefined}
        onSubmit={() => undefined}
        onDelete={() => undefined}
        surface="h5"
      />,
    );
    expect(html).toContain(threads[9]!.root.content);
    expect(html).not.toContain(threads[10]!.root.content);
    expect(html).toContain('data-comment-sentinel');
  });
});
