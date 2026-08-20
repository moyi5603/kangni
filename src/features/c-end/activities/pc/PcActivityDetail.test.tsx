import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { restoreRelatedComments } from '../../../activities/model/related';
import { resetEngagement } from '../model/engagementStore';
import { PcActivityDetail } from './PcActivityDetail';

describe('PC activity detail', () => {
  afterEach(() => {
    resetEngagement();
    restoreRelatedComments();
  });

  it('keeps a two-column layout with CTA in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const article = html.indexOf('<article');
    const aside = html.indexOf('<aside class="c-pc-side">');
    const cta = html.indexOf('class="c-cta"');

    expect(html).toContain('c-pc-detail');
    expect(html).toContain('c-detail-info-card');
    expect(html).toContain('活动介绍');
    expect(html).toContain('发起人：');
    expect(html).toContain('活动限额：');
    expect(article).toBeGreaterThan(-1);
    expect(aside).toBeGreaterThan(article);
    expect(cta).toBeGreaterThan(aside);
  });

  it('does not keep core activity facts only in the aside', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));

    expect(aside).not.toContain('发起人：');
    expect(aside).not.toContain('联系电话：');
    expect(aside).toContain('class="c-cta"');
  });

  it('renders a missing activity as a recovery state', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={999999} />);

    expect(html).toContain('活动不存在');
    expect(html).toContain('返回列表');
    expect(html).not.toContain('c-pc-detail');
  });

  it('puts social actions above the signup CTA and lists comments in the article', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={2} />);
    const aside = html.slice(html.indexOf('<aside class="c-pc-side">'));
    const like = aside.indexOf('aria-label="点赞"');
    const cta = aside.indexOf('class="c-cta"');

    expect(like).toBeGreaterThan(-1);
    expect(like).toBeLessThan(cta);
    expect(html).toContain('id="activity-comments"');
  });

  it('lists open-day threads on detail without view-all', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={1} />);
    expect(html).not.toContain('查看全部');
    expect(html).toContain('说点什么…');
    expect(html).not.toContain('写评论');
    expect(html).toContain('纪念品柜台要排队。');
    expect(html).not.toContain('王芳 回复 张悦');
    expect(html).not.toContain('希望增加名额');
  });

  it('shows social tabs on activities with moments', () => {
    expect(renderToStaticMarkup(<PcActivityDetail id={1} />)).toContain('c-social-tab');
    expect(renderToStaticMarkup(<PcActivityDetail id={2} />)).toContain('c-social-tab');
  });

  it('hides the moments tab when empty and not submittable', () => {
    const html = renderToStaticMarkup(<PcActivityDetail id={12} />);
    expect(html).not.toContain('c-social-tab');
    expect(html).not.toContain('精彩瞬间');
    expect(html).toContain('id="activity-comments"');
  });
});
