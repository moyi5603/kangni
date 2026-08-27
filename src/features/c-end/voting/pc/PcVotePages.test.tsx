import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteStoreForTests, submitVoteResponse } from '../../../voting/model/voteStore';

beforeEach(() => {
  __resetVoteStoreForTests();
});

const teamAnswers = [
  { questionId: 2, choiceIds: [3], text: '', score: null },
  { questionId: 3, choiceIds: [], text: '西湖', score: null },
  { questionId: 4, choiceIds: [], text: '', score: 5 },
  { questionId: 5, choiceIds: [8], text: '', score: null },
];

describe('PC vote pages', () => {
  it('lists visible ordinary votes in the PC shell', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="votes" />);
    expect(html).toContain('class="c-pc-shell is-vote"');
    expect(html).toContain('<h1 class="c-pc-header-title">投票</h1>');
    expect(html).toContain('我的记录');
    expect(html).toContain('href="#/c/pc/votes/mine"');
    expect(html).toContain('href="#/c/pc/vote-2"');
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('去投票');
    expect(html).not.toContain('href="#/c/h5/vote-2"');
    expect(html).not.toContain('工装颜色连投测试');
    expect(html).not.toContain('评优');
  });

  it('opens the intro page with 开始投票 on PC hashes', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-detail" voteId={2} />);
    expect(html).toContain('class="c-pc-shell is-vote is-detail"');
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('开始投票');
    expect(html).toContain('href="#/c/pc/vote-2/take"');
    expect(html).toContain('href="#/c/pc/vote-2/results"');
    expect(html).toContain('c-pc-vote-nav');
    expect(html).toContain('c-pc-vote-board');
    expect(html).toContain('c-pc-detail');
    expect(html).toContain('c-pc-side');
    expect(html).toContain('c-quota-line');
    expect(html).toContain('今日已投 0 / 可投 2');
    expect(html).not.toContain('c-h5-vote-quota');
    expect(html.indexOf('开始投票')).toBeGreaterThan(html.indexOf('c-pc-side'));
    expect(html).toContain('投票规则');
    expect(html).not.toContain('提交后立刻查看实时占比');
    expect(html).not.toContain('问答题不公开他人原文');
    expect(html).not.toContain('允许评论');
    expect(html).not.toContain('不允许评论');
    expect(html).not.toContain('href="#/c/h5/vote-2/take"');
    expect(html).not.toContain('>提交<');
  });

  it('renders the taking form on PC', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-taking" voteId={2} />);
    expect(html).toContain('class="c-pc-shell is-vote is-detail"');
    expect(html).toContain('1. 团建目的地');
    expect(html).toContain('>提交<');
    expect(html).toContain('c-pc-detail');
    expect(html).toContain('c-pc-side');
    expect(html).not.toContain('c-h5-title');
  });

  it('shows live results on PC', () => {
    expect(submitVoteResponse({ campaignId: 2, voterId: '张悦', voterName: '张悦', answers: teamAnswers }).ok).toBe(true);
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-results" voteId={2} />);
    expect(html).toContain('实时结果');
    expect(html).toContain('href="#/c/pc/vote-2/take"');
    expect(html).not.toContain('西湖');
  });

  it('links records to the PC intro page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="vote-records" />);
    expect(html).toContain('<h1 class="c-pc-header-title">我的投票记录</h1>');
    expect(html).toContain('href="#/c/pc/vote-2"');
    expect(html).not.toContain('href="#/c/h5/vote-2"');
    expect(html).not.toContain('href="#/c/pc/vote-2/take"');
  });
});
