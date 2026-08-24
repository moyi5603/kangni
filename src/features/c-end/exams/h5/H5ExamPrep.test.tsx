import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetExamStoreForTests, getExam, upsertExam } from '../../../exams/model/examStore';
import { getClientExamPaper } from '../model/clientExamSession';
import { submitClientExam, __resetExamResultsForTests } from '../model/clientExamResult';
import { H5ExamPrep } from './H5ExamPrep';

describe('H5 exam prep', () => {
  beforeEach(() => {
    __resetExamStoreForTests();
    __resetExamResultsForTests();
  });

  it('renders the start screen 1:1 chrome and copy', () => {
    const html = renderToStaticMarkup(<H5ExamPrep id={7} />);

    expect(html).toContain('class="c-h5-shell is-exam is-prep"');
    expect(html).toContain('<h1 class="c-h5-title">考试准备</h1>');
    expect(html).toContain('需求分析与PRD撰写能力考核');
    expect(html).toContain('总分');
    expect(html).toContain('10分');
    expect(html).toContain('及格分');
    expect(html).toContain('6分');
    expect(html).toContain('总题数');
    expect(html).toContain('10题');
    expect(html).toContain('考试时长');
    expect(html).toContain('100分钟');
    expect(html).toContain('考试次数');
    expect(html).toContain('总考试次数');
    expect(html).toContain('当前剩余');
    const times = html.indexOf('考试次数');
    const description = html.indexOf('考试说明');
    const rules = html.indexOf('考试规则');
    expect(description).toBeGreaterThan(times);
    expect(rules).toBeGreaterThan(description);
    expect(html).toContain('考核需求拆解与 PRD 结构');
    expect(html).toContain('考试规则');
    expect(html).toContain('本次考试开启了防切屏设置，切屏超过3次将会自动交卷(中途接打电话也属于切屏)');
    expect(html).toContain('href="#/c/h5/exam-7/take"');
    expect(html).toContain('开始考试');
  });

  it('is mounted from CEndApp exam prep page', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="exam-prep" examId={7} />);
    expect(html).toContain('class="c-h5-shell is-exam is-prep"');
    expect(html).toContain('考试准备');
  });

  it('hides exam description when markup is empty', () => {
    const exam = getExam(7);
    if (!exam) throw new Error('missing exam 7');
    upsertExam({ ...exam, descriptionHtml: '<p></p>' });

    const html = renderToStaticMarkup(<H5ExamPrep id={7} />);
    expect(html).not.toContain('考试说明');
  });

  it('disables start before the exam start time', () => {
    const exam = getExam(7);
    if (!exam) throw new Error('missing exam 7');
    upsertExam({ ...exam, startAt: '2026-12-31 09:00:00', examStatus: '未开始' });

    const html = renderToStaticMarkup(<H5ExamPrep id={7} />);
    expect(html).toContain('考试未开始');
    expect(html).toContain('disabled');
    expect(html).not.toContain('href="#/c/h5/exam-7/take"');
    expect(html).not.toContain('>开始考试<');
  });

  it('disables start when remaining times are zero', () => {
    const exam = getExam(7);
    if (!exam) throw new Error('missing exam 7');
    upsertExam({ ...exam, examTimes: 0 });

    const html = renderToStaticMarkup(<H5ExamPrep id={7} />);
    expect(html).toContain('次数已用完');
    expect(html).not.toContain('href="#/c/h5/exam-7/take"');
    expect(html).not.toContain('>开始考试<');
  });

  it('shows the score page on detail after a result exists', () => {
    const paper = getClientExamPaper(7);
    if (!paper) throw new Error('missing paper');
    const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
    expect(submitClientExam({ examId: 7, answers, durationSeconds: 5 }).ok).toBe(true);

    const html = renderToStaticMarkup(<H5ExamPrep id={7} />);
    expect(html).toContain('class="c-h5-shell is-exam is-result"');
    expect(html).toContain('<h1 class="c-h5-title">考试结果</h1>');
    expect(html).not.toContain('开始考试');
  });
});
