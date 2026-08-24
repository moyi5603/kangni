import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetExamResultsForTests } from '../model/clientExamResult';
import { PcExamRank } from './PcExamRank';

describe('PC exam rank', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('uses course PC detail layout for the leaderboard', () => {
    const html = renderToStaticMarkup(<PcExamRank id={6} />);

    expect(html).toContain('class="c-pc-shell is-exam is-rank"');
    expect(html).toContain('<h1 class="c-pc-header-title">考试排名</h1>');
    expect(html).toContain('class="c-pc-detail"');
    expect(html).toContain('class="c-pc-side"');
    expect(html).toContain('张悦');
    expect(html).toContain('李明');
    expect(html).not.toContain('18518168316');
    expect(html).not.toContain('18611927175');
    expect(html).toContain('本人');
    expect(html).toContain('用时：00:05');
    expect(html).toContain('100分');
    expect(html).toContain('c-pc-exam-rank-row is-me');
    expect(html).not.toContain('c-h5-exam-rank-row');
  });

  it('is mounted from CEndApp exam rank page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="exam-rank" examId={6} />);
    expect(html).toContain('class="c-pc-shell is-exam is-rank"');
    expect(html).toContain('考试排名');
  });
});
