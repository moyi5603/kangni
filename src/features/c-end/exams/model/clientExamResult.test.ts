import { beforeEach, describe, expect, it } from 'vitest';
import { getClientExamPaper } from './clientExamSession';
import {
  EXAM_RESULT_USER_ID,
  formatExamDuration,
  getClientExamRecordBoard,
  getClientExamResult,
  getClientExamReview,
  isExamPaperComplete,
  submitClientExam,
  unansweredQuestionIndexes,
  __resetExamResultsForTests,
} from './clientExamResult';

describe('client exam result', () => {
  beforeEach(() => {
    __resetExamResultsForTests();
  });

  it('requires every question to be filled before submit', () => {
    const paper = getClientExamPaper(7);
    expect(paper).toBeDefined();
    if (!paper) return;

    expect(isExamPaperComplete(paper, {})).toBe(false);
    expect(unansweredQuestionIndexes(paper, {})).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const filled = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '答']));
    expect(isExamPaperComplete(paper, filled)).toBe(true);
    expect(submitClientExam({ examId: 7, answers: {}, durationSeconds: 5 })).toEqual({
      ok: false,
      message: '请先答完所有题目',
    });
  });

  it('grades a full paper and stores the result page model', () => {
    const paper = getClientExamPaper(7);
    expect(paper).toBeDefined();
    if (!paper) return;

    const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
    const submitted = submitClientExam({ examId: 7, answers, durationSeconds: 5 });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;

    expect(submitted.result).toMatchObject({
      examId: 7,
      userId: EXAM_RESULT_USER_ID,
      totalScore: 10,
      passScore: 6,
      durationSeconds: 5,
      passed: true,
      rank: 1,
    });
    expect(submitted.result.score).toBeGreaterThan(0);
    expect(getClientExamResult(7)).toEqual(submitted.result);
    expect(formatExamDuration(5)).toBe('5秒');
  });

  it('builds a review model that flags a wrong choice', () => {
    const paper = getClientExamPaper(7);
    expect(paper).toBeDefined();
    if (!paper) return;

    const nginx = paper.questions[2];
    const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? '要点']));
    answers[nginx.id] = '错误';
    expect(submitClientExam({ examId: 7, answers, durationSeconds: 8 }).ok).toBe(true);

    const review = getClientExamReview(7);
    expect(review?.questionCount).toBe(10);
    expect(review?.correctCount).toBe(9);
    expect(review?.wrongCount).toBe(1);
    expect(review?.questions[2]).toMatchObject({
      index: 3,
      typeLabel: '判断题',
      correct: false,
      myAnswerLetter: 'B',
      correctAnswerLetter: 'A',
    });
  });

  it('uses real official text for essay and fill-in review', () => {
    const paper = getClientExamPaper(5);
    expect(paper).toBeDefined();
    if (!paper) return;
    const answers = Object.fromEntries(paper.questions.map((item) => [item.id, '挑战是范围蔓延，通过变更评审控制。']));
    expect(submitClientExam({ examId: 5, answers, durationSeconds: 12 }).ok).toBe(true);

    const review = getClientExamReview(5);
    expect(review?.questions[0].correctAnswerText).toBe(paper.questions[0].answer);
    expect(review?.questions.every((item) => item.correctAnswerText !== '参考要点')).toBe(true);
    expect(review?.questions[0].correctAnswerText.length).toBeGreaterThan(12);
  });

  it('keeps the latest 10 records and uses the highest score on the board', () => {
    const board = getClientExamRecordBoard(6);
    expect(board?.title).toBe('项目管理认证');
    expect(board?.bestScore).toBe(100);
    expect(board?.records).toHaveLength(2);
    expect(board?.records.map((item) => item.score)).toEqual([100, 50]);
    expect(board?.records[0]).toMatchObject({
      title: '项目管理认证',
      submittedAt: '2026-08-03 19:35',
    });
    expect(board?.hint).toBe('本次考试将保留最高分作为最终分数');

    const paper = getClientExamPaper(7);
    expect(paper).toBeDefined();
    if (!paper) return;
    const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? item.answer ?? '答']));
    expect(submitClientExam({ examId: 7, answers, durationSeconds: 5 }).ok).toBe(true);
    expect(getClientExamRecordBoard(7)?.records).toHaveLength(1);
    expect(getClientExamRecordBoard(7)?.records[0].title).toBe('需求分析与PRD撰写能力考核');
  });
});
