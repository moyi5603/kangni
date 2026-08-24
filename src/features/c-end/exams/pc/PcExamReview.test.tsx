import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { getClientExamPaper } from '../model/clientExamSession';
import { submitClientExam, __resetExamResultsForTests } from '../model/clientExamResult';
import { PcExamReview } from './PcExamReview';

function submitWithNginxWrong() {
  const paper = getClientExamPaper(7);
  if (!paper) throw new Error('missing paper');
  const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
  answers[paper.questions[2].id] = '错误';
  return submitClientExam({ examId: 7, answers, durationSeconds: 8 });
}

describe('PC exam review', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('uses course PC detail layout for question review', () => {
    expect(submitWithNginxWrong().ok).toBe(true);
    const html = renderToStaticMarkup(<PcExamReview id={7} />);

    expect(html).toContain('class="c-pc-shell is-exam is-review"');
    expect(html).toContain('<h1 class="c-pc-header-title">考试回顾</h1>');
    expect(html).toContain('class="c-pc-detail"');
    expect(html).toContain('class="c-pc-side"');
    expect(html).toContain('只看错题');
    expect(html).toContain('第 3 题');
    expect(html).toContain('答错');
    expect(html).toContain('Nginx可以作为反向代理服务器和负载均衡器');
    expect(html).toContain('您的答案：B');
    expect(html).toContain('正确答案：A');
    expect(html).toContain('class="c-cta is-exam-start"');
    expect(html).toContain('返回结果页');
    expect(html).toContain('href="#/c/exam/7/result"');
    expect(html).not.toContain('c-h5-exam-result-book');
  });

  it('is mounted from CEndApp exam review page', () => {
    expect(submitWithNginxWrong().ok).toBe(true);
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="exam-review" examId={7} />);
    expect(html).toContain('class="c-pc-shell is-exam is-review"');
    expect(html).toContain('考试回顾');
  });
});
