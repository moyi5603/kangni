import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { getClientExamPaper } from '../model/clientExamSession';
import { submitClientExam, __resetExamResultsForTests } from '../model/clientExamResult';
import { H5ExamResult } from './H5ExamResult';

function submitFullPaper(examId: number) {
  const paper = getClientExamPaper(examId);
  if (!paper) throw new Error('missing paper');
  const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
  return submitClientExam({ examId, answers, durationSeconds: 5 });
}

describe('H5 exam result', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('renders the result chrome 1:1 after a complete submit', () => {
    expect(submitFullPaper(7).ok).toBe(true);
    const html = renderToStaticMarkup(<H5ExamResult id={7} />);

    expect(html).toContain('class="c-h5-shell is-exam is-result"');
    expect(html).toContain('<h1 class="c-h5-title">考试结果</h1>');
    expect(html).toContain('已通过');
    expect(html).toContain('18518168316');
    expect(html).toContain('得分');
    expect(html).toContain('总分');
    expect(html).toContain('及格分');
    expect(html).toContain('答题时长');
    expect(html).toContain('5秒');
    expect(html).toContain('正确率');
    expect(html).toContain('答对题数');
    expect(html).toContain('当前排名');
    expect(html).toContain('1名');
    expect(html).toContain('回顾答题');
    expect(html).toContain('href="#/c/h5/exam-7/review"');
    expect(html).toContain('考试记录');
    expect(html).toContain('href="#/c/h5/exam-7/records"');
  });

  it('is mounted from CEndApp exam result page', () => {
    expect(submitFullPaper(7).ok).toBe(true);
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="exam-result" examId={7} />);
    expect(html).toContain('class="c-h5-shell is-exam is-result"');
    expect(html).toContain('考试结果');
  });
});
