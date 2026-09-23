import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteV2StoreForTests } from '../../../voting-v2/model/voteV2Store';
import { resetVoteV2Decoration } from '../../../voting-v2/model/voteV2DecorationStore';

beforeEach(() => {
  __resetVoteV2StoreForTests();
  resetVoteV2Decoration();
});

describe('PC vote v2 pages', () => {
  it('lists campaigns in the PC shell with my-records', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="votes-v2" />);
    expect(html).toContain('class="c-pc-shell is-vote is-vote-v2"');
    expect(html).toContain('<h1 class="c-pc-header-title">投票</h1>');
    expect(html).not.toContain('aria-label="轮播图"');
    expect(html).toContain('href="#/c/pc/vote-v2-4"');
    expect(html).not.toContain('href="#/c/h5/vote-v2-4"');
    expect(html).toContain('我的记录');
    expect(html).toContain('href="#/c/pc/votes-v2/mine"');
    expect(html).not.toContain('c-pc-vote-mine');
    expect(html.indexOf('aria-label="活动状态"')).toBeLessThan(html.indexOf('我的记录'));
    expect(html.indexOf('已结束')).toBeLessThan(html.indexOf('c-vote-records'));
    expect(html).toContain('c-pc-vote-grid is-left-image is-cols-2');
    expect(html).toContain('c-h5-vote-card is-left-image');
    expect(html).toContain('c-h5-vote-cover is-side');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('href="#/c/pc/vote-v2-4"');
    expect(html).toContain('c-h5-vote-cover');
    expect(html).toContain('src="/activities/share.jpg"');
    expect(html).toContain('src="/activities/open-day.jpg"');
    expect(html).not.toContain('查看详情');
    expect(html).not.toContain('c-h5-vote-cta');
    expect(html).not.toContain('去投票');
    expect(html).not.toContain('href="#/c/h5/vote-v2-4"');
    expect(html).not.toContain('c-h5-title');
  });

  it('opens the PC records list', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-v2-records" />);
    expect(html).toContain('<h1 class="c-pc-header-title">我的投票记录</h1>');
    expect(html).toContain('年度优秀作品展');
    expect(html).toContain('href="#/c/pc/vote-v2-3"');
    expect(html).not.toContain('href="#/c/h5/vote-v2-3"');
  });

  it('opens the PC home with PC option links and no share icon', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-v2-home" voteV2Id={2} />);
    expect(html).toContain('class="c-pc-shell is-vote is-vote-v2"');
    expect(html).toContain('c-pc-vote-v2-stage');
    expect(html).toContain('张工');
    expect(html).toContain('href="#/c/pc/vote-v2-2/option-1"');
    expect(html).not.toContain('aria-label="分享"');
    expect(html).toContain('c-pc-vote-nav');
    expect(html).not.toContain('href="#/c/h5/vote-v2-2/option-1"');
    expect(html).not.toContain('c-h5-title');
  });

  it('uses PC column settings on vote homes', () => {
    expect(renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-v2-home" voteV2Id={2} />)).toContain('data-cols="3"');
    expect(renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-v2-home" voteV2Id={4} />)).toContain('data-cols="4"');
    expect(renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-v2-home" voteV2Id={8} />)).toContain('data-cols="5"');
  });

  it('opens option detail with the vote CTA in the PC side column', () => {
    const html = renderToStaticMarkup(
      <CEndApp surface="pc" h5Page="vote-v2-option" voteV2Id={2} voteV2OptionId={1} />,
    );
    expect(html).toContain('c-pc-detail');
    expect(html).toContain('c-pc-side');
    expect(html).toContain('张工');
    expect(html).toContain('c-cta');
    expect(html.indexOf('c-cta')).toBeGreaterThan(html.indexOf('c-pc-side'));
    expect(html).not.toContain('c-h5-cta-bar');
    expect(html).not.toContain('aria-label="分享"');
  });
});
