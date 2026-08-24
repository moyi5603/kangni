import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetExamResultsForTests } from '../model/clientExamResult';
import { H5ExamRank } from './H5ExamRank';

describe('H5 exam rank', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('renders the rank list 1:1', () => {
    const html = renderToStaticMarkup(<H5ExamRank id={6} />);

    expect(html).toContain('class="c-h5-shell is-exam is-rank"');
    expect(html).toContain('<h1 class="c-h5-title">考试排名</h1>');
    expect(html).toContain('张悦');
    expect(html).toContain('李明');
    expect(html).toContain('王芳');
    expect(html).toContain('陈伟');
    expect(html).not.toContain('18518168316');
    expect(html).not.toContain('18611927175');
    expect(html).toContain('本人');
    expect(html).toContain('用时：00:05');
    expect(html).toContain('用时：00:04');
    expect(html).toContain('用时：00:08');
    expect(html).toContain('100分');
    expect(html).toContain('c-h5-exam-rank-row is-me');
    expect(html).toContain('c-h5-exam-rank-medal is-2');
    expect(html).toContain('c-h5-exam-rank-medal is-1');
    expect(html).toContain('c-h5-exam-rank-medal is-3');
    expect(html).toContain('c-h5-exam-rank-no');
    expect(html.indexOf('张悦')).toBeLessThan(html.indexOf('李明'));
    expect(html).not.toContain('c-pc-exam-rank');
  });

  it('is mounted from CEndApp exam rank page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="exam-rank" examId={6} />);
    expect(html).toContain('class="c-h5-shell is-exam is-rank"');
    expect(html).toContain('考试排名');
  });
});
