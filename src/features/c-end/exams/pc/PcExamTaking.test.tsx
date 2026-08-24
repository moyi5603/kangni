import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { getClientExamPaper } from '../model/clientExamSession';
import { PcExamTaking } from './PcExamTaking';

describe('PC exam taking', () => {
  it('uses course PC detail layout with side answer sheet', () => {
    const html = renderToStaticMarkup(<PcExamTaking id={7} />);

    expect(html).toContain('class="c-pc-shell is-exam is-taking"');
    expect(html).toContain('<h1 class="c-pc-header-title">考试中</h1>');
    expect(html).toContain('class="c-pc-detail"');
    expect(html).toContain('class="c-pc-side"');
    expect(html).toContain('c-pc-exam-syllabus');
    expect(html).toContain('答题卡');
    expect(html).toContain('c-pc-exam-sheet');
    expect(html).toContain('aria-label="第 3 题 判断题"');
    expect(html).not.toContain('c-pc-exam-lesson');
    expect(html).not.toContain('未答');
    expect(html).toContain('>3<');
    expect(html).toContain('/ 10 题');
    expect(html).toContain('99:45');
    expect(html).toContain('Nginx可以作为反向代理服务器和负载均衡器');
    expect(html).toContain('（1分）');
    expect(html).toContain('正确');
    expect(html).toContain('错误');
    expect(html).toContain('上一题');
    expect(html).toContain('下一题');
    expect(html).not.toContain('c-h5-exam-paper');
  });

  it('is mounted from CEndApp exam taking page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="exam-taking" examId={7} />);
    expect(html).toContain('class="c-pc-shell is-exam is-taking"');
    expect(html).toContain('考试中');
  });

  it('changes the last-question action to 立即交卷', () => {
    const html = renderToStaticMarkup(<PcExamTaking id={7} initialIndex={9} />);
    expect(html).toContain('立即交卷');
    expect(html).not.toContain('下一题');
  });

  it('marks answered sheet items as done', () => {
    const paper = getClientExamPaper(7);
    if (!paper) throw new Error('missing paper 7');
    const first = paper.questions[0];
    const html = renderToStaticMarkup(
      <PcExamTaking id={7} initialAnswers={{ [first.id]: first.options[0] ?? '答' }} />,
    );

    expect(html).toContain('c-pc-exam-sheet-item is-done');
    expect(html).toContain('已答 1/10');
  });
});
