import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteStoreForTests, submitVoteResponse } from '../../../voting/model/voteStore';
import { H5VoteResults } from './H5VoteResults';

beforeEach(() => {
  __resetVoteStoreForTests();
});

const teamAnswers = [
  { questionId: 2, choiceIds: [3], text: '', score: null },
  { questionId: 3, choiceIds: [], text: '西湖', score: null },
  { questionId: 4, choiceIds: [], text: '', score: 5 },
  { questionId: 5, choiceIds: [8], text: '', score: null },
];

describe('H5 vote results', () => {
  it('shows live tallies and not the taking form', () => {
    const submitted = submitVoteResponse({
      campaignId: 2,
      voterId: '张悦',
      voterName: '张悦',
      answers: teamAnswers,
    });
    expect(submitted.ok).toBe(true);
    const html = renderToStaticMarkup(<H5VoteResults id={2} />);
    expect(html).toContain('<h1 class="c-h5-title">票数</h1>');
    expect(html).toContain('实时结果');
    expect(html).toContain('已收集');
    expect(html).toContain('本次');
    expect(html).toContain('再投一票');
    expect(html).toContain('href="#/c/h5/vote-2/take"');
    expect(html).not.toContain('西湖');
    expect(html).not.toContain('>提交<');
    expect(html).not.toContain('开始投票');
  });

  it('blocks missing and forbidden votes', () => {
    expect(renderToStaticMarkup(<H5VoteResults id={99} />)).toContain('投票不存在');
    expect(renderToStaticMarkup(<H5VoteResults id={3} />)).toContain('投票不存在');
    expect(renderToStaticMarkup(<H5VoteResults id={5} />)).toContain('无权参与该投票');
  });

  it('is mounted from CEndApp vote results page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="vote-results" voteId={2} />);
    expect(html).toContain('票数');
    expect(html).toContain('实时结果');
    expect(html).not.toContain('>提交<');
  });
});
