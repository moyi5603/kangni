import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteStoreForTests } from '../../../voting/model/voteStore';
import { H5VoteRecord } from './H5VoteRecord';

beforeEach(() => {
  __resetVoteStoreForTests();
});

describe('H5 vote record snapshot', () => {
  it('shows the submitted answers, not live tallies or a submit bar', () => {
    const html = renderToStaticMarkup(<H5VoteRecord id={1} />);
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('团建目的地');
    expect(html).toContain('临安');
    expect(html).toContain('想去山里露营');
    expect(html).toContain('海报 A');
    expect(html).toContain('is-on');
    expect(html).not.toContain('>提交<');
    expect(html).not.toContain('实时结果');
    expect(html).not.toContain('安吉竹海');
  });

  it('hides records that are not the current voter', () => {
    expect(renderToStaticMarkup(<H5VoteRecord id={2} />)).toContain('记录不存在');
    expect(renderToStaticMarkup(<H5VoteRecord id={99} />)).toContain('记录不存在');
  });

  it('is mounted from CEndApp vote-record page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="vote-record" voteResponseId={1} />);
    expect(html).toContain('想去山里露营');
  });
});
