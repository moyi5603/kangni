import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteV2StoreForTests } from '../../../voting-v2/model/voteV2Store';
import { H5VoteV2Records } from './H5VoteV2Records';

beforeEach(() => {
  __resetVoteV2StoreForTests();
});

describe('H5VoteV2Records', () => {
  it('lists campaigns the current user has voted in', () => {
    const html = renderToStaticMarkup(<H5VoteV2Records />);
    expect(html).toContain('<h1 class="c-h5-title">我的投票记录</h1>');
    expect(html).toContain('年度优秀作品展');
    expect(html).toContain('c-h5-vote-card is-left-image');
    expect(html).toContain('c-h5-vote-cover is-side');
    expect(html).not.toContain('is-large-image');
    expect(html).not.toContain('is-left-text');
    expect(html).toContain('src="/activities/basketball.jpg"');
    expect(html).toContain('href="#/c/h5/vote-v2-3"');
    expect(html).not.toContain('车间安全之星');
    expect(html).not.toContain('班组擂台赛');
  });

  it('is mounted from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="vote-v2-records" />);
    expect(html).toContain('href="#/c/h5/vote-v2-3"');
  });
});
