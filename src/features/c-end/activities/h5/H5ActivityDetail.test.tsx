import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { restoreRelatedComments } from '../../../activities/model/related';
import { submitActivityComment } from '../model/activityComments';
import { resetEngagement } from '../model/engagementStore';
import { H5ActivityDetail } from './H5ActivityDetail';

describe('H5 activity detail engage', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('puts social actions left of signup CTA and shows comment tabs', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const bar = html.slice(html.indexOf('c-h5-cta-bar'));
    const like = bar.indexOf('aria-label="点赞"');
    const fav = bar.indexOf('aria-label="收藏"');
    const comment = bar.indexOf('aria-label="评论"');
    const cta = bar.indexOf('class="c-cta"');

    expect(like).toBeGreaterThan(-1);
    expect(fav).toBeGreaterThan(like);
    expect(comment).toBeGreaterThan(fav);
    expect(cta).toBeGreaterThan(comment);
    expect(html).toContain('id="activity-social"');
    expect(html).toContain('评论 26');
    expect(html).toContain('精彩瞬间');
    expect(html).toContain('纪念品柜台要排队。');
    expect(html).not.toContain('开场致辞很有感染力');
  });

  it('lists all open-day threads on detail without view-all', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'));
    expect(block).not.toContain('查看全部');
    expect(block).toContain('说点什么…');
    expect(block).not.toContain('写评论');
    expect(block).toContain('纪念品柜台要排队。');
    expect(block).toContain('馆内WIFI稳。');
    expect(block).not.toContain('洗手间指示不够。');
    expect(block).not.toContain('王芳 回复 张悦');
    expect(block).not.toContain('希望增加名额');
    expect(block).toContain('回复');
    expect(block).toContain('c-avatar');
    expect(html).toContain('c-social-tab');
  });

  it('shows delete for own comments with confirm closed', () => {
    expect(submitActivityComment(1, '我的楼')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityDetail id={1} />);
    const block = html.slice(html.indexOf('id="activity-comments"'));
    expect(block).toContain('删除');
    expect(block).not.toContain('确认删除');
  });

  it('lists camp threads including two-layer replies on detail', () => {
    const html = renderToStaticMarkup(<H5ActivityDetail id={2} />);
    expect(html).toContain('评论 6');
    expect(html).not.toContain('查看全部');
    expect(html).toContain('食堂窗口排队有点长。');
    expect(html).toContain('结业证书什么时候发？');
    expect(html).toContain('实操课节奏合适');
    expect(html).toContain('王芳 回复 苏然');
    expect(html).toContain('陈产品 回复 王芳');
  });

  it('shows full comments when CEndApp opens an activity', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" activityId={1} />);
    expect(html).toContain('纪念品柜台要排队。');
  });
});
