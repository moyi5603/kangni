import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteStoreForTests } from '../../../voting/model/voteStore';
import { H5VoteRecords } from './H5VoteRecords';

beforeEach(() => {
  __resetVoteStoreForTests();
});

describe('H5 vote records', () => {
  it('lists own responses as links to the intro page with 开始投票', () => {
    const html = renderToStaticMarkup(<H5VoteRecords />);
    expect(html).toContain('<h1 class="c-h5-title">我的投票记录</h1>');
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('href="#/c/h5/vote-2"');
    expect(html).not.toContain('href="#/c/h5/vote-2/take"');
    expect(html).not.toContain('href="#/c/h5/votes/mine/1"');
  });

  it('is mounted from CEndApp vote-records page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="vote-records" />);
    expect(html).toContain('href="#/c/h5/vote-2"');
  });
});
