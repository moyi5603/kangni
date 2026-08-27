import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetVoteStoreForTests } from '../../../voting/model/voteStore';
import { H5VoteTaking } from './H5VoteTaking';

beforeEach(() => {
  __resetVoteStoreForTests();
});

describe('H5 vote taking', () => {
  it('renders the survey form with a submit bar', () => {
    const html = renderToStaticMarkup(<H5VoteTaking id={2} />);
    expect(html).toContain('<h1 class="c-h5-title">投票</h1>');
    expect(html).toContain('1. 团建目的地');
    expect(html).toContain('临安');
    expect(html).toContain('还想补充的目的地？');
    expect(html).toContain('placeholder="请输入"');
    expect(html).toContain('对本次团建方案的满意度');
    expect(html).toContain('海报 A');
    expect(html).toContain('>提交<');
  });

  it('blocks taking when the campaign is not open to this user', () => {
    expect(renderToStaticMarkup(<H5VoteTaking id={1} />)).toContain('投票未开始');
    expect(renderToStaticMarkup(<H5VoteTaking id={3} />)).toContain('投票不存在');
    expect(renderToStaticMarkup(<H5VoteTaking id={5} />)).toContain('无权参与该投票');
    expect(renderToStaticMarkup(<H5VoteTaking id={99} />)).toContain('投票不存在');
  });

  it('is mounted from CEndApp vote taking page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="vote-taking" voteId={2} />);
    expect(html).toContain('>提交<');
    expect(html).toContain('团建目的地');
  });

  it('renders 创新项目投票 as left image and stacked title/subtitle', () => {
    const html = renderToStaticMarkup(<H5VoteTaking id={6} />);
    expect(html).toContain('请选择你支持的创新项目（可多选）');
    expect(html).toContain('is-image is-row');
    expect(html).toContain('c-h5-vote-choice-copy');
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
    const first = html.split('c-h5-vote-choice-copy')[1];
    const title = first.match(/<strong>([^<]*)<\/strong>/)?.[1] ?? '';
    const subtitle = first.match(/<em>([^<]*)<\/em>/)?.[1] ?? '';
    expect(title).toHaveLength(20);
    expect(subtitle).toHaveLength(50);
    expect(html.indexOf('<strong>')).toBeLessThan(html.indexOf('<em>'));
  });

  it('renders 优秀员工投票 as stacked people cards', () => {
    const html = renderToStaticMarkup(<H5VoteTaking id={7} />);
    expect(html).toContain('请选出本季度优秀员工');
    expect(html).toContain('is-image is-stack');
    expect(html).toContain('c-h5-vote-choices is-image is-stack');
    expect(html).toContain('张悦·前端组');
    expect(html).toContain('钱会·财务');
    const first = html.split('c-h5-vote-choice-copy')[1] ?? '';
    expect(first.match(/<em>([^<]*)<\/em>/)?.[1] ?? '').toHaveLength(50);
    expect((html.match(/c-h5-vote-person-avatar/g) ?? []).length).toBe(10);
  });
});
