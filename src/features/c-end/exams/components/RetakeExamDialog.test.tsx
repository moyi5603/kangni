import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RETAKE_EXAM_HINT, RetakeExamDialog } from './RetakeExamDialog';

describe('retake exam dialog', () => {
  it('shows the warm hint and confirm link', () => {
    const html = renderToStaticMarkup(
      <RetakeExamDialog takeHref="#/c/h5/exam-6/take" onCancel={() => undefined} />,
    );

    expect(html).toContain('aria-label="温馨提示"');
    expect(html).toContain('温馨提示');
    expect(html).toContain(RETAKE_EXAM_HINT);
    expect(html).toContain('重新考试不会影响已考数据');
    expect(html).toContain('系统会保留最高分作为最终成绩');
    expect(html).toContain('确定重新考试吗');
    expect(html).toContain('href="#/c/h5/exam-6/take"');
    expect(html).toContain('确定');
    expect(html).toContain('取消');
  });
});
