import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetExamResultsForTests } from '../model/clientExamResult';
import { PcExamRecords } from './PcExamRecords';

describe('PC exam records', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('uses course PC detail layout for attempt history', () => {
    const html = renderToStaticMarkup(<PcExamRecords id={6} />);

    expect(html).toContain('class="c-pc-shell is-exam is-records"');
    expect(html).toContain('<h1 class="c-pc-header-title">考试记录</h1>');
    expect(html).toContain('class="c-pc-detail"');
    expect(html).toContain('class="c-pc-side"');
    expect(html).toContain('考试记录（仅展示最近10次的考试记录）');
    expect(html).toContain('项目管理认证');
    expect(html).toContain('2026-08-03 19:35');
    expect(html).toContain('100分');
    expect(html).toContain('50分');
    expect(html).toContain('本次考试将保留最高分作为最终分数');
    expect(html).toContain('查看排名');
    expect(html).toContain('href="#/c/exam/6/rank"');
    expect(html).toContain('重新考试');
    expect(html).toContain('class="c-cta is-exam-start"');
    expect(html).not.toContain('href="#/c/exam/6/take"');
    expect(html).not.toContain('温馨提示');
    expect(html).toContain('href="#/c/exam/6/result"');
    expect(html).not.toContain('c-h5-exam-records-list');
    expect(html).not.toContain('c-h5-exam-result-book');
  });

  it('is mounted from CEndApp exam records page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="pc" h5Page="exam-records" examId={6} />);
    expect(html).toContain('class="c-pc-shell is-exam is-records"');
    expect(html).toContain('考试记录');
    expect(html).toContain('重新考试');
  });
});
