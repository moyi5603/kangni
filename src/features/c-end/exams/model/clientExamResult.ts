import { getExam } from '../../../exams/model/examStore';
import { type ClientExamPaper, type ClientExamQuestion, getClientExamPaper } from './clientExamSession';

export const EXAM_RESULT_USER_ID = '18518168316';
export const EXAM_INCOMPLETE_MESSAGE = '请先答完所有题目';

export type ClientExamAnswers = Record<number, string>;

export type ClientExamResultView = {
  examId: number;
  userId: string;
  score: number;
  totalScore: number;
  passScore: number;
  passed: boolean;
  durationSeconds: number;
  accuracy: number;
  correctCount: number;
  rank: number;
  answers: ClientExamAnswers;
};

export type ReviewOptionState = 'idle' | 'right' | 'wrong';

export type ClientExamReviewOption = {
  letter: string;
  text: string;
  state: ReviewOptionState;
};

export type ClientExamReviewQuestion = {
  id: number;
  index: number;
  typeLabel: string;
  stem: string;
  correct: boolean;
  score: number;
  maxScore: number;
  myAnswerLetter: string;
  correctAnswerLetter: string;
  myAnswerText: string;
  correctAnswerText: string;
  options: ClientExamReviewOption[];
};

export type ClientExamReview = {
  examId: number;
  score: number;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  questions: ClientExamReviewQuestion[];
};

export type ClientExamRecordItem = {
  id: number;
  examId: number;
  title: string;
  score: number;
  submittedAt: string;
};

export type ClientExamRecordBoard = {
  examId: number;
  title: string;
  bestScore: number;
  hint: string;
  listHint: string;
  records: ClientExamRecordItem[];
};

export const EXAM_RECORD_HINT = '本次考试将保留最高分作为最终分数';
export const EXAM_RECORD_LIST_HINT = '考试记录（仅展示最近10次的考试记录）';

export type SubmitClientExamInput = {
  examId: number;
  answers: ClientExamAnswers;
  durationSeconds: number;
};

export type SubmitClientExamOutput =
  | { ok: true; result: ClientExamResultView }
  | { ok: false; message: string };

const results = new Map<number, ClientExamResultView>();
const records = new Map<number, ClientExamRecordItem[]>();
const DEMO_PASSED_EXAM_ID = 6;
let nextRecordId = 1;

function seedDemoPassedResult() {
  const exam = getExam(DEMO_PASSED_EXAM_ID);
  const paper = getClientExamPaper(DEMO_PASSED_EXAM_ID);
  if (!exam || !paper || results.has(DEMO_PASSED_EXAM_ID)) return;
  const answers = Object.fromEntries(paper.questions.map((item) => [item.id, item.options[0] ?? item.answer ?? '要点']));
  const submitted = submitClientExam({ examId: DEMO_PASSED_EXAM_ID, answers, durationSeconds: 480 });
  if (!submitted.ok) {
    results.set(DEMO_PASSED_EXAM_ID, {
      examId: DEMO_PASSED_EXAM_ID,
      userId: EXAM_RESULT_USER_ID,
      score: 86,
      totalScore: exam.totalScore ?? 100,
      passScore: exam.passScore,
      passed: true,
      durationSeconds: 480,
      accuracy: 86,
      correctCount: paper.questions.length,
      rank: 1,
      answers,
    });
  }
}

function formatExamRecordTime(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})(?::\d{2})?$/.exec(value.trim());
  return match ? match[1] : value;
}

