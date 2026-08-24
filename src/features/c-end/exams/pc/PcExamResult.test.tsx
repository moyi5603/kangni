import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { getClientExamPaper } from '../model/clientExamSession';
import { submitClientExam, __resetExamResultsForTests } from '../model/clientExamResult';
import { PcExamResult } from './PcExamResult';

function submitFullPaper(examId: number) {
  const paper = getClientExamPaper(examId);
  if (!paper) throw new Error('missing paper');
  const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
  return submitClientExam({ examId, answers, durationSeconds: 5 });
}

describe('PC exam result', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('uses course PC detail layout for score breakdown', () => {
    expect(submitFullPaper(7).ok).toBe(true);
    const html = renderToStaticMarkup(<PcExamResult id={7} />);

    expect(html).toContain('class="c-pc-shell is-exam is-result"');
    expect(html).toContain('<h1 class="c-pc-header-title">考试结果</h1>');
    expect(html).toContain('class="c-pc-detail"');
    expect(html).toContain('class="c-pc-side"');
    expect(html).toContain('成绩明细');
    expect(html).toContain('c-detail-facts');
    expect(html).toContain('已通过');
    expect(html).toContain('18518168316');
    expect(html).toContain('得分：');
    expect(html).toContain('5秒');
    expect(html).toContain('1名');
    expect(html).toContain('回顾答题');
    expect(html).toContain('href="#/c/exam/7/review"');
    expect(html).toContain('class="c-cta is-exam-start"');
    expect(html).toContain('考试记录');
    expect(html).toContain('href="#/c/exam/7/records"');
    expect(html).not.toContain('c-h5-exam-result-book');
  });

  it('is mounted from CEndApp exam result page', () => {
    expect(submitFullPaper(7).ok).toBe(true);
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="exam-result" examId={7} />);
    expect(html).toContain('class="c-pc-shell is-exam is-result"');
    expect(html).toContain('考试结果');
  });
});
