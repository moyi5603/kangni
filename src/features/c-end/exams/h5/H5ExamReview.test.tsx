import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { getClientExamPaper } from '../model/clientExamSession';
import { submitClientExam, __resetExamResultsForTests } from '../model/clientExamResult';
import { H5ExamReview } from './H5ExamReview';

function submitWithNginxWrong() {
  const paper = getClientExamPaper(7);
  if (!paper) throw new Error('missing paper');
  const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
  answers[paper.questions[2].id] = '错误';
  return submitClientExam({ examId: 7, answers, durationSeconds: 8 });
}

describe('H5 exam review', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('renders the review chrome 1:1 after submit', () => {
    expect(submitWithNginxWrong().ok).toBe(true);
    const html = renderToStaticMarkup(<H5ExamReview id={7} />);

    expect(html).toContain('class="c-h5-shell is-exam is-review"');
    expect(html).toContain('<h1 class="c-h5-title">考试回顾</h1>');
    expect(html).toContain('总题数');
    expect(html).toContain('答对');
    expect(html).toContain('答错');
    expect(html).toContain('只看错题');
    expect(html).toContain('第 3 题');
    expect(html).toContain('答错');
    expect(html).toContain('Nginx可以作为反向代理服务器和负载均衡器');
    expect(html).toContain('class="c-h5-exam-review-keys"');
    expect(html).toContain('class="c-h5-exam-review-key is-mine">您的答案 B</p>');
    expect(html).toContain('class="c-h5-exam-review-key is-ok">正确答案 A</p>');
    const nginx = html.slice(html.indexOf('Nginx可以作为反向代理服务器和负载均衡器'));
    expect(nginx.indexOf('您的答案 B')).toBeLessThan(nginx.indexOf('正确答案 A'));
    expect(html).toContain('返回结果页');
    expect(html).toContain('href="#/c/h5/exam-7/result"');
  });

  it('is mounted from CEndApp exam review page', () => {
    expect(submitWithNginxWrong().ok).toBe(true);
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="exam-review" examId={7} />);
    expect(html).toContain('class="c-h5-shell is-exam is-review"');
    expect(html).toContain('考试回顾');
  });
});