function nowExamRecordTime(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function appendExamRecord(examId: number, title: string, score: number, submittedAt: string) {
  const next = [
    { id: nextRecordId++, examId, title, score, submittedAt: formatExamRecordTime(submittedAt) },
    ...(records.get(examId) ?? []),
  ].slice(0, 10);
  records.set(examId, next);
}

function seedDemoRecords() {
  const exam = getExam(DEMO_PASSED_EXAM_ID);
  const title = exam?.name ?? '项目管理认证';
  records.set(DEMO_PASSED_EXAM_ID, [
    { id: nextRecordId++, examId: DEMO_PASSED_EXAM_ID, title, score: 100, submittedAt: '2026-08-03 19:35' },
    { id: nextRecordId++, examId: DEMO_PASSED_EXAM_ID, title, score: 50, submittedAt: '2026-08-03 15:39' },
  ]);
}

export function __resetExamResultsForTests() {
  results.clear();
  records.clear();
  nextRecordId = 1;
  seedDemoPassedResult();
  seedDemoRecords();
}

export function getClientExamRecordBoard(examId: number): ClientExamRecordBoard | undefined {
  const exam = getExam(examId);
  const list = records.get(examId) ?? [];
  if (!exam && list.length === 0) return undefined;
  return {
    examId,
    title: exam?.name ?? list[0]?.title ?? '考试',
    bestScore: list.reduce((max, item) => Math.max(max, item.score), 0),
    hint: EXAM_RECORD_HINT,
    listHint: EXAM_RECORD_LIST_HINT,
    records: list,
  };
}

seedDemoPassedResult();
seedDemoRecords();

export function getClientExamResult(examId: number): ClientExamResultView | undefined {
  return results.get(examId);
}

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function letterOf(options: string[], value: string): string {
  const index = options.findIndex((item) => item === value);
  return index >= 0 ? optionLetter(index) : '';
}

export function getClientExamReview(examId: number): ClientExamReview | undefined {
  const result = getClientExamResult(examId);
  const paper = getClientExamPaper(examId);
  if (!result || !paper) return undefined;

  const questions = paper.questions.map((question) => {
    const mine = result.answers[question.id]?.trim() ?? '';
    const official = question.options[0] ?? question.answer ?? '';
    const correct = isQuestionCorrect(question, result.answers);
    return {
      id: question.id,
      index: question.index,
      typeLabel: question.typeLabel,
      stem: question.stem,
      correct,
      score: correct ? question.score : 0,
      maxScore: question.score,
      myAnswerLetter: letterOf(question.options, mine),
      correctAnswerLetter: letterOf(question.options, official),
      myAnswerText: mine,
      correctAnswerText: official,
      options: question.options.map((text, index) => {
        const letter = optionLetter(index);
        const isOfficial = text === official;
        const isMine = text === mine;
        return {
          letter,
          text,
          state: isOfficial ? 'right' : isMine ? 'wrong' : 'idle',
        };
      }),
    };
  });

  return {
    examId: result.examId,
    score: result.score,
    questionCount: paper.total,
    correctCount: result.correctCount,
    wrongCount: paper.total - result.correctCount,
    questions,
  };
}

export function unansweredQuestionIndexes(paper: ClientExamPaper, answers: ClientExamAnswers): number[] {
  return paper.questions.filter((item) => !answers[item.id]?.trim()).map((item) => item.index);
}

export function isExamPaperComplete(paper: ClientExamPaper, answers: ClientExamAnswers): boolean {
  return unansweredQuestionIndexes(paper, answers).length === 0;
}

export function isQuestionCorrect(question: ClientExamQuestion, answers: ClientExamAnswers): boolean {
  const value = answers[question.id]?.trim() ?? '';
  if (!value) return false;
  if (question.options.length === 0) return true;
  return value === question.options[0];
}

export function formatExamDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  if (safe < 60) return `${safe}秒`;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return seconds ? `${minutes}分${seconds}秒` : `${minutes}分`;
}

export function submitClientExam(input: SubmitClientExamInput): SubmitClientExamOutput {
  const exam = getExam(input.examId);
  const paper = getClientExamPaper(input.examId);
  if (!exam || !paper) return { ok: false, message: '考试不存在或未发布' };
  if (!isExamPaperComplete(paper, input.answers)) {
    return { ok: false, message: EXAM_INCOMPLETE_MESSAGE };
  }

  const correctCount = paper.questions.filter((item) => isQuestionCorrect(item, input.answers)).length;
  const totalScore = exam.totalScore ?? paper.questions.reduce((sum, item) => sum + item.score, 0);
  const score = Math.round((correctCount / paper.total) * totalScore);
  const result: ClientExamResultView = {
    examId: exam.id,
    userId: EXAM_RESULT_USER_ID,
    score,
    totalScore,
    passScore: exam.passScore,
    passed: score >= exam.passScore,
    durationSeconds: Math.max(0, Math.floor(input.durationSeconds)),
    accuracy: Math.round((correctCount / paper.total) * 100),
    correctCount,
    rank: 1,
    answers: input.answers,
  };
  results.set(exam.id, result);
  appendExamRecord(exam.id, exam.name, result.score, nowExamRecordTime());
  return { ok: true, result };
}
