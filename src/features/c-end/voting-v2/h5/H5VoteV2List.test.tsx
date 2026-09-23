import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { CEndToastProvider } from '../../activities/components/CEndToast';
import dayjs from 'dayjs';
import { defaultVoteV2Campaign } from '../../../voting-v2/model/voteV2';
import { __resetVoteV2StoreForTests, upsertVoteV2 } from '../../../voting-v2/model/voteV2Store';
import { resetVoteV2Decoration, getVoteV2Decoration, saveVoteV2Decoration } from '../../../voting-v2/model/voteV2DecorationStore';
import { patchDecoBlock } from '../../../../shared/decoration/decoTypes';
import { H5VoteV2List } from './H5VoteV2List';

beforeEach(() => {
  __resetVoteV2StoreForTests();
  resetVoteV2Decoration();
});

describe('H5VoteV2List', () => {
  it('lists version-2 campaigns and links into the home page', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2List />
      </CEndToastProvider>,
    );
    expect(html).toContain('投票');
    expect(html).not.toContain('aria-label="轮播图"');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('食堂本周菜品');
    expect(html).toContain('href="#/c/h5/vote-v2-4"');
    expect(html).toContain('c-h5-vote-card is-left-image');
    expect(html).toContain('c-h5-vote-cover is-side');
    expect(html).toContain('c-h5-vote-cover');
    expect(html).toContain('src="/activities/share.jpg"');
    expect(html).toContain('src="/activities/open-day.jpg"');
    expect(html.indexOf('c-h5-vote-cover')).toBeLessThan(html.indexOf('车间安全之星'));
    expect(html).not.toContain('c-h5-vote-time is-stack');
    expect(html).toMatch(/\d{2}-\d{2} \d{2}:\d{2} ~ \d{2}-\d{2} \d{2}:\d{2}/);
    expect(html).not.toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(html).not.toContain('查看详情');
    expect(html).not.toContain('c-h5-vote-cta');
    expect(html).not.toContain('去投票');
    expect(html).toContain('c-h5-vote-status');
    const copy = html.slice(html.indexOf('c-h5-vote-copy'));
    expect(copy.indexOf('c-h5-vote-title')).toBeLessThan(copy.indexOf('c-h5-vote-status'));
    expect(copy.indexOf('c-h5-vote-status')).toBeLessThan(copy.indexOf('c-h5-vote-time'));
    expect(copy).toContain('c-pill is-ongoing');
    expect(html).toContain('我的记录');
    expect(html).toContain('href="#/c/h5/votes-v2/mine"');
    expect(html).not.toContain('c-h5-vote-mine');
    expect(html.indexOf('aria-label="活动状态"')).toBeLessThan(html.indexOf('我的记录'));
    expect(html.indexOf('已结束')).toBeLessThan(html.indexOf('c-vote-records'));
    expect(html).not.toContain('班组擂台赛');
    expect(html).not.toContain('部门团建目的地');
    expect(html).toContain('一线匠心人物');
    expect(html).toContain('href="#/c/h5/vote-v2-8"');
  });

  it('is mounted from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="votes-v2" />);
    expect(html).toContain('车间安全之星');
    expect(html).toContain('一线匠心人物');
  });

  it('lists a campaign upserted from admin store', () => {
    upsertVoteV2(
      defaultVoteV2Campaign({
        id: 88,
        name: '后台新建联动投票',
        startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        endAt: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        coverUrl: '/activities/share.jpg',
      }),
    );
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2List />
      </CEndToastProvider>,
    );
    expect(html).toContain('后台新建联动投票');
    expect(html).toContain('href="#/c/h5/vote-v2-88"');
  });

  it('applies two-col and scroll list styles on H5', () => {
    saveVoteV2Decoration('mobile', patchDecoBlock(getVoteV2Decoration('mobile'), 'deco-vote', { listStyle: 'two-col' }));
    expect(renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2List />
      </CEndToastProvider>,
    )).toContain('c-h5-list is-two-col');

    saveVoteV2Decoration('mobile', patchDecoBlock(getVoteV2Decoration('mobile'), 'deco-vote', { listStyle: 'scroll' }));
    expect(renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2List />
      </CEndToastProvider>,
    )).toContain('c-h5-list is-scroll');
  });

  it('hides vote card fields from decoration toggles', () => {
    saveVoteV2Decoration(
      'mobile',
      patchDecoBlock(getVoteV2Decoration('mobile'), 'deco-vote', {
        showTitle: false,
        showTime: false,
        showStatus: false,
      }),
    );
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5VoteV2List />
      </CEndToastProvider>,
    );
    expect(html).not.toContain('车间安全之星');
    expect(html).not.toContain('c-h5-vote-time');
    expect(html).not.toContain('c-h5-vote-status');
  });
});
