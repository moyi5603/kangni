import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteStoreForTests, submitVoteResponse } from '../../../voting/model/voteStore';
import { H5VoteDetail } from './H5VoteDetail';

beforeEach(() => {
  __resetVoteStoreForTests();
});

const teamAnswers = [
  { questionId: 2, choiceIds: [3], text: '', score: null },
  { questionId: 3, choiceIds: [], text: '西湖', score: null },
  { questionId: 4, choiceIds: [], text: '', score: 5 },
  { questionId: 5, choiceIds: [8], text: '', score: null },
];

describe('H5 vote detail', () => {
  it('shows campaign info and 开始投票, not the form', () => {
    const html = renderToStaticMarkup(<H5VoteDetail id={2} />);
    expect(html).toContain('<h1 class="c-h5-title">部门团建目的地</h1>');
    expect(html).toContain('研发中心团建地点投票');
    expect(html).toContain('进行中');
    expect(html).toContain('今日已投 0 / 可投 2');
    expect(html).toContain('题目');
    expect(html).toContain('4题');
    expect(html).toContain('投票规则');
    expect(html).toContain('每人每天能投 2 次');
    expect(html).not.toContain('提交后立刻查看实时占比');
    expect(html).not.toContain('问答题不公开他人原文');
    expect(html).not.toContain('允许评论');
    expect(html).not.toContain('不允许评论');
    expect(html).toContain('评论');
    expect(html).toContain('说点什么…');
    expect(html).toContain('希望能早点定下来。');
    expect(html).toContain('临安近一点。');
    expect(html).toContain('回复');
    expect(html).toContain('c-activity-comments');
    expect(html).not.toContain('发表评论');
    expect(html).not.toContain('还没有评论');
    expect(html).not.toContain('题目概览');
    expect(html).toContain('开始投票');
    expect(html).toContain('href="#/c/h5/vote-2/take"');
    expect(html).toContain('查看票数');
    expect(html).toContain('href="#/c/h5/vote-2/results"');
    expect(html).not.toContain('placeholder="请输入"');
    expect(html).not.toContain('>提交<');
    expect(html).not.toContain('1. 团建目的地');
    expect(html).not.toContain('实时结果');
  });

  it('disables start when the vote has not begun', () => {
    const html = renderToStaticMarkup(<H5VoteDetail id={1} />);
    expect(html).toContain('午餐口味征集');
    expect(html).toContain('disabled');
    expect(html).toContain('未开始');
    expect(html).not.toContain('开始投票');
    expect(html).not.toContain('川菜');
    expect(html).not.toContain('说点什么…');
    expect(html).not.toContain('不允许评论');
    expect(html).not.toContain('提交后立刻查看实时占比');
    expect(html).not.toContain('问答题不公开他人原文');
  });

  it('shows empty states for missing, contest, and out-of-range votes', () => {
    expect(renderToStaticMarkup(<H5VoteDetail id={99} />)).toContain('投票不存在');
    expect(renderToStaticMarkup(<H5VoteDetail id={3} />)).toContain('投票不存在');
    expect(renderToStaticMarkup(<H5VoteDetail id={5} />)).toContain('无权参与该投票');
  });

  it('keeps intro after a submit and links to 查看票数, not live bars', () => {
    const submitted = submitVoteResponse({
      campaignId: 2,
      voterId: '张悦',
      voterName: '张悦',
      answers: teamAnswers,
    });
    expect(submitted.ok).toBe(true);
    const html = renderToStaticMarkup(<H5VoteDetail id={2} />);
    expect(html).toContain('今日已投 1 / 可投 2');
    expect(html).toContain('再投一票');
    expect(html).toContain('href="#/c/h5/vote-2/take"');
    expect(html).toContain('查看票数');
    expect(html).toContain('href="#/c/h5/vote-2/results"');
    expect(html).not.toContain('已收集');
    expect(html).not.toContain('实时结果');
    expect(html).not.toContain('西湖');
    expect(html).not.toContain('>提交<');
  });

  it('is mounted from CEndApp vote detail page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="vote-detail" voteId={2} />);
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('开始投票');
    expect(html).not.toContain('>提交<');
  });
});
